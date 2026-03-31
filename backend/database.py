from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base

# Using the requested local SQLite database hayat_agaci.db
DATABASE_URL = "sqlite+aiosqlite:///./hayat_agaci.db"

engine = create_async_engine(DATABASE_URL, echo=False)
async_session_maker = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

Base = declarative_base()

async def get_db():
    async with async_session_maker() as session:
        yield session
