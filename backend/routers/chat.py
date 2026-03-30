# backend/routers/chat.py
"""
Sohbet Router — Gerçek zamanlı mesajlaşma + AI moderasyon
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
import asyncio
import json

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
async def send_message(req: SendMessageRequest):
    """REST API üzerinden mesaj gönderimi (WebSocket yoksa fallback)."""
    profile = await analyze_emotion(req.text, req.sender_role)

    if profile.crisis_level == CrisisLevel.CRITICAL:
        await notify_expert_team(
            session_id=req.session_id,
            crisis_level=profile.crisis_level,
            user_role=req.sender_role,
            trigger_text=req.text,
        )

    # Dinamik cevap üretimi
    try:
        if req.sender_role == "genç":
            system_prompt = "Sen 65+ yaşında, bilge ve tecrübeli birisin. Karşındaki genç sana dertlerini anlatıyor. Kısa (1-2 cümle), empatik, babacan/öğretici bir cevap ver."
        else:
            system_prompt = "Sen hayatın başındaki genç birisin. Karşındaki büyük kişi sana tecrübelerini aktarıyor. Kısa (1-2 cümle), saygılı, meraklı ve ilgili bir cevap ver."

        response = client.chat.completions.create(
            model=GROQ_MODEL,
            max_tokens=150,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": req.text}
            ],
        )
        reply_text = response.choices[0].message.content.strip()
    except Exception as e:
        reply_text = "Çok haklısın, anlıyorum. Bu konuda biraz daha konuşmak ister misin?"

    return {
        "status": "sent",
        "emotion": profile.primary_emotion,
        "crisis_level": profile.crisis_level,
        "reply": reply_text
    }


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
