import uuid
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from ..database import get_db
from ..dependencies import get_current_user_id
from ..models.habit import Habit, HabitCompletion
from ..schemas.habit import HabitCreate, HabitUpdate, HabitOut, HabitWithStatus, HabitStreakOut, CompleteHabitRequest
from ..services.habit_service import get_habits_with_status, get_habit_streak_data

router = APIRouter(prefix='/habits', tags=['habits'])


@router.get('/summary', response_model=list[HabitWithStatus])
async def habits_summary(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    uid = uuid.UUID(user_id)
    return await get_habits_with_status(db, uid)


@router.get('', response_model=list[HabitOut])
async def list_habits(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    uid = uuid.UUID(user_id)
    q = await db.execute(
        select(Habit).where(Habit.user_id == uid, Habit.is_active.is_(True), Habit.deleted_at.is_(None))
    )
    return q.scalars().all()


@router.post('', response_model=HabitOut, status_code=status.HTTP_201_CREATED)
async def create_habit(
    body: HabitCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    habit = Habit(user_id=uuid.UUID(user_id), **body.model_dump())
    db.add(habit)
    await db.commit()
    await db.refresh(habit)
    return habit


@router.put('/{habit_id}', response_model=HabitOut)
async def update_habit(
    habit_id: uuid.UUID,
    body: HabitUpdate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    habit = await _get_own_habit(db, habit_id, uuid.UUID(user_id))
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(habit, field, value)
    await db.commit()
    await db.refresh(habit)
    return habit


@router.delete('/{habit_id}', status_code=status.HTTP_204_NO_CONTENT)
async def delete_habit(
    habit_id: uuid.UUID,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    from datetime import datetime
    habit = await _get_own_habit(db, habit_id, uuid.UUID(user_id))
    habit.deleted_at = datetime.utcnow()
    habit.is_active = False
    await db.commit()


@router.post('/{habit_id}/complete', status_code=status.HTTP_201_CREATED)
async def complete_habit(
    habit_id: uuid.UUID,
    body: CompleteHabitRequest = CompleteHabitRequest(),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    uid = uuid.UUID(user_id)
    await _get_own_habit(db, habit_id, uid)
    today = date.today()

    existing = await db.execute(
        select(HabitCompletion).where(
            HabitCompletion.habit_id == habit_id,
            HabitCompletion.user_id == uid,
            HabitCompletion.completion_date == today,
        )
    )
    if existing.scalar():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='Already completed today')

    completion = HabitCompletion(habit_id=habit_id, user_id=uid, completion_date=today, notes=body.notes)
    db.add(completion)
    await db.commit()
    return {'message': 'Completed'}


@router.delete('/{habit_id}/complete', status_code=status.HTTP_204_NO_CONTENT)
async def undo_complete_habit(
    habit_id: uuid.UUID,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    uid = uuid.UUID(user_id)
    today = date.today()
    q = await db.execute(
        select(HabitCompletion).where(
            HabitCompletion.habit_id == habit_id,
            HabitCompletion.user_id == uid,
            HabitCompletion.completion_date == today,
        )
    )
    completion = q.scalar()
    if completion:
        await db.delete(completion)
        await db.commit()


@router.get('/{habit_id}/streak', response_model=HabitStreakOut)
async def habit_streak(
    habit_id: uuid.UUID,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    uid = uuid.UUID(user_id)
    await _get_own_habit(db, habit_id, uid)
    return await get_habit_streak_data(db, habit_id, uid)


async def _get_own_habit(db: AsyncSession, habit_id: uuid.UUID, user_id: uuid.UUID) -> Habit:
    q = await db.execute(
        select(Habit).where(Habit.id == habit_id, Habit.user_id == user_id, Habit.deleted_at.is_(None))
    )
    habit = q.scalar()
    if not habit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Habit not found')
    return habit
