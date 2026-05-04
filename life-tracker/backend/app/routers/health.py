import uuid
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, desc, func, text
from sqlalchemy.ext.asyncio import AsyncSession
from ..database import get_db
from ..dependencies import get_current_user_id
from ..models.health_metric import HealthMetric
from ..schemas.health import HealthMetricCreate, HealthMetricBulkCreate, HealthMetricOut, HealthSummaryOut

router = APIRouter(prefix='/health', tags=['health'])


@router.get('/summary', response_model=HealthSummaryOut)
async def health_summary(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    uid = uuid.UUID(user_id)
    since = datetime.utcnow() - timedelta(days=2)
    result: dict = {}

    for metric in ('steps', 'hrv', 'resting_hr', 'sleep_hours', 'sleep_score'):
        q = await db.execute(
            select(HealthMetric.value)
            .where(HealthMetric.user_id == uid, HealthMetric.metric_type == metric, HealthMetric.recorded_at >= since)
            .order_by(desc(HealthMetric.recorded_at))
            .limit(1)
        )
        val = q.scalar()
        result[metric] = float(val) if val is not None else None

    return result


@router.get('/metrics', response_model=list[HealthMetricOut])
async def list_metrics(
    type: str = Query(...),
    from_: datetime = Query(alias='from', default=None),
    to: datetime = Query(default=None),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    uid = uuid.UUID(user_id)
    from_dt = from_ or (datetime.utcnow() - timedelta(days=30))
    to_dt = to or datetime.utcnow()

    q = await db.execute(
        select(HealthMetric)
        .where(
            HealthMetric.user_id == uid,
            HealthMetric.metric_type == type,
            HealthMetric.recorded_at >= from_dt,
            HealthMetric.recorded_at <= to_dt,
        )
        .order_by(HealthMetric.recorded_at)
    )
    return q.scalars().all()


@router.post('/metrics', response_model=HealthMetricOut, status_code=201)
async def create_metric(
    body: HealthMetricCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    metric = HealthMetric(user_id=uuid.UUID(user_id), **body.model_dump())
    db.add(metric)
    await db.commit()
    await db.refresh(metric)
    return metric


@router.post('/metrics/bulk', status_code=201)
async def bulk_create_metrics(
    body: HealthMetricBulkCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    uid = uuid.UUID(user_id)
    metrics = [HealthMetric(user_id=uid, **m.model_dump()) for m in body.metrics]
    db.add_all(metrics)
    await db.commit()
    return {'inserted': len(metrics)}
