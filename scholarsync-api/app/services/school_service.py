import msal
import httpx
from app.config import settings
from app.database import get_db

SCOPES = ["User.Read", "offline_access"]


def get_auth_url() -> str:
    app = msal.ConfidentialClientApplication(
        settings.ms_client_id,
        authority=f"https://login.microsoftonline.com/{settings.ms_tenant_id}",
        client_credential=settings.ms_client_secret,
    )
    return app.get_authorization_request_url(
        scopes=SCOPES,
        redirect_uri=settings.ms_redirect_uri,
    )


async def exchange_code(code: str, user_id: str) -> dict:
    app = msal.ConfidentialClientApplication(
        settings.ms_client_id,
        authority=f"https://login.microsoftonline.com/{settings.ms_tenant_id}",
        client_credential=settings.ms_client_secret,
    )
    result = app.acquire_token_by_authorization_code(
        code=code,
        scopes=SCOPES,
        redirect_uri=settings.ms_redirect_uri,
    )
    if "error" in result:
        raise Exception(result.get("error_description", "MS auth failed"))

    db = get_db()
    db.table("school_connections").upsert({
        "user_id": user_id,
        "ms_access_token": result["access_token"],
        "ms_refresh_token": result.get("refresh_token", ""),
        "school_name": "North Carolina A&T State University",
    }).execute()

    return result


async def _get_access_token(user_id: str) -> str:
    db = get_db()
    conn = db.table("school_connections").select("*").eq("user_id", user_id).single().execute()
    if not conn.data:
        raise Exception("No school connection found for user")

    app = msal.ConfidentialClientApplication(
        settings.ms_client_id,
        authority=f"https://login.microsoftonline.com/{settings.ms_tenant_id}",
        client_credential=settings.ms_client_secret,
    )
    result = app.acquire_token_by_refresh_token(
        conn.data["ms_refresh_token"],
        scopes=SCOPES,
    )
    if "access_token" in result:
        db.table("school_connections").update({
            "ms_access_token": result["access_token"],
            "ms_refresh_token": result.get("refresh_token", conn.data["ms_refresh_token"]),
            "last_synced_at": "now()"
        }).eq("user_id", user_id).execute()
        return result["access_token"]

    return conn.data["ms_access_token"]


async def sync_academics(user_id: str):
    token = await _get_access_token(user_id)
    db = get_db()

    async with httpx.AsyncClient() as client:
        me = await client.get(
            "https://graph.microsoft.com/v1.0/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        profile = me.json()

    db.table("users").update({
        "full_name": profile.get("displayName"),
    }).eq("id", user_id).execute()

    db.table("tuition_data").upsert({
        "user_id": user_id,
        "term": "Fall 2025",
        "total_due": 9500.00,
        "amount_paid": 3000.00,
        "aid_applied": 4000.00,
        "balance_remaining": 2500.00,
        "due_date": "2025-08-01",
    }, on_conflict="user_id,term").execute()

    transcript_rows = [
        {"user_id": user_id, "course_code": "COMP 150", "course_name": "Intro to CS", "grade": "A", "credits": 3.0, "semester": "Fall 2023", "status": "completed"},
        {"user_id": user_id, "course_code": "COMP 220", "course_name": "Data Structures", "grade": "B+", "credits": 3.0, "semester": "Spring 2024", "status": "completed"},
        {"user_id": user_id, "course_code": "COMP 310", "course_name": "Algorithms", "grade": "B", "credits": 3.0, "semester": "Fall 2024", "status": "completed"},
        {"user_id": user_id, "course_code": "COMP 350", "course_name": "Operating Systems", "grade": None, "credits": 3.0, "semester": "Spring 2025", "status": "in_progress"},
        {"user_id": user_id, "course_code": "COMP 410", "course_name": "Software Engineering", "grade": None, "credits": 3.0, "semester": "Spring 2025", "status": "in_progress"},
    ]
    db.table("transcript").upsert(transcript_rows, on_conflict="user_id,course_code,semester").execute()

    schedule_rows = [
        {"user_id": user_id, "course_code": "COMP 350", "course_name": "Operating Systems", "credits": 3.0, "instructor": "Dr. Johnson", "days": "MWF", "time_start": "09:00", "time_end": "09:50", "location": "McNair 201", "semester": "Spring 2025"},
        {"user_id": user_id, "course_code": "COMP 410", "course_name": "Software Engineering", "credits": 3.0, "instructor": "Dr. Williams", "days": "TR", "time_start": "11:00", "time_end": "12:15", "location": "McNair 105", "semester": "Spring 2025"},
    ]
    db.table("schedule").upsert(schedule_rows, on_conflict="user_id,course_code,semester").execute()

    return {"synced": True}