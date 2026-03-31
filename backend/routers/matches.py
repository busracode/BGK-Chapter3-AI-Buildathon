from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from models import User, MatchRequest, ChatSession
from schemas import MatchRequestSchema
from database import get_db
from services.nlp_engine import analyze_emotion, compute_resonance_score, EmotionProfile, EmotionType, CrisisLevel
import time
import json

from sqlalchemy import desc

router = APIRouter()

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
        "session_id": session_id
    }

@router.post("/find", response_model=MatchRequestSchema)
async def find_best_match(user_id: str, db: AsyncSession = Depends(get_db)):
    # 1. Get Young User
    result = await db.execute(select(User).where(User.id == user_id))
    young_user = result.scalars().first()
    
    if not young_user or young_user.role != "genç":
        raise HTTPException(status_code=400, detail="Young user not found or role mismatch")

    # Re-construct EmotionProfile for the young user
    young_profile = EmotionProfile(
        primary_emotion=EmotionType(young_user.primary_emotion or "nötr"),
        intensity=0.8,
        crisis_level=CrisisLevel.NONE,
        experience_tags=(young_user.experience_tags or "").split(","),
        summary="A young user seeking guidance."
    )

    # 2. Get all Elder users
    result = await db.execute(select(User).where(User.role == "büyük"))
    elders = result.scalars().all()

    if not elders:
        raise HTTPException(status_code=404, detail="Görüşülecek uygun büyük bulunamadı.")

    best_elder = None
    best_score = -1

    for elder in elders:
        try:
            exp_text = elder.life_experiences or ""
            if not isinstance(exp_text, str): 
                exp_text = str(exp_text)
            
            elder_profile = EmotionProfile(
                primary_emotion=EmotionType("nötr"),
                intensity=0.5,
                crisis_level=CrisisLevel.NONE,
                experience_tags=exp_text.split(","),
                summary=elder.personality_summary or "Tecrübeli bir büyük"
            )
            
            resonance = await compute_resonance_score(young_profile, elder_profile)
            if resonance.score > best_score:
                best_score = resonance.score
                best_elder = elder
        except Exception as e:
            print("Skipping an elder in match calculation:", e)
            continue

    if not best_elder:
        best_elder = elders[0]
        best_score = 50.0

    # 3. Create MatchRequest
    match_req = MatchRequest(
        young_id=young_user.id,
        elder_id=best_elder.id,
        status="pending",
        resonance_score=best_score
    )
    db.add(match_req)
    await db.commit()
    await db.refresh(match_req)
    
    return match_req

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
                "resonance_score": req.resonance_score
            })
    return output

@router.post("/accept/{match_id}")
async def accept_match(match_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(MatchRequest).where(MatchRequest.id == match_id))
    req = result.scalars().first()
    if not req:
        raise HTTPException(status_code=404, detail="Match not found")
        
    req.status = "accepted"
    await db.commit()
    
    return {"status": "accepted", "message": "Eşleşme onaylandı. Her iki taraf da sohbete başlayabilir."}

@router.post("/start-chat/{match_id}")
async def start_chat(match_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(MatchRequest).where(MatchRequest.id == match_id))
    req = result.scalars().first()
    if not req:
        raise HTTPException(status_code=404, detail="Match not found")
        
    if req.status == "chat_started":
        sess_res = await db.execute(select(ChatSession).where(ChatSession.match_id == req.id))
        session = sess_res.scalars().first()
        if session:
            return {"session_id": session.id, "status": "chat_started"}
            
    req.status = "chat_started"
    
    session = ChatSession(
        match_id=req.id,
        young_id=req.young_id,
        elder_id=req.elder_id
    )
    db.add(session)
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
