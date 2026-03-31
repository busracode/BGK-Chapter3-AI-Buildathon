from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from database import get_db
from models import User
from schemas import UserCreate, UserLogin, UserResponse
from services.nlp_engine import analyze_emotion, extract_needs_summary, analyze_detailed_profile

import random
from routers.users import pwd_context

router = APIRouter()

def hash_password(password: str) -> str:
    # Use CryptContext (argon2) to completely bypass bcrypt 72 byte limits
    return pwd_context.hash(password)

def verify_password(password: str, hashed_password: str) -> bool:
    return pwd_context.verify(password, hashed_password)

def normalize_turkish_chars(text: str) -> str:
    if not text:
        return ""
    tr_map = {
        'ğ': 'g', 'ü': 'u', 'ş': 's', 'ı': 'i', 'ö': 'o', 'ç': 'c',
        'Ğ': 'g', 'Ü': 'u', 'Ş': 's', 'İ': 'i', 'Ö': 'o', 'Ç': 'c'
    }
    for tr, en in tr_map.items():
        text = text.replace(tr, en)
    return text.lower()

@router.post("/register", response_model=UserResponse)
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    try:
        try:
            if user_in.current_mood_label:
                primary_emotion = user_in.current_mood_label
            else:
                emotion_profile = await analyze_emotion(user_in.current_mood_text or "nötr", user_in.role)
                primary_emotion = emotion_profile.primary_emotion.value

            # Extract tags and summary from text if provided
            if user_in.current_mood_text:
                emotion_profile = await analyze_emotion(user_in.current_mood_text, user_in.role)
                experience_tags = ",".join(emotion_profile.experience_tags)
                result = await analyze_detailed_profile(user_in.current_mood_text, user_in.role)
                personality_summary = result["summary"]
                expertise_level = result["expertise"]
            else:
                experience_tags = ""
                personality_summary = "Yeni üye."
                expertise_level = "Genel"
                
        except Exception:
            if not user_in.current_mood_label:
                primary_emotion = "nötr"
            experience_tags = ""
            personality_summary = ""
            expertise_level = "Genel"

        if getattr(user_in, 'username', None):
            base_username = normalize_turkish_chars(user_in.username.strip().replace(" ", ""))
        else:
            name_part = normalize_turkish_chars(user_in.name.strip().replace(" ", ""))
            surname_part = normalize_turkish_chars(user_in.surname.strip().replace(" ", "")) if user_in.surname else ""
            base_username = f"{name_part}.{surname_part}" if surname_part else name_part
            
        username = base_username
        
        while True:
            result = await db.execute(select(User).where(User.username == username))
            if not result.scalars().first():
                break
            username = f"{base_username}{random.randint(100, 999)}"

        hashed_password = None
        picture_password = None
        
        if user_in.role == "genç":
            hashed_password = hash_password(user_in.password) if user_in.password else None
        elif user_in.role == "büyük":
            picture_password = user_in.picture_password
            
        new_user = User(
            username=username,
            name=user_in.name,
            surname=user_in.surname,
            age=user_in.age,
            city=user_in.city,
            role=user_in.role,
            primary_emotion=primary_emotion,
            experience_tags=experience_tags,
            personality_summary=personality_summary,
            expertise_level=expertise_level,
            hashed_password=hashed_password,
            picture_password=picture_password
        )
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)
        return new_user
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Kayıt işlemi sırasında bir hata oluştu: {str(e)}")

@router.post("/login", response_model=UserResponse)
async def login(login_in: UserLogin, db: AsyncSession = Depends(get_db)):
    try:
        auth_error = HTTPException(status_code=401, detail="Geçersiz kullanıcı adı veya şifre")

        result = await db.execute(select(User).where(User.username == login_in.username))
        user = result.scalars().first()
        if not user:
            raise auth_error
        
        if user.role == "genç":
            if not login_in.password or not user.hashed_password or not verify_password(login_in.password, user.hashed_password):
                raise auth_error
        elif user.role == "büyük":
            if not login_in.picture_password or login_in.picture_password != user.picture_password:
                raise auth_error
                
        return user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Giriş işlemi sırasında sunucu hatası oluştu: {str(e)}")

@router.get("/me/{user_id}", response_model=UserResponse)
async def get_me(user_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
