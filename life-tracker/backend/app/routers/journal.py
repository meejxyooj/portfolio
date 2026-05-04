import uuid
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from ..database import get_db
from ..dependencies import get_current_user_id
from ..models.health_metric import JournalEntry
from ..schemas.health import JournalEntryCreate, JournalEntryOut

router = APIRouter(prefix='/journal', tags=['journal'])


@router.get('', response_model=list[JournalEntryOut])
async def list_journal(
    days: int = Query(default=30, ge=1, le=365),
    limit: int = Query(default=50, ge=1, le=200),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    uid = uuid.UUID(user_id)
    since = datetime.utcnow() - timedelta(days=days)
    q = await db.execute(
        select(JournalEntry)
        .where(JournalEntry.user_id == uid, JournalEntry.recorded_at >= since)
        .order_by(desc(JournalEntry.recorded_at))
        .limit(limit)
    )
    return q.scalars().all()


@router.post('', response_model=JournalEntryOut, status_code=201)
async def create_journal_entry(
    body: JournalEntryCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    entry = JournalEntry(user_id=uuid.UUID(user_id), **body.model_dump())
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry


@router.put('/{entry_id}', response_model=JournalEntryOut)
async def update_journal_entry(
    entry_id: uuid.UUID,
    body: JournalEntryCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    uid = uuid.UUID(user_id)
    q = await db.execute(
        select(JournalEntry).where(JournalEntry.id == entry_id, JournalEntry.user_id == uid)
    )
    entry = q.scalar()
    if not entry:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Entry not found')
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(entry, field, value)
    await db.commit()
    await db.refresh(entry)
    return entry


@router.delete('/{entry_id}', status_code=204)
async def delete_journal_entry(
    entry_id: uuid.UUID,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    uid = uuid.UUID(user_id)
    q = await db.execute(
        select(JournalEntry).where(JournalEntry.id == entry_id, JournalEntry.user_id == uid)
    )
    entry = q.scalar()
    if entry:
        await db.delete(entry)
        await db.commit()
