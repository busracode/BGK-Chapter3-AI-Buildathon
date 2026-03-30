from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from models import User
from schemas import UserCreate, UserResponse
from services.nlp_engine import analyze_emotion, extract_elder_profile
import json

router = APIRouter()

@router.post("/profile", response_model=UserResponse)
async def create_profile(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    new_user = User(
        role=user_in.role,
        city=user_in.city
    )
    
    if user_in.role == "genç":
        new_user.name = user_in.name
        new_user.age = user_in.age
        
        try:
            mood_text = user_in.current_mood_text or "Belirtilmedi"
            emotion_profile = await analyze_emotion(mood_text, user_in.role)
            new_user.primary_emotion = emotion_profile.primary_emotion.value
            new_user.experience_tags = ",".join(emotion_profile.experience_tags)
        except Exception as e:
            print("Error analyzing genc emotion:", e)
            new_user.primary_emotion = "nötr"
            new_user.experience_tags = ""
            
    elif user_in.role == "büyük":
        try:
            transcript = user_in.current_mood_text or ""
            elder_data = await extract_elder_profile(transcript)
            new_user.name = elder_data.name if (elder_data.name and elder_data.name != "Bilinmiyor") else user_in.name
            new_user.age = elder_data.age if elder_data.age > 0 else user_in.age
            
            # Combine city if known
            if elder_data.city and elder_data.city != "Bilinmiyor":
                new_user.city = elder_data.city
                
            new_user.hobbies = json.dumps(elder_data.hobbies, ensure_ascii=False)
            new_user.life_experiences = json.dumps(elder_data.life_experiences, ensure_ascii=False)
            new_user.personality_summary = elder_data.personality_summary
            
            new_user.primary_emotion = "nötr"
            new_user.experience_tags = ",".join(elder_data.life_experiences)
        except Exception as e:
            print("Error parsing elder profile:", e)
            new_user.name = user_in.name or "Büyük Mentör"
            new_user.age = user_in.age or 60
            new_user.primary_emotion = "nötr"

    if not new_user.name:
        new_user.name = "Kullanıcı"
    if new_user.age is None:
        new_user.age = 0

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user

@router.get("/{user_id}", response_model=UserResponse)
async def get_user_profile(user_id: str, db: AsyncSession = Depends(get_db)):
    from sqlalchemy.future import select
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
