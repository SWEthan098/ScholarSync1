from fastapi import APIRouter, HTTPException, Query
from app.database import get_db
from app.models.schemas import OpportunityOut, UserOpportunityUpdate

router = APIRouter(prefix="/opportunities", tags=["opportunities"])


@router.get("/", response_model=list[OpportunityOut])
async def list_opportunities(
    type: str = Query(None),
    limit: int = Query(20)
):
    db = get_db()
    query = db.table("opportunities").select("*").order("deadline")
    if type:
        query = query.eq("type", type)
    result = query.limit(limit).execute()
    return result.data or []


@router.get("/recommended/{user_id}", response_model=list[OpportunityOut])
async def get_recommended(user_id: str):
    db = get_db()
    user = db.table("users").select("*").eq("id", user_id).single().execute().data
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    career = user.get("career_interest", "")
    result = db.table("opportunities").select("*").order("deadline").limit(20).execute()
    opps = result.data or []

    if career:
        matched = [o for o in opps if career.lower() in (o.get("title") or "").lower()
                   or career.lower() in (o.get("description") or "").lower()]
        unmatched = [o for o in opps if o not in matched]
        opps = (matched + unmatched)[:5]
    else:
        opps = opps[:5]

    return opps


@router.post("/{opportunity_id}/apply/{user_id}")
async def track_application(user_id: str, opportunity_id: str, payload: UserOpportunityUpdate):
    db = get_db()
    db.table("user_opportunities").upsert({
        "user_id": user_id,
        "opportunity_id": opportunity_id,
        "status": payload.status,
        "amount_received": payload.amount_received,
        "applied_at": "now()" if payload.status == "applied" else None,
    }, on_conflict="user_id,opportunity_id").execute()
    return {"success": True}


@router.get("/user/{user_id}")
async def get_user_opportunities(user_id: str):
    db = get_db()
    result = db.table("user_opportunities") \
        .select("*, opportunities(*)") \
        .eq("user_id", user_id) \
        .execute()
    return result.data or []