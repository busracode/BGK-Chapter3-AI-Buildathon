from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from database import get_db
from models import JournalEntry
from schemas import JournalEntryCreate, JournalEntryResponse
from typing import List

router = APIRouter()

@router.get("/{user_id}", response_model=List[JournalEntryResponse])
async def get_journal_entries(user_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(JournalEntry).where(JournalEntry.user_id == user_id).order_by(JournalEntry.created_at.desc()))
    entries = result.scalars().all()
    return entries

@router.post("/{user_id}", response_model=JournalEntryResponse)
async def create_journal_entry(user_id: str, entry_in: JournalEntryCreate, db: AsyncSession = Depends(get_db)):
    new_entry = JournalEntry(
        user_id=user_id,
        content=entry_in.content
    )
    db.add(new_entry)
    await db.commit()
    await db.refresh(new_entry)
    return new_entry
