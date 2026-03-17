import httpx
from datetime import datetime, timedelta
from app.database import get_db

LEVELS_URL = "https://www.levels.fyi/js/salaryData.json"

TARGET_ROLES = [
    "Software Engineer", "Data Scientist", "Data Engineer",
    "Cybersecurity Engineer", "Cloud Engineer",
    "Machine Learning Engineer", "Product Manager",
]

TARGET_LEVELS = ["L3", "L4", "SWE I", "SWE II", "New Grad", "Entry Level", "Junior"]

TOP_COMPANIES = [
    "Google", "Microsoft", "Amazon", "Meta", "Apple",
    "Netflix", "Salesforce", "IBM", "Oracle", "Cisco",
    "Deloitte", "Accenture", "Capital One", "JPMorgan", "Bank of America",
]


async def scrape_and_cache():
    db = get_db()

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.get(
            LEVELS_URL,
            headers={"User-Agent": "Mozilla/5.0 (compatible; ScholarSync/1.0)"}
        )
        response.raise_for_status()
        data = response.json()

    rows = []
    seen = set()

    for entry in data:
        company = entry.get("company", "").strip()
        title = entry.get("title", "").strip()
        level = entry.get("level", "").strip()
        location = entry.get("location", "").strip()

        if company not in TOP_COMPANIES:
            continue
        if not any(role.lower() in title.lower() for role in TARGET_ROLES):
            continue
        if not any(lvl.lower() in level.lower() for lvl in TARGET_LEVELS):
            continue

        key = (company, title, level, location)
        if key in seen:
            continue
        seen.add(key)

        try:
            base = float(entry.get("basesalary", 0) or 0)
            tc = float(entry.get("totalyearlycompensation", 0) or 0)
        except (ValueError, TypeError):
            continue

        if base < 40000 or tc < 40000:
            continue

        rows.append({
            "company": company,
            "role": title,
            "level": level,
            "base_salary": base,
            "total_comp": tc,
            "location": location,
            "yoe_min": 0,
            "yoe_max": 2,
            "source_url": "https://www.levels.fyi",
            "cached_at": datetime.utcnow().isoformat(),
        })

    if rows:
        db.table("salary_data").upsert(
            rows,
            on_conflict="company,role,level,location"
        ).execute()

    return len(rows)


async def get_salaries(role: str = None, company: str = None) -> list:
    db = get_db()

    latest = db.table("salary_data").select("cached_at") \
        .order("cached_at", desc=True).limit(1).execute()

    cache_stale = True
    if latest.data:
        cached_at = datetime.fromisoformat(latest.data[0]["cached_at"].replace("Z", ""))
        cache_stale = datetime.utcnow() - cached_at > timedelta(hours=24)

    if cache_stale:
        await scrape_and_cache()

    query = db.table("salary_data").select("*")
    if role:
        query = query.ilike("role", f"%{role}%")
    if company:
        query = query.ilike("company", f"%{company}%")

    result = query.order("total_comp", desc=True).limit(50).execute()
    return result.data or []