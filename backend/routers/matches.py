from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from models import User, MatchRequest, ChatSession
from schemas import MatchRequestSchema
from database import get_db
from services.nlp_engine import (
    analyze_emotion, 
    compute_interest_resonance, 
    calculate_expertise_alignment,
    EmotionProfile, 
    EmotionType, 
    CrisisLevel
)
import time
import json

from sqlalchemy import desc

router = APIRouter()

@router.get("/list-elders/{user_id}")
async def list_available_elders(user_id: str, db: AsyncSession = Depends(get_db)):
    """Tüm müsait büyük mentörleri listeler."""
    result = await db.execute(select(User).where(User.role == "büyük"))
    elders = result.scalars().all()
    
    output = []
    for elder in elders:
        output.append({
            "id": elder.id,
            "name": f"{elder.name} {elder.surname or ''}",
            "age": elder.age,
            "city": elder.city,
            "expertise": elder.expertise_level or "Genel",
            "summary": elder.personality_summary or "Tecrübeli bir büyük.",
            "interests": elder.interests
        })
    return output

@router.post("/send-request")
async def send_match_request(data: dict, db: AsyncSession = Depends(get_db)):
    """Gençten büyüğe özel bir yardım isteği gönderir."""
    young_id = data.get("young_id")
    elder_id = data.get("elder_id")
    topic = data.get("topic", "Genel Sohbet")

    if not young_id or not elder_id:
        raise HTTPException(status_code=400, detail="Eksik bilgi: young_id ve elder_id gerekli.")

    # Get profiles for alignment calculation
    y_res = await db.execute(select(User).where(User.id == young_id))
    young = y_res.scalars().first()
    e_res = await db.execute(select(User).where(User.id == elder_id))
    elder = e_res.scalars().first()

    if not young or not elder:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")

    # Calculate alignment % based on education/expertise vs topic
    elder_profile_data = {
        "expertise_level": elder.expertise_level,
        "interests": elder.interests,
        "life_experiences": elder.life_experiences,
        "personality_summary": elder.personality_summary
    }
    alignment_score = await calculate_expertise_alignment(topic, elder_profile_data)

    # Create MatchRequest
    match_req = MatchRequest(
        young_id=young_id,
        elder_id=elder_id,
        status="pending",
        resonance_score=float(alignment_score),
        resonance_reason=topic # Topic is saved here
    )
    db.add(match_req)
    await db.commit()
    await db.refresh(match_req)

    return {"status": "sent", "match_id": match_req.id, "alignment": alignment_score}

@router.get("/active/{user_id}")
async def get_active_match(user_id: str, db: AsyncSession = Depends(get_db)):
    # Find the user's role
    user_res = await db.execute(select(User).where(User.id == user_id))
    user = user_res.scalars().first()
    if not user:
        return None
        
    if user.role == "genç":
        where_clause = (MatchRequest.young_id == user_id) & MatchRequest.status.in_(["pending", "accepted", "chat_started"])
    else:
        where_clause = (MatchRequest.elder_id == user_id) & MatchRequest.status.in_(["accepted", "chat_started"])
        
    # Find the latest active match for this user
    result = await db.execute(
        select(MatchRequest)
        .where(where_clause)
        .order_by(desc(MatchRequest.created_at))
    )
    req = result.scalars().first()
    if not req:
        return None
        
    other_id = req.elder_id if user.role == "genç" else req.young_id
    res = await db.execute(select(User).where(User.id == other_id))
    other_user = res.scalars().first()
    
    session_id = None
    if req.status == "chat_started":
        sess_res = await db.execute(select(ChatSession).where(ChatSession.match_id == req.id))
        session = sess_res.scalars().first()
        if session:
            session_id = session.id
            
    return {
        "id": req.id,
        "status": req.status,
        "other_name": other_user.name if other_user else "Kullanıcı",
        "other_summary": other_user.personality_summary if other_user else "",
        "resonance_reason": req.resonance_reason,
        "resonance_score": req.resonance_score,
        "session_id": session_id
    }

@router.post("/find", response_model=MatchRequestSchema)
async def find_best_match(user_id: str, db: AsyncSession = Depends(get_db)):
    try:
        # 1. Get Young User
        result = await db.execute(select(User).where(User.id == user_id))
        young_user = result.scalars().first()
        
        if not young_user or young_user.role != "genç":
            raise HTTPException(status_code=400, detail="Genç kullanıcı bulunamadı veya rol hatası.")

        # Check for existing pending matches to avoid duplicates
        existing = await db.execute(select(MatchRequest).where(
            (MatchRequest.young_id == user_id) & (MatchRequest.status == "pending")
        ))
        if existing.scalars().first():
            raise HTTPException(status_code=400, detail="Zaten bekleyen bir eşleşme isteğiniz var.")

        young_data = {
            "interests": young_user.interests,
            "hobbies": young_user.hobbies,
            "needs": young_user.personality_summary
        }

        # 2. Get all Elder users
        result = await db.execute(select(User).where(User.role == "büyük"))
        elders = result.scalars().all()

        if not elders:
            raise HTTPException(status_code=404, detail="Şu an eşleşebileceğiniz aktif bir büyük mentör bulunamadı. Lütfen daha sonra tekrar deneyin.")

        best_elder = None
        best_score = -1
        best_reason = "Sizin için uygun bir mentor eşleştirildi."

        for elder in elders:
            try:
                elder_data = {
                    "interests": elder.interests,
                    "hobbies": elder.hobbies,
                    "experiences": elder.life_experiences,
                    "summary": elder.personality_summary
                }
                
                # Compute resonance based on INTERESTS instead of emotion
                resonance = await compute_interest_resonance(young_data, elder_data)
                
                if resonance.score > best_score:
                    best_score = resonance.score
                    best_reason = resonance.reason
                    best_elder = elder
            except Exception as e:
                print(f"DEBUG: Error computing interest resonance for elder {elder.id}: {e}")
                continue

        if not best_elder:
            best_elder = elders[0]
            best_score = 50.0
            best_reason = "Sizin için uygun bir mentor eşleştirildi."

        # 3. Create MatchRequest
        match_req = MatchRequest(
            young_id=young_user.id,
            elder_id=best_elder.id,
            status="pending",
            resonance_score=float(best_score),
            resonance_reason=str(best_reason)
        )
        db.add(match_req)
        await db.commit()
        await db.refresh(match_req)
        
        return match_req
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Eşleşme sunucusu hatası: {str(e)}")

@router.get("/pending/{elder_id}")
async def get_pending_requests(elder_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(MatchRequest).where(
        MatchRequest.elder_id == elder_id,
        MatchRequest.status == "pending"
    ))
    requests = result.scalars().all()
    
    output = []
    for req in requests:
        res = await db.execute(select(User).where(User.id == req.young_id))
        y_user = res.scalars().first()
        if y_user:
            output.append({
                "match_id": req.id,
                "young_name": y_user.name,
                "young_age": y_user.age,
                "young_city": y_user.city,
                "young_emotion": y_user.primary_emotion,
                "topic": req.resonance_reason,
                "resonance_score": req.resonance_score,
                "resonance_reason": req.resonance_reason
            })
    return output

@router.post("/accept/{match_id}")
async def accept_match(match_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(MatchRequest).where(MatchRequest.id == match_id))
    req = result.scalars().first()
    if not req:
        raise HTTPException(status_code=404, detail="Match not found")
        
    req.status = "accepted"
    
    # Check if session already exists
    sess_res = await db.execute(select(ChatSession).where(ChatSession.match_id == req.id))
    session = sess_res.scalars().first()
    
    if not session:
        # Create it immediately so it appears in the chat list
        session = ChatSession(
            match_id=req.id,
            young_id=req.young_id,
            elder_id=req.elder_id
        )
        db.add(session)
    
    await db.commit()
    
    return {"status": "accepted", "message": "Eşleşme onaylandı. Sohbet listenize eklendi."}

@router.post("/start-chat/{match_id}")
async def start_chat(match_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(MatchRequest).where(MatchRequest.id == match_id))
    req = result.scalars().first()
    if not req:
        raise HTTPException(status_code=404, detail="Match not found")
        
    # Find Existing or create
    sess_res = await db.execute(select(ChatSession).where(ChatSession.match_id == req.id))
    session = sess_res.scalars().first()
    
    if not session:
        session = ChatSession(
            match_id=req.id,
            young_id=req.young_id,
            elder_id=req.elder_id
        )
        db.add(session)
        
    req.status = "chat_started"
    await db.commit()
    await db.refresh(session)
    
    return {"session_id": session.id, "status": "chat_started"}

@router.post("/reject/{match_id}")
async def reject_match(match_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(MatchRequest).where(MatchRequest.id == match_id))
    req = result.scalars().first()
    if not req:
        raise HTTPException(status_code=404, detail="Match not found")
        
    req.status = "rejected"
    await db.commit()
    return {"status": "rejected"}
