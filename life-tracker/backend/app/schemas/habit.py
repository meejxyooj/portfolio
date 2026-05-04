import uuid
from datetime import datetime, date
from pydantic import BaseModel, Field
from typing import Literal


class HabitCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: str | None = None
    frequency: Literal['daily', 'weekly'] = 'daily'
    target_count: int = Field(default=1, ge=1)
    color: str | None = None
    icon: str | None = None


class HabitUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    description: str | None = None
    frequency: Literal['daily', 'weekly'] | None = None
    target_count: int | None = Field(default=None, ge=1)
    color: str | None = None
    icon: str | None = None
    is_active: bool | None = None


class HabitOut(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    frequency: str
    target_count: int
    color: str | None
    icon: str | None
    is_active: bool
    created_at: datetime

    model_config = {'from_attributes': True}


class HabitWithStatus(HabitOut):
    completed_today: bool
    current_streak: int


class HabitStreakOut(BaseModel):
    habit_id: uuid.UUID
    current_streak: int
    longest_streak: int
    completion_rate_30d: float
    history: list[dict]  # [{ date: str, completed: bool }]


class CompleteHabitRequest(BaseModel):
    notes: str | None = None
