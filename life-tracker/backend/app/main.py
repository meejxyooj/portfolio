from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .routers import habits, journal, health

app = FastAPI(
    title='Life Tracker API',
    version='1.0.0',
    docs_url='/docs',
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(habits.router, prefix='/api/v1')
app.include_router(journal.router, prefix='/api/v1')
app.include_router(health.router, prefix='/api/v1')


@app.get('/healthz')
async def health_check():
    return {'status': 'ok'}
