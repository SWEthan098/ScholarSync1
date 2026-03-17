from app.database import get_db


async def build_student_context(user_id: str) -> str:
    db = get_db()

    user = db.table("users").select("*").eq("id", user_id).single().execute().data or {}
    tuition = db.table("tuition_data").select("*").eq("user_id", user_id) \
        .order("updated_at", desc=True).limit(1).execute().data
    tuition = tuition[0] if tuition else {}

    transactions = db.table("transactions").select("*").eq("user_id", user_id) \
        .order("date", desc=True).limit(20).execute().data or []

    transcript = db.table("transcript").select("*").eq("user_id", user_id).execute().data or []
    schedule = db.table("schedule").select("*").eq("user_id", user_id).execute().data or []

    opportunities = db.table("user_opportunities") \
        .select("status, opportunities(title, type, amount, deadline)") \
        .eq("user_id", user_id).execute().data or []

    category_totals: dict = {}
    for t in transactions:
        cat = t.get("category") or "Other"
        category_totals[cat] = category_totals.get(cat, 0) + max(t.get("amount", 0), 0)
    top_spend = sorted(category_totals.items(), key=lambda x: x[1], reverse=True)[:3]
    spend_str = ", ".join(f"{cat}: ${round(amt, 0)}" for cat, amt in top_spend)

    current_courses = list(set(
        [c["course_name"] for c in transcript if c.get("status") == "in_progress"] +
        [s["course_name"] for s in schedule]
    ))

    context = f"""
You are ScholarSync, a financial wellness and career advisor for college students in tech.
Always be encouraging, direct, and actionable. Keep answers concise — 2-4 sentences max unless asked for detail.

STUDENT PROFILE:
- Name: {user.get('full_name', 'Student')}
- School: {user.get('school_name', 'North Carolina A&T State University')}
- Major: {user.get('major', 'Not set')}
- Year: {user.get('school_year', 'Not set')}
- GPA: {user.get('gpa', 'Not set')}
- Career interest: {user.get('career_interest', 'Not set')}

FINANCIAL SNAPSHOT:
- Tuition balance remaining: ${tuition.get('balance_remaining', 'Unknown')}
- Aid applied: ${tuition.get('aid_applied', 'Unknown')}
- Top spending categories (last 90 days): {spend_str or 'No data yet'}

ACADEMICS:
- Current courses: {', '.join(current_courses) or 'Not synced yet'}
- Total credits earned: {sum(c.get('credits', 0) for c in transcript if c.get('status') == 'completed')}

OPPORTUNITIES TRACKED:
{chr(10).join(f"- {o['opportunities']['title']} ({o['status']})" for o in opportunities if o.get('opportunities')) or '- None tracked yet'}

Answer the student's question using this context. If you reference specific numbers, use the data above.
If asked something outside this context, say you don't have that data yet and suggest they sync their accounts.
""".strip()

    return context