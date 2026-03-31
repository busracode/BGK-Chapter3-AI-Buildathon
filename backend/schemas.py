from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from dataclasses import dataclass

class UserCreate(BaseModel):
    username: Optional[str] = None
    name: str
    surname: Optional[str] = None
    age: int
    city: Optional[str] = None
    role: str # "genç" or "büyük"
    current_mood_text: Optional[str] = None  # For NLP analysis (genç)
    
    model_config = ConfigDict(from_attributes=True)
    # Elder text processed first, direct insert for Elder:
    hobbies: Optional[List[str]] = None
    interests: Optional[List[str]] = None
    speaking_style: Optional[str] = None
    expertise_level: Optional[str] = None
    life_experiences: Optional[List[str]] = None
    personality_summary: Optional[str] = None
    password: Optional[str] = None # For young
    picture_password: Optional[str] = None # For elderly (comma-separated IDs)

class UserUpdate(BaseModel):
    name: Optional[str] = None
    surname: Optional[str] = None
    age: Optional[int] = None
    city: Optional[str] = None
    interests: Optional[str] = None
    expertise_level: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)

class UserLogin(BaseModel):
    username: str # Changed from name
    password: Optional[str] = None
    picture_password: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    username: str
    name: str
    surname: Optional[str] = None
    age: int
    city: Optional[str] = None
    role: str
    primary_emotion: Optional[str] = None
    experience_tags: Optional[str] = None
    hobbies: Optional[str] = None
    interests: Optional[str] = None
    speaking_style: Optional[str] = None
    expertise_level: Optional[str] = None
    personality_summary: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

@dataclass
class ElderProfileExtract:
    name: str
    surname: str
    age: int
    city: str
    life_experiences: list[str]
    hobbies: list[str]
    interests: list[str]
    speaking_style: str
    expertise_level: str
    personality_summary: str

class MatchRequestSchema(BaseModel):
    id: str
    young_id: str
    elder_id: str
    status: str
    resonance_score: Optional[float] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class JournalEntryCreate(BaseModel):
    content: str
    
class JournalEntryResponse(BaseModel):
    id: str
    user_id: str
    content: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class AlertResponse(BaseModel):
    id: str
    session_id: str
    user_id: str
    crisis_level: str
    trigger_text: Optional[str] = None
    resolved: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class UserStats(BaseModel):
    session_count: int
    journal_count: int
