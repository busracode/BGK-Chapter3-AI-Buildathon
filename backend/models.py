from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, DateTime, Float
from datetime import datetime, timezone
import uuid
from database import Base

def generate_uuid():
    return str(uuid.uuid4())

def get_utc_now():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    age = Column(Integer, nullable=False)
    city = Column(String, nullable=True)
    role = Column(String, nullable=False) # "genç" or "büyük"
    primary_emotion = Column(String, nullable=True)
    experience_tags = Column(String, nullable=True) # JSON or CSV string
    hobbies = Column(String, nullable=True) # JSON or CSV string
    life_experiences = Column(String, nullable=True) # JSON or CSV string
    personality_summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=get_utc_now)

class MatchRequest(Base):
    __tablename__ = "match_requests"
    id = Column(String, primary_key=True, default=generate_uuid)
    young_id = Column(String, ForeignKey("users.id"))
    elder_id = Column(String, ForeignKey("users.id"))
    status = Column(String, default="pending") # pending, accepted, rejected
    resonance_score = Column(Float, nullable=True)
    created_at = Column(DateTime, default=get_utc_now)

class JournalEntry(Base):
    __tablename__ = "journal_entries"
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"))
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=get_utc_now)

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(String, primary_key=True, default=generate_uuid)
    session_id = Column(String, nullable=False)
    user_id = Column(String, ForeignKey("users.id"))
    crisis_level = Column(String, nullable=False)
    trigger_text = Column(Text, nullable=True)
    resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=get_utc_now)
