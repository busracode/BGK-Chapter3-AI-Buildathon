from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from database import get_db
from models import User
from schemas import UserCreate, UserLogin, UserResponse, UserStats, UserUpdate, MoodUpdate, DailyScoreRequest
from services.nlp_engine import (
    analyze_emotion, 
    extract_elder_profile, 
    extract_needs_summary, 
    generate_personality_bio,
    analyze_detailed_profile
)
import json
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["argon2", "bcrypt"], deprecated="auto")
def hash_password(password: str) -> str:
    # Argon2 has no 72-byte limit, but we keep a reasonable max length
    if len(password) > 256:
        raise HTTPException(status_code=400, detail="Şifre çok uzun, 256 karakteri geçemez")
    return pwd_context.hash(password)

def validate_password(password: str):
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Şifre en az 8 karakter olmalı")
    if len(password.encode('utf-8')) > 72:
        raise HTTPException(status_code=400, detail="Şifre 72 byte sınırını aşamaz")
    # Optional: add more complexity checks here
    return True
router = APIRouter()

@router.post("/profile", response_model=UserResponse)
async def create_profile(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    # Password is mandatory only for young users ("genç"). Elders use picture password.
    if user_in.role == "genç":
        if not user_in.password:
            raise HTTPException(status_code=400, detail="Şifre zorunludur.")
        validate_password(user_in.password)
        hashed = hash_password(user_in.password)
    else:
        # Elder users: no textual password, only picture password
        hashed = None
    new_user = User(
        username=user_in.username,
        role=user_in.role,
        city=user_in.city,
        hashed_password=hashed,
        picture_password=user_in.picture_password
    )
    
    if user_in.role == "genç":
        new_user.name = user_in.name
        new_user.surname = user_in.surname
        new_user.age = user_in.age
        
        try:
            mood_text = user_in.current_mood_text or "Belirtilmedi"
            emotion_profile = await analyze_emotion(mood_text, user_in.role)
            new_user.primary_emotion = emotion_profile.primary_emotion.value
            new_user.experience_tags = ",".join(emotion_profile.experience_tags)
            
            # Detaylı analiz (Summary + Expertise)
            result = await analyze_detailed_profile(mood_text, user_in.role)
            new_user.personality_summary = result["summary"]
            new_user.expertise_level = result["expertise"]
        except Exception as e:
            print("Error analyzing genc emotion:", e)
            new_user.primary_emotion = "nötr"
            new_user.experience_tags = ""
            
    elif user_in.role == "büyük":
        # New Guided Flow: Prioritize manually filled fields if they exist
        if user_in.name and user_in.name != "":
            print(f"DEBUG: Using manual data for {user_in.name}")
            new_user.name = user_in.name
            new_user.surname = user_in.surname or ""
            new_user.age = user_in.age or 60
            new_user.city = user_in.city or "Bilinmiyor"
            new_user.primary_emotion = "nötr"
            
            # Use transcript (Self Intro) for interests/hobbies ONLY if provided
            if user_in.current_mood_text and len(user_in.current_mood_text) > 10:
                try:
                    elder_data = await extract_elder_profile(user_in.current_mood_text)
                    new_user.hobbies = json.dumps(elder_data.hobbies, ensure_ascii=False)
                    new_user.interests = json.dumps(elder_data.interests, ensure_ascii=False)
                    new_user.expertise_level = elder_data.expertise_level
                    
                    # More robust summary & expertise:
                    ctx = f"İsim: {new_user.name}, Yaş: {new_user.age}, Şehir: {new_user.city}. Uzmanlık: {elder_data.expertise_level}. Anlattıkları: {user_in.current_mood_text}"
                    result = await analyze_detailed_profile(ctx, "büyük")
                    new_user.personality_summary = result["summary"]
                    new_user.expertise_level = result["expertise"]
                except:
                    print("DEBUG: NLP skip/fail, using raw transcript for interests")
                    new_user.interests = user_in.current_mood_text
        else:
            # Old Flow: Deduce everything from transcript
            try:
                transcript = user_in.current_mood_text or ""
                print(f"DEBUG: Processing elder transcript: {transcript[:50]}...")
                elder_data = await extract_elder_profile(transcript)
                
                new_user.name = elder_data.name if (elder_data.name and elder_data.name != "Bilinmiyor") else user_in.name
                new_user.surname = elder_data.surname
                new_user.age = elder_data.age if elder_data.age > 0 else (user_in.age or 60)
                new_user.city = elder_data.city
                new_user.hobbies = json.dumps(elder_data.hobbies, ensure_ascii=False)
                new_user.interests = json.dumps(elder_data.interests, ensure_ascii=False)
                # new_user.speaking_style = elder_data.speaking_style  # Voice data not needed
                new_user.expertise_level = elder_data.expertise_level
                new_user.life_experiences = json.dumps(elder_data.life_experiences, ensure_ascii=False)
                new_user.personality_summary = elder_data.personality_summary
                new_user.primary_emotion = "nötr"
            except Exception as e:
                print("Error parsing elder profile:", e)
                raise HTTPException(status_code=400, detail="İsminizi manuel girin veya sesinizi netleştirin.")

    if not new_user.name or new_user.name == "Bilinmiyor":
        if user_in.name:
            new_user.name = user_in.name
        else:
            raise HTTPException(status_code=400, detail="Lütfen isminizi belirtin.")
            
    if new_user.age is None:
        new_user.age = 0

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user

@router.get("/{user_id}", response_model=UserResponse)
async def get_user_profile(user_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.get("/{user_id}/stats", response_model=UserStats)
async def get_user_stats(user_id: str, db: AsyncSession = Depends(get_db)):
    from sqlalchemy import func
    from models import MatchRequest, JournalEntry, DailyScore
    
    # Session count (accepted match requests)
    session_result = await db.execute(
        select(func.count(MatchRequest.id)).where(
            ((MatchRequest.young_id == user_id) | (MatchRequest.elder_id == user_id)) & 
            (MatchRequest.status == "accepted")
        )
    )
    session_count = session_result.scalar() or 0
    
    # Journal count
    journal_result = await db.execute(
        select(func.count(JournalEntry.id)).where(JournalEntry.user_id == user_id)
    )
    journal_count = journal_result.scalar() or 0
    
    return UserStats(session_count=session_count, journal_count=journal_count)

@router.put("/{user_id}", response_model=UserResponse)
async def update_user(user_id: str, user_update: UserUpdate, db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalars().first()
        if not user:
            raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")
        
        # Update only provided fields
        update_data = user_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            if hasattr(user, key):
                setattr(user, key, value)
            else:
                print(f"WARNING: Field '{key}' not found in User model.")
        
        await db.commit()
        await db.refresh(user)
        return user
    except Exception as e:
        print(f"CRITICAL: User Update failed: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Sunucu hatası: {str(e)}")

    await db.delete(user)
    await db.commit()
    return {"message": "Hesabınız başarıyla silindi."}

@router.post("/reanalyze/{user_id}", response_model=UserResponse)
async def reanalyze_user_profile(user_id: str, db: AsyncSession = Depends(get_db)):
    """Kullanıcının profilini mevcut bilgilerine göre tekrar AI ile analiz eder."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")
    
    try:
        if user.role == "genç":
            # Genç için ilgi alanları üzerinden detaylı analiz
            analysis_text = user.interests or "Bilgi yok"
            result = await analyze_detailed_profile(analysis_text, user.role)
            user.personality_summary = result["summary"]
            user.expertise_level = result["expertise"]
        else:
            # Büyük için zengin context oluştur
            parts = []
            if user.name: parts.append(f"İsim: {user.name}")
            if user.age: parts.append(f"Yaş: {user.age}")
            if user.city: parts.append(f"Şehir: {user.city}")
            
            def parse_info(val):
                if not val: return ""
                try:
                    data = json.loads(val)
                    if isinstance(data, list): return ", ".join(data)
                    return str(data)
                except:
                    return str(val)

            interests_text = parse_info(user.interests)
            if interests_text: parts.append(f"İlgi Alanları: {interests_text}")
            
            experiences_text = parse_info(user.life_experiences)
            if experiences_text: parts.append(f"Hayat Tecrübeleri: {experiences_text}")
            
            combined_text = ". ".join(parts)
            if not combined_text.strip():
                combined_text = "Bu kullanıcı yeni kayıt oldu ve henüz detaylı bilgi paylaşmadı."
            
            # Detaylı analiz (Summary + Expertise)
            result = await analyze_detailed_profile(combined_text, user.role)
            user.personality_summary = result["summary"]
            user.expertise_level = result["expertise"]
            
            # Duygu analizi
            profile = await analyze_emotion(combined_text, user.role)
            user.primary_emotion = profile.primary_emotion.value

        await db.commit()
        await db.refresh(user)
        return user
    except Exception as e:
        print(f"Re-analysis failed: {e}")
        raise HTTPException(status_code=500, detail="AI Analizi şu an gerçekleştirilemiyor.")

@router.post("/login")
async def login(login_in: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == login_in.username))
    user = result.scalars().first()
    
    if not user:
        # dummy verify to mitigate timing attacks
        pwd_context.verify("dummy", pwd_context.hash("dummy"))
        raise HTTPException(status_code=444, detail="Geçersiz kimlik bilgileri") # Generic for security

    if user.role == "genç":
        if not login_in.password:
             raise HTTPException(status_code=400, detail="Şifre gerekli")
        if not user.hashed_password or not pwd_context.verify(login_in.password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Şifre hatalı")
    
    elif user.role == "büyük":
        # Elder users use picture password
        if not login_in.picture_password:
             raise HTTPException(status_code=400, detail="Resim şifresi (ikonlar) gerekli")
        if user.picture_password != login_in.picture_password:
            raise HTTPException(status_code=401, detail="Resim şifresi hatalı")
    
    else:
        raise HTTPException(status_code=400, detail="Geçersiz kullanıcı rolü")

    return {"message": "Giriş başarılı", "user_id": user.id, "role": user.role}

@router.post("/{user_id}/mood", response_model=UserResponse)
async def update_user_mood(user_id: str, mood_in: MoodUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    try:
        # If a direct label is selected (emoji support), use it
        if mood_in.mood_label:
            user.primary_emotion = mood_in.mood_label
            
        # If text/voice is provided, analyze it for context and tags
        mood_text = mood_in.mood_text
        if mood_text and mood_text.strip():
            profile = await analyze_emotion(mood_text, user.role)
            # If no manual emoji was picked, let AI decide the primary emotion
            if not mood_in.mood_label:
                user.primary_emotion = profile.primary_emotion.value
            
            # Update tags from AI analysis
            user.experience_tags = ",".join(profile.experience_tags)
        elif not mood_in.mood_label:
            # Default to neutral if nothing provided
            user.primary_emotion = "nötr"
            
        await db.commit()
        await db.refresh(user)
        return user
    except Exception as e:
        print(f"Error updating mood: {e}")
        raise HTTPException(status_code=500, detail="Mood analizi sırasında bir hata oluştu.")

@router.post("/{user_id}/daily-score")
async def save_daily_score(user_id: str, score_in: DailyScoreRequest, db: AsyncSession = Depends(get_db)):
    from models import DailyScore
    from datetime import date as dt_date
    
    today = dt_date.today()
    
    # Check if entry for today exists
    result = await db.execute(
        select(DailyScore).where(
            (DailyScore.user_id == user_id) & 
            (func.date(DailyScore.date) == today)
        )
    )
    existing = result.scalars().first()
    
    if existing:
        existing.score = score_in.score
    else:
        new_score = DailyScore(user_id=user_id, score=score_in.score)
        db.add(new_score)
    
    await db.commit()
    return {"status": "success", "score": score_in.score}

@router.get("/{user_id}/weekly-scores")
async def get_weekly_scores(user_id: str, db: AsyncSession = Depends(get_db)):
    from models import DailyScore
    from datetime import timedelta, datetime
    
    # Get last 7 days
    seven_days_ago = datetime.now() - timedelta(days=7)
    
    result = await db.execute(
        select(DailyScore)
        .where((DailyScore.user_id == user_id) & (DailyScore.date >= seven_days_ago))
        .order_by(asc(DailyScore.date))
    )
    scores = result.scalars().all()
    
    # Map to simple list
    return [{ "date": s.date.isoformat(), "score": s.score } for s in scores]
