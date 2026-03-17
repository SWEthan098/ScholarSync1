from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date, datetime
from uuid import UUID


class UserCreate(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    major: Optional[str] = None
    school_year: Optional[str] = None
    gpa: Optional[float] = None
    career_interest: Optional[str] = None


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    major: Optional[str] = None
    school_year: Optional[str] = None
    gpa: Optional[float] = None
    career_interest: Optional[str] = None


class UserOut(BaseModel):
    id: UUID
    email: str
    full_name: Optional[str]
    major: Optional[str]
    school_year: Optional[str]
    gpa: Optional[float]
    career_interest: Optional[str]
    school_name: Optional[str]
    created_at: datetime


class TransactionOut(BaseModel):
    id: UUID
    amount: float
    merchant_name: Optional[str]
    category: Optional[str]
    date: date
    ai_flag: Optional[str]
    ai_note: Optional[str]


class FinanceSummary(BaseModel):
    total_balance: float
    monthly_spending: float
    top_categories: list[dict]
    tuition_remaining: float
    aid_applied: float
    estimated_debt_payoff_years: Optional[float]
    transactions: list[dict]


class TranscriptCourse(BaseModel):
    course_code: str
    course_name: str
    grade: Optional[str]
    credits: float
    semester: str
    status: str


class ScheduleCourse(BaseModel):
    course_code: str
    course_name: str
    credits: float
    instructor: Optional[str]
    days: Optional[str]
    time_start: Optional[str]
    time_end: Optional[str]
    location: Optional[str]


class AcademicsOut(BaseModel):
    gpa: Optional[float]
    total_credits_earned: float
    current_schedule: list[dict]
    transcript: list[dict]
    tuition: Optional[dict]
    droppable_courses: list[dict]


class OpportunityOut(BaseModel):
    id: UUID
    title: str
    type: str
    company_org: Optional[str]
    amount: Optional[float]
    deadline: Optional[date]
    location: Optional[str]
    remote: bool
    url: Optional[str]
    description: Optional[str]


class UserOpportunityUpdate(BaseModel):
    status: str
    amount_received: Optional[float] = None


class SalaryOut(BaseModel):
    company: str
    role: str
    level: str
    base_salary: Optional[float]
    total_comp: Optional[float]
    location: Optional[str]
    cached_at: datetime


class VoiceHistoryOut(BaseModel):
    id: UUID
    transcript: str
    ai_response: str
    created_at: datetime