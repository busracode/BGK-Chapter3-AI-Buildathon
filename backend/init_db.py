# backend/init_db.py
import asyncio
from database import engine, Base
import models # ensure models are imported for metadata

async def init():
    async with engine.begin() as conn:
        # Create all tables (does nothing if they exist)
        await conn.run_sync(Base.metadata.create_all)
        print("Database tables initialized successfully!")

if __name__ == "__main__":
    asyncio.run(init())
