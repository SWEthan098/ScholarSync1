import httpx
from app.config import settings
from app.database import get_db

TELLER_BASE = "https://api.teller.io"


def _client(access_token: str) -> httpx.Client:
    return httpx.Client(
        cert=(settings.teller_cert_path, settings.teller_key_path),
        auth=(access_token, ""),
        timeout=15,
    )


async def save_enrollment(user_id: str, access_token: str, institution_name: str):
    db = get_db()
    db.table("bank_connections").upsert({
        "user_id": user_id,
        "plaid_access_token": access_token,
        "plaid_item_id": "teller",
        "institution_name": institution_name,
    }, on_conflict="user_id").execute()


async def get_accounts(user_id: str) -> list:
    db = get_db()
    conn = db.table("bank_connections").select("*").eq("user_id", user_id).single().execute()
    if not conn.data:
        return []

    access_token = conn.data["plaid_access_token"]
    with _client(access_token) as client:
        response = client.get(f"{TELLER_BASE}/accounts")
        response.raise_for_status()
        return response.json()


async def get_balances(user_id: str) -> list:
    accounts = await get_accounts(user_id)
    db = get_db()
    conn = db.table("bank_connections").select("*").eq("user_id", user_id).single().execute()
    access_token = conn.data["plaid_access_token"]

    balances = []
    with _client(access_token) as client:
        for account in accounts:
            bal_url = account["links"]["balances"]
            bal_resp = client.get(bal_url)
            if bal_resp.status_code == 200:
                bal_data = bal_resp.json()
                balances.append({
                    "account_id": account["id"],
                    "account_name": account["name"],
                    "account_type": account["type"],
                    "account_subtype": account["subtype"],
                    "last_four": account["last_four"],
                    "available": bal_data.get("available"),
                    "ledger": bal_data.get("ledger"),
                })
    return balances


async def sync_transactions(user_id: str) -> list:
    accounts = await get_accounts(user_id)
    db = get_db()
    conn = db.table("bank_connections").select("*").eq("user_id", user_id).single().execute()
    access_token = conn.data["plaid_access_token"]

    all_rows = []
    with _client(access_token) as client:
        for account in accounts:
            txn_url = account["links"]["transactions"]
            txn_resp = client.get(txn_url)
            if txn_resp.status_code != 200:
                continue

            for txn in txn_resp.json():
                all_rows.append({
                    "user_id": user_id,
                    "plaid_txn_id": txn["id"],
                    "amount": float(txn["amount"]),
                    "merchant_name": txn.get("description") or txn.get("details", {}).get("counterparty"),
                    "category": txn.get("details", {}).get("category"),
                    "subcategory": txn.get("details", {}).get("subcategory"),
                    "date": txn["date"],
                })

    if all_rows:
        db.table("transactions").upsert(all_rows, on_conflict="plaid_txn_id").execute()
        db.table("bank_connections").update(
            {"last_synced_at": "now()"}
        ).eq("user_id", user_id).execute()

    return all_rows