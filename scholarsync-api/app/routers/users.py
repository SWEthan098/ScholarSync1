from fastapi import APIRouter, HTTPException
from app.database import get_db
from app.models.schemas import UserCreate, UserUpdate, UserOut

router = APIRouter(prefix="/users", tags=["users"])


@router.post("/", response_model=UserOut)
async def create_user(payload: UserCreate):
    db = get_db()
    result = db.table("users").insert(payload.model_dump()).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to create user")
    return result.data[0]


@router.get("/{user_id}", response_model=UserOut)
async def get_user(user_id: str):
    db = get_db()
    result = db.table("users").select("*").eq("id", user_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")
    return result.data


@router.patch("/{user_id}", response_model=UserOut)
async def update_user(user_id: str, payload: UserUpdate):
    db = get_db()
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    result = db.table("users").update(updates).eq("id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")
    return result.data[0]