from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import RedirectResponse
from app.services import school_service
from app.database import get_db
from app.config import settings

router = APIRouter(prefix="/school", tags=["school"])


@router.get("/login")
async def school_login(user_id: str = Query(...)):
    auth_url = school_service.get_auth_url()
    return RedirectResponse(url=f"{auth_url}&state={user_id}")


@router.get("/callback")
async def school_callback(code: str = Query(...), state: str = Query(...)):
    try:
        await school_service.exchange_code(code, user_id=state)
        await school_service.sync_academics(user_id=state)
        return RedirectResponse(url=f"{settings.frontend_url}/dashboard?school=connected")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/sync/{user_id}")
async def sync_academics(user_id: str):
    try:
        result = await school_service.sync_academics(user_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/academics/{user_id}")
async def get_academics(user_id: str):
    db = get_db()

    transcript = db.table("transcript").select("*").eq("user_id", user_id).execute().data or []
    schedule = db.table("schedule").select("*").eq("user_id", user_id).execute().data or []
    tuition = db.table("tuition_data").select("*").eq("user_id", user_id) \
        .order("updated_at", desc=True).limit(1).execute().data

    grade_points = {"A": 4.0, "A-": 3.7, "B+": 3.3, "B": 3.0, "B-": 2.7,
                    "C+": 2.3, "C": 2.0, "C-": 1.7, "D": 1.0, "F": 0.0}
    completed = [c for c in transcript if c["status"] == "completed" and c.get("grade")]
    if completed:
        total_points = sum(grade_points.get(c["grade"], 0) * c["credits"] for c in completed)
        total_credits = sum(c["credits"] for c in completed)
        gpa = round(total_points / total_credits, 2) if total_credits else None
    else:
        gpa = None

    total_credits_earned = sum(c["credits"] for c in completed)

    droppable = []
    for course in [c for c in transcript if c["status"] == "in_progress"]:
        droppable.append({
            "course_code": course["course_code"],
            "course_name": course["course_name"],
            "reason": "Review if this course is required for your major this semester.",
            "drop_deadline": "2025-03-15"
        })

    return {
        "gpa": gpa,
        "total_credits_earned": total_credits_earned,
        "current_schedule": schedule,
        "transcript": transcript,
        "tuition": tuition[0] if tuition else None,
        "droppable_courses": droppable
    }
@router.post("/mock-sync/{user_id}")
async def mock_sync(user_id: str):
    """
    Seed mock academic data for a user without Microsoft SSO.
    Use this for demo purposes.
    """
    db = get_db()

    db.table("tuition_data").upsert({
        "user_id": user_id,
        "term": "Spring 2025",
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

    return {"synced": True, "message": "Mock academic data loaded successfully"}
