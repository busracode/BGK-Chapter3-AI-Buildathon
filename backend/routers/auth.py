from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from database import get_db
from models import User
from schemas import UserCreate, UserLogin, UserResponse
from services.nlp_engine import analyze_emotion

from passlib.hash import bcrypt

router = APIRouter()

def hash_password(password: str) -> str:
    return bcrypt.hash(password)

def verify_password(password: str, hashed_password: str) -> bool:
    return bcrypt.verify(password, hashed_password)

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
        experience_tags=experience_tags,
        hashed_password=hash_password(user_in.password) if user_in.password else None,
        picture_password=user_in.picture_password
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user

@router.post("/login", response_model=UserResponse)
async def login(login_in: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.name == login_in.name))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    
    if user.role == "genç":
        if not login_in.password or not user.hashed_password or not verify_password(login_in.password, user.hashed_password):
            raise HTTPException(status_code=400, detail="Hatalı şifre")
    elif user.role == "büyük":
        if not login_in.picture_password or login_in.picture_password != user.picture_password:
            raise HTTPException(status_code=400, detail="Hatalı resim parolası")
            
    return user

@router.get("/me/{user_id}", response_model=UserResponse)
async def get_me(user_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
