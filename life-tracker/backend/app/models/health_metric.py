import uuid
from datetime import datetime
from sqlalchemy import String, Numeric, DateTime, JSON, Index
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID, JSONB
from ..database import Base


class HealthMetric(Base):
    __tablename__ = 'health_metrics'
    __table_args__ = (
        Index('ix_health_metrics_user_type_time', 'user_id', 'metric_type', 'recorded_at'),
        # TimescaleDB hypertable is created via migration, not here
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    metric_type: Mapped[str] = mapped_column(String(40), nullable=False)
    value: Mapped[float] = mapped_column(Numeric, nullable=False)
    unit: Mapped[str | None] = mapped_column(String(20))
    source: Mapped[str] = mapped_column(String(40), nullable=False)
    metadata_: Mapped[dict | None] = mapped_column('metadata', JSONB)
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)


class JournalEntry(Base):
    __tablename__ = 'journal_entries'

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    mood_score: Mapped[int] = mapped_column(nullable=False)
    energy_score: Mapped[int] = mapped_column(nullable=False)
    stress_score: Mapped[int] = mapped_column(nullable=False)
    notes: Mapped[str | None] = mapped_column(String(2000))
    tags: Mapped[list | None] = mapped_column(JSONB)
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, index=True)
