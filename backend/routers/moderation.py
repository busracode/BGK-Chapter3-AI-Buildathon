from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from database import get_db
from models import Alert
from schemas import AlertResponse
from pydantic import BaseModel
from typing import List

router = APIRouter()

class AlertRequest(BaseModel):
    session_id: str
    user_id: str
    crisis_level: str
    trigger_text: str

@router.post("/alert")
async def create_alert(req: AlertRequest, db: AsyncSession = Depends(get_db)):
    new_alert = Alert(
        session_id=req.session_id,
        user_id=req.user_id,
        crisis_level=req.crisis_level,
        trigger_text=req.trigger_text
    )
    db.add(new_alert)
    await db.commit()
    return {"status": "alert_created", "msg": "Moderasyon uyarı kaydı alındı"}

@router.get("/alerts", response_model=List[AlertResponse])
async def get_active_alerts(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Alert).where(Alert.resolved == False).order_by(Alert.created_at.desc()))
    alerts = result.scalars().all()
    return alerts

@router.post("/emergency/{session_id}/{user_id}")
async def trigger_emergency(session_id: str, user_id: str, db: AsyncSession = Depends(get_db)):
    new_alert = Alert(
        session_id=session_id,
        user_id=user_id,
        crisis_level="kritik",
        trigger_text="[AİLEMİ ARA - ACİL DURUM BUTONU]"
    )
    db.add(new_alert)
    await db.commit()
    return {"status": "ok", "message": "Acil durum ekiplerine haber verildi."}

@router.post("/resolve/{alert_id}")
async def resolve_alert(alert_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalars().first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.resolved = True
    await db.commit()
    return {"status": "resolved", "alert_id": alert_id}
