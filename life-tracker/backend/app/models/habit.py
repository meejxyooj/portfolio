import uuid
from datetime import datetime, date
from sqlalchemy import String, Boolean, Integer, DateTime, Date, Text, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from ..database import Base


class Habit(Base):
    __tablename__ = 'habits'

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    frequency: Mapped[str] = mapped_column(String(20), nullable=False, default='daily')
    target_count: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    color: Mapped[str | None] = mapped_column(String(20))
    icon: Mapped[str | None] = mapped_column(String(10))
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    completions: Mapped[list['HabitCompletion']] = relationship(back_populates='habit', lazy='dynamic')


class HabitCompletion(Base):
    __tablename__ = 'habit_completions'
    __table_args__ = (
        UniqueConstraint('habit_id', 'user_id', 'completion_date', name='uq_habit_completion_per_day'),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    habit_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey('habits.id', ondelete='CASCADE'), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    completion_date: Mapped[date] = mapped_column(Date, nullable=False)
    completed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    notes: Mapped[str | None] = mapped_column(Text)

    habit: Mapped['Habit'] = relationship(back_populates='completions')
