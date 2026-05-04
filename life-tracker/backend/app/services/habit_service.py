import uuid
from datetime import date, timedelta
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from ..models.habit import Habit, HabitCompletion


async def get_habits_with_status(db: AsyncSession, user_id: uuid.UUID) -> list[dict]:
    today = date.today()

    habits_q = await db.execute(
        select(Habit).where(Habit.user_id == user_id, Habit.is_active.is_(True), Habit.deleted_at.is_(None))
    )
    habits = habits_q.scalars().all()

    completions_q = await db.execute(
        select(HabitCompletion.habit_id).where(
            HabitCompletion.user_id == user_id,
            HabitCompletion.completion_date == today,
        )
    )
    completed_ids = {row[0] for row in completions_q}

    result = []
    for h in habits:
        streak = await _get_current_streak(db, h.id, user_id)
        result.append({
            **{c.key: getattr(h, c.key) for c in h.__table__.columns},
            'completed_today': h.id in completed_ids,
            'current_streak': streak,
        })
    return result


async def _get_current_streak(db: AsyncSession, habit_id: uuid.UUID, user_id: uuid.UUID) -> int:
    today = date.today()
    streak = 0
    check_date = today

    while True:
        exists_q = await db.execute(
            select(HabitCompletion.id).where(
                HabitCompletion.habit_id == habit_id,
                HabitCompletion.user_id == user_id,
                HabitCompletion.completion_date == check_date,
            ).limit(1)
        )
        if not exists_q.scalar():
            break
        streak += 1
        check_date -= timedelta(days=1)

    return streak


async def get_habit_streak_data(db: AsyncSession, habit_id: uuid.UUID, user_id: uuid.UUID) -> dict:
    today = date.today()

    # 30-day completion rate
    start_30 = today - timedelta(days=29)
    count_30_q = await db.execute(
        select(func.count()).where(
            HabitCompletion.habit_id == habit_id,
            HabitCompletion.user_id == user_id,
            HabitCompletion.completion_date >= start_30,
            HabitCompletion.completion_date <= today,
        )
    )
    count_30 = count_30_q.scalar() or 0
    completion_rate = round((count_30 / 30) * 100, 1)

    # History: last 90 days
    start_90 = today - timedelta(days=89)
    completions_q = await db.execute(
        select(HabitCompletion.completion_date).where(
            HabitCompletion.habit_id == habit_id,
            HabitCompletion.user_id == user_id,
            HabitCompletion.completion_date >= start_90,
        )
    )
    completed_dates = {row[0] for row in completions_q}

    history = []
    for i in range(90):
        d = start_90 + timedelta(days=i)
        history.append({'date': d.isoformat(), 'completed': d in completed_dates})

    current_streak = await _get_current_streak(db, habit_id, user_id)

    # Longest streak
    longest = 0
    run = 0
    for entry in history:
        if entry['completed']:
            run += 1
            longest = max(longest, run)
        else:
            run = 0

    return {
        'habit_id': habit_id,
        'current_streak': current_streak,
        'longest_streak': longest,
        'completion_rate_30d': completion_rate,
        'history': history,
    }
