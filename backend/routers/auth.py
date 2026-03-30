from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from database import get_db
from models import User
from schemas import UserCreate, UserLogin, UserResponse
from services.nlp_engine import analyze_emotion

router = APIRouter()

@router.post("/register", response_model=UserResponse)
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    try:
        emotion_profile = await analyze_emotion(user_in.current_mood_text, user_in.role)
        primary_emotion = emotion_profile.primary_emotion.value
        experience_tags = ",".join(emotion_profile.experience_tags)
    except Exception as e:
        primary_emotion = "nötr"
        experience_tags = ""

    new_user = User(
        name=user_in.name,
        age=user_in.age,
        city=user_in.city,
        role=user_in.role,
        primary_emotion=primary_emotion,
        experience_tags=experience_tags
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user

@router.post("/login", response_model=UserResponse)
async def login(login_in: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == login_in.user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.get("/me/{user_id}", response_model=UserResponse)
async def get_me(user_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
