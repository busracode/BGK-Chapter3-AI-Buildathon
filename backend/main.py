# backend/main.py
"""
Hayat Köprüsü — FastAPI Backend
Kuşaklararası AI Mentörlük Platformu
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

from routers import auth, matches, chat, journal, moderation, users
from database import engine, Base
import models
from config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Başlangıç: DB tablolarını oluştur
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Kapanış temizliği


app = FastAPI(
    title="Hayat Köprüsü API",
    description="AI destekli kuşaklararası mentörlük platformu",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Temporarily widen for debug
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    from fastapi.responses import JSONResponse
    import traceback
    print(f"GLOBAL ERROR: {exc}")
    traceback.print_exc()
    return JSONResponse(status_code=500, content={"detail": f"Server Error: {str(exc)}"})

# Router'ları ekle
app.include_router(auth.router, prefix="/api/auth", tags=["Kimlik Doğrulama"])
app.include_router(users.router, prefix="/api/users", tags=["Kullanıcı Profilleri"])
app.include_router(matches.router, prefix="/api/matches", tags=["Eşleştirme"])
app.include_router(chat.router, prefix="/api/chat", tags=["Sohbet"])
app.include_router(journal.router, prefix="/api/journal", tags=["Günlük"])
app.include_router(moderation.router, prefix="/api/moderation", tags=["Moderasyon"])


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "Hayat Köprüsü API"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
