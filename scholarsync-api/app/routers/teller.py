from fastapi import APIRouter, HTTPException
from app.models.schemas import FinanceSummary
from app.services import teller_service
from app.database import get_db
from pydantic import BaseModel

router = APIRouter(prefix="/bank", tags=["bank"])


class EnrollmentRequest(BaseModel):
    user_id: str
    access_token: str
    institution_name: str = "Bank of America"


@router.post("/enroll")
async def enroll(payload: EnrollmentRequest):
    try:
        await teller_service.save_enrollment(
            payload.user_id,
            payload.access_token,
            payload.institution_name,
        )
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/accounts/{user_id}")
async def get_accounts(user_id: str):
    try:
        return await teller_service.get_accounts(user_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/balances/{user_id}")
async def get_balances(user_id: str):
    try:
        return await teller_service.get_balances(user_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/finance/{user_id}", response_model=FinanceSummary)
async def get_finance_summary(user_id: str):
    db = get_db()

    await teller_service.sync_transactions(user_id)

    balances = await teller_service.get_balances(user_id)
    total_balance = sum(
        float(b["available"] or b["ledger"] or 0)
        for b in balances
        if b["account_type"] == "depository"
    )

    txn_result = db.table("transactions") \
        .select("*") \
        .eq("user_id", user_id) \
        .order("date", desc=True) \
        .limit(100) \
        .execute()
    transactions = txn_result.data or []

    monthly_spending = sum(t["amount"] for t in transactions if t["amount"] > 0)

    category_totals: dict = {}
    for t in transactions:
        cat = t.get("category") or "Other"
        category_totals[cat] = category_totals.get(cat, 0) + max(t["amount"], 0)
    top_categories = sorted(
        [{"category": k, "total": round(v, 2)} for k, v in category_totals.items()],
        key=lambda x: x["total"],
        reverse=True
    )[:5]

    tuition_result = db.table("tuition_data") \
        .select("*") \
        .eq("user_id", user_id) \
        .order("updated_at", desc=True) \
        .limit(1) \
        .execute()
    tuition = tuition_result.data[0] if tuition_result.data else {}

    return FinanceSummary(
        total_balance=round(total_balance, 2),
        monthly_spending=round(monthly_spending, 2),
        top_categories=top_categories,
        tuition_remaining=tuition.get("balance_remaining", 0) or 0,
        aid_applied=tuition.get("aid_applied", 0) or 0,
        estimated_debt_payoff_years=None,
        transactions=transactions,
    )