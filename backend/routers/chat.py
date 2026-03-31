# backend/routers/chat.py
"""
Sohbet Router — Gerçek zamanlı mesajlaşma + AI moderasyon
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
import asyncio
import json
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import asc, desc
from models import ChatSession, User, Message

from services.nlp_engine import (
    analyze_emotion,
    crystallize_lesson,
    generate_mentor_hint,
    CrisisLevel,
    client,
    GROQ_MODEL
)
from services.moderation import notify_expert_team
from services.encryption import encrypt_message, decrypt_message
from database import get_db

router = APIRouter()


# Aktif WebSocket bağlantı yöneticisi
class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, session_id: str, websocket: WebSocket):
        await websocket.accept()
        if session_id not in self.active_connections:
            self.active_connections[session_id] = []
        self.active_connections[session_id].append(websocket)

    def disconnect(self, session_id: str, websocket: WebSocket):
        if session_id in self.active_connections:
            self.active_connections[session_id].remove(websocket)

    async def broadcast(self, session_id: str, data: dict):
        if session_id in self.active_connections:
            for ws in self.active_connections[session_id]:
                await ws.send_json(data)


manager = ConnectionManager()


class SendMessageRequest(BaseModel):
    session_id: str
    sender_id: str
    text: str
    sender_role: str  # "genç" | "büyük"


@router.websocket("/ws/{session_id}/{user_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    session_id: str,
    user_id: str,
):
    """
    Gerçek zamanlı sohbet WebSocket bağlantısı.
    Her mesaj AI moderasyondan geçer.
    """
    await manager.connect(session_id, websocket)
    try:
        while True:
            raw = await websocket.receive_text()
            data = json.loads(raw)

            text = data.get("text", "")
            sender_role = data.get("role", "genç")

            # 1. Mesajı şifrele ve kaydet
            encrypted = encrypt_message(text)
            # await save_message_to_db(session_id, user_id, encrypted)

            # 2. AI duygu analizi (arka planda)
            asyncio.create_task(
                process_message_async(session_id, text, sender_role)
            )

            # 3. Mesajı diğer tarafa ilet
            await manager.broadcast(session_id, {
                "type": "message",
                "sender_id": user_id,
                "text": text,
                "timestamp": data.get("timestamp"),
            })

    except WebSocketDisconnect:
        manager.disconnect(session_id, websocket)


async def process_message_async(session_id: str, text: str, role: str):
    """
    Mesaj geldikten sonra arka planda AI analizi yapar.
    Kriz tespit edilirse uzman ekibine bildirim gönderir.
    """
    try:
        profile = await analyze_emotion(text, role)

        # Kriz tespiti
        if profile.crisis_level in [CrisisLevel.ALERT, CrisisLevel.CRITICAL]:
            await notify_expert_team(
                session_id=session_id,
                crisis_level=profile.crisis_level,
                user_role=role,
                trigger_text=text[:200],  # İlk 200 karakter yeterli
            )

        # AI öngörüsünü sohbete göster (isteğe bağlı)
        if profile.intensity > 0.6:
            hint = f"Kullanıcı {profile.primary_emotion} hissediyor. " \
                   f"Yoğunluk: {profile.intensity:.0%}"
            await manager.broadcast(session_id, {
                "type": "ai_insight",
                "text": hint,
                "crisis_level": profile.crisis_level,
            })

    except Exception as e:
        # Moderasyon hatası sessizce loglanır, sohbet kesilmez
        print(f"Moderasyon hatası [{session_id}]: {e}")


@router.post("/send")
async def send_message(req: SendMessageRequest, db: AsyncSession = Depends(get_db)):
    """REST API üzerinden mesaj gönderimi. Mesajı veritabanına kaydeder."""
    is_risky = False
    crisis_level = "yok"
    primary_emotion = "nötr"
    
    # 1. Moderasyon & Kriz Analizi (Eğer Groq çökerse mesaj gitmeye devam etmeli)
    try:
        profile = await analyze_emotion(req.text, req.sender_role)
        is_risky = profile.crisis_level in [CrisisLevel.ALERT, CrisisLevel.CRITICAL]
        crisis_level = profile.crisis_level.value if hasattr(profile.crisis_level, "value") else str(profile.crisis_level)
        primary_emotion = profile.primary_emotion.value if hasattr(profile.primary_emotion, "value") else str(profile.primary_emotion)

        if profile.crisis_level == CrisisLevel.CRITICAL:
            await notify_expert_team(
                session_id=req.session_id,
                crisis_level=profile.crisis_level,
                user_role=req.sender_role,
                trigger_text=req.text,
            )
    except Exception as e:
        print("Emotion analysis failed, but passing through message:", e)

    # 2. Veritabanına Mesajı Kaydet
    try:
        new_msg = Message(
            session_id=req.session_id,
            sender_id=req.sender_id,
            sender_role=req.sender_role,
            text=req.text
        )
        db.add(new_msg)
        await db.commit()
    except Exception as e:
        print("Database save failed:", e)
        raise HTTPException(status_code=500, detail="Mesaj kaydedilemedi.")

    return {
        "status": "sent",
        "emotion": primary_emotion,
        "crisis_level": crisis_level,
        "is_risky": is_risky
    }

@router.get("/messages/{session_id}")
async def get_messages(session_id: str, db: AsyncSession = Depends(get_db)):
    """Gerçek zamanlı polling için belirli bir oturumun geçmiş mesajlarını çeker."""
    result = await db.execute(
        select(Message)
        .where(Message.session_id == session_id)
        .order_by(asc(Message.created_at))
    )
    messages = result.scalars().all()
    
    return [
        {
            "id": m.id,
            "sender_id": m.sender_id,
            "sender_role": m.sender_role,
            "text": m.text,
            "created_at": m.created_at.isoformat() if m.created_at else None
        }
        for m in messages
    ]



@router.post("/crystallize/{session_id}")
async def crystallize_session(session_id: str):
    """Sohbet bitiminde dersleri kristalize eder ve günlüğe kaydeder."""
    # Gerçek uygulamada DB'den mesaj geçmişi alınır
    demo_conversation = [
        {"sender": "Ahmet Bey", "text": "2008'de her şeyimi kaybettim."},
        {"sender": "Elif", "text": "Peki nasıl toparladınız?"},
        {"sender": "Ahmet Bey", "text": "Başarısızlık benim en iyi öğretmenim oldu."},
    ]

    lesson = await crystallize_lesson(demo_conversation)
    return {"lesson": lesson, "session_id": session_id}

@router.get("/sessions/{user_id}")
async def get_chat_sessions(user_id: str, db: AsyncSession = Depends(get_db)):
    """Kullanıcının tüm aktif sohbet oturumlarını, en son mesaj tarihine göre getirir."""
    # 1. Kullanıcının dahil olduğu oturumları bul
    result = await db.execute(
        select(ChatSession).where(
            (ChatSession.young_id == user_id) | (ChatSession.elder_id == user_id)
        )
    )
    sessions = result.scalars().all()
    
    output = []
    for sess in sessions:
        # a. Diğer kullanıcının ismini al
        other_id = sess.elder_id if sess.young_id == user_id else sess.young_id
        user_res = await db.execute(select(User).where(User.id == other_id))
        other_user = user_res.scalars().first()
        
        # b. En son mesajı al
        msg_res = await db.execute(
            select(Message)
            .where(Message.session_id == sess.id)
            .order_by(desc(Message.created_at))
            .limit(1)
        )
        last_msg = msg_res.scalars().first()
        
        output.append({
            "session_id": sess.id,
            "other_name": other_user.name if other_user else "Bilinmeyen Kullanıcı",
            "last_message": last_msg.text if last_msg else "Henüz mesaj yok",
            "last_message_date": last_msg.created_at.isoformat() if last_msg else sess.created_at.isoformat(),
            "is_ai": False # Şimdilik sadece insan-insan sohbetleri var
        })

    # c. Tarihe göre azalan sıralama (En yeni mesaj en üstte)
    output.sort(key=lambda x: x["last_message_date"], reverse=True)
    return output
