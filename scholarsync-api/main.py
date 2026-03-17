from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from contextlib import asynccontextmanager

from app.config import settings
from app.routers import users, teller, school, opportunities, salaries, voice
from app.services.levels_scraper import scrape_and_cache


scheduler = AsyncIOScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Schedule nightly scrape at 2am — skip on startup to avoid blocking boot
    scheduler.add_job(scrape_and_cache, "cron", hour=2, minute=0)
    scheduler.start()
    yield
    scheduler.shutdown()


app = FastAPI(
    title="ScholarSync API",
    description="Financial wellness and career planning API for college students in tech.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(teller.router)
app.include_router(school.router)
app.include_router(opportunities.router)
app.include_router(salaries.router)
app.include_router(voice.router)


@app.get("/")
async def root():
    return {"status": "ScholarSync API is live"}


@app.get("/health")
async def health():
    return {"status": "ok"}