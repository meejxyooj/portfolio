import uuid
from datetime import datetime
from pydantic import BaseModel, Field
from typing import Literal

MetricType = Literal[
    'steps', 'hrv', 'resting_hr', 'sleep_hours', 'sleep_score',
    'mood', 'energy', 'stress', 'weight', 'calories_burned', 'spo2',
]

MetricSource = Literal[
    'manual', 'apple_health', 'strava', 'terra_oura', 'terra_garmin', 'terra_whoop',
]


class HealthMetricCreate(BaseModel):
    metric_type: MetricType
    value: float
    unit: str | None = None
    source: MetricSource = 'manual'
    recorded_at: datetime


class HealthMetricBulkCreate(BaseModel):
    metrics: list[HealthMetricCreate]


class HealthMetricOut(BaseModel):
    id: uuid.UUID
    metric_type: str
    value: float
    unit: str | None
    source: str
    recorded_at: datetime

    model_config = {'from_attributes': True}


class HealthSummaryOut(BaseModel):
    steps: float | None = None
    hrv: float | None = None
    resting_hr: float | None = None
    sleep_hours: float | None = None
    sleep_score: float | None = None


class JournalEntryCreate(BaseModel):
    mood_score: int = Field(ge=1, le=10)
    energy_score: int = Field(ge=1, le=10)
    stress_score: int = Field(ge=1, le=10)
    notes: str | None = Field(default=None, max_length=2000)
    tags: list[str] | None = None


class JournalEntryOut(BaseModel):
    id: uuid.UUID
    mood_score: int
    energy_score: int
    stress_score: int
    notes: str | None
    tags: list[str] | None
    recorded_at: datetime

    model_config = {'from_attributes': True}
