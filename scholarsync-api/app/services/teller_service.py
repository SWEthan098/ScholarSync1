import httpx
import base64
import os
import tempfile
from app.config import settings
from app.database import get_db

TELLER_BASE = "https://api.teller.io"


def _get_cert_files():
    """Decode base64 certs from env vars and write to temp files."""
    cert_b64 = os.environ.get("TELLER_CERT_B64")
    key_b64 = os.environ.get("TELLER_KEY_B64")

    if cert_b64 and key_b64:
        cert_path = "/tmp/teller_cert.pem"
        key_path = "/tmp/teller_key.pem"
        with open(cert_path, "wb") as f:
            f.write(base64.b64decode(cert_b64))
        with open(key_path, "wb") as f:
            f.write(base64.b64decode(key_b64))
        return cert_path, key_path

    return settings.teller_cert_path, settings.teller_key_path


def _client(access_token: str) -> httpx.Client:
    cert, key = _get_cert_files()
    return httpx.Client(
        cert=(cert, key),
        auth=(access_token, ""),
        timeout=15,
    )


async def save_enrollment(user_id: str, access_token: str, institution_name: str):
    db = get_db()
    
    # Check if connection exists
    existing = db.table("bank_connections").select("id").eq("user_id", user_id).execute()
    
    if existing.data:
        db.table("bank_connections").update({
            "plaid_access_token": access_token,
            "plaid_item_id": "teller",
            "institution_name": institution_name,
        }).eq("user_id", user_id).execute()
    else:
        db.table("bank_connections").insert({
            "user_id": user_id,
            "plaid_access_token": access_token,
            "plaid_item_id": "teller",
            "institution_name": institution_name,
        }).execute()


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