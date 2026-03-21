from fastapi import APIRouter, Query
from app.services.levels_scraper import get_salaries
from app.models.schemas import SalaryOut

router = APIRouter(prefix="/salaries", tags=["salaries"])


@router.get("/", response_model=list[SalaryOut])
async def salary_lookup(
    role: str = Query(None),
    company: str = Query(None)
):
    return await get_salaries(role=role, company=company)