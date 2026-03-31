# backend/debug_matching.py
import asyncio
from database import async_session_maker
from models import User
from sqlalchemy.future import select

async def check_elders():
    async with async_session_maker() as db:
        result = await db.execute(select(User).where(User.role == "büyük"))
        elders = result.scalars().all()
        print(f"Elderly users count: {len(elders)}")
        for e in elders:
            print(f"- {e.name} (ID: {e.id}, Emotion: {e.primary_emotion})")
            
        if not elders:
            print("\nWARNING: No elderly users found in the database. Matching will fail.")

if __name__ == "__main__":
    asyncio.run(check_elders())
