from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class UserCreate(BaseModel):
    name: str
    age: int
    city: Optional[str] = None
    role: str # "genç" or "büyük"
    current_mood_text: Optional[str] = None  # For NLP analysis (genç)
    # Elder text processed first, direct insert for Elder:
    hobbies: Optional[List[str]] = None
    life_experiences: Optional[List[str]] = None
    personality_summary: Optional[str] = None

class UserLogin(BaseModel):
    user_id: str

class UserResponse(BaseModel):
    id: str
    name: str
    age: int
    city: Optional[str] = None
    role: str
    primary_emotion: Optional[str] = None
    experience_tags: Optional[str] = None
    hobbies: Optional[str] = None
    life_experiences: Optional[str] = None
    personality_summary: Optional[str] = None
    created_at: datetime

class MatchRequestSchema(BaseModel):
    id: str
    young_id: str
    elder_id: str
    status: str
    resonance_score: Optional[float] = None
    created_at: datetime

    class Config:
        orm_mode = True

class JournalEntryCreate(BaseModel):
    content: str
    
class JournalEntryResponse(BaseModel):
    id: str
    user_id: str
    content: str
    created_at: datetime

class AlertResponse(BaseModel):
    id: str
    session_id: str
    user_id: str
    crisis_level: str
    trigger_text: Optional[str] = None
    resolved: bool
    created_at: datetime
