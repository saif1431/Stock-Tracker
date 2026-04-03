import logging
import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import SQLAlchemyError
from database.database import engine, Base, SessionLocal
from core.config import settings
from core.cache import init_cache
from core.logging import setup_logging
from models import (
    admin,
    user,
    stock,
    watchlist,
    portfolio,
    alert,
    transaction,
    fundamental,
    news,
    sector,
    economic_data,
    paper_trading,
    stock_screen,
    backtest,
    social,
    tax,
    notification,
)

from routes.stock_routes import router as stock_router
from routes.watchlist_routes import router as watchlist_router
from routes.websocket_routes import router as websocket_router
from routes.auth_routes import router as auth_router
from routes.portfolio_routes import router as portfolio_router
from routes.alert_routes import router as alert_router
from routes.transaction_routes import router as transaction_router
from routes.fundamental_routes import router as fundamental_router
from routes.news_routes import router as news_router
from routes.sector_routes import router as sector_router
from routes.economic_routes import router as economic_router
from routes.analytics_routes import router as analytics_router
from routes.paper_trading_routes import router as paper_trading_router
from routes.screener_routes import router as screener_router
from routes.backtesting_routes import router as backtesting_router
from routes.social_routes import router as social_router
from routes.admin_routes import router as admin_router
from routes.tax_routes import router as tax_router
from routes.metrics_routes import router as metrics_router
from routes.notification_routes import router as notification_router
from services.market_seed_service import seed_market_data_if_empty
from services.alert_monitor_service import run_alert_monitor_forever
from core.rate_limit import RateLimitMiddleware
from core.request_metrics import RequestMetricsMiddleware

@asynccontextmanager
async def lifespan(app: FastAPI):
    alert_monitor_task = None
    # Startup logic
    setup_logging(settings.DEBUG)
    init_cache()

    try:
        # Sync the database schema (add missing columns)
        from sync_database_schema import sync_user_schema
        sync_user_schema()

        # Defer DB initialization to startup so module import is deployment-safe.
        Base.metadata.create_all(bind=engine)

        db = SessionLocal()
        try:
            seed_market_data_if_empty(db)
        finally:
            db.close()
    except SQLAlchemyError as exc:
        # Keep API process alive even if DB is temporarily unavailable.
        logger.error("Database startup initialization failed: %s", exc)

    if settings.ALERT_MONITOR_ENABLED:
        alert_monitor_task = asyncio.create_task(run_alert_monitor_forever(SessionLocal))
    
    yield
    if alert_monitor_task:
        alert_monitor_task.cancel()
        try:
            await alert_monitor_task
        except asyncio.CancelledError:
            pass

app = FastAPI(title="Stock Tracking Dashboard API", version="1.0.0", lifespan=lifespan)
logger = logging.getLogger(__name__)

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RateLimitMiddleware, enabled=True)
app.add_middleware(RequestMetricsMiddleware, enabled=True)

# Register routes
app.include_router(stock_router)
app.include_router(watchlist_router)
app.include_router(websocket_router)
app.include_router(auth_router)
app.include_router(portfolio_router)
app.include_router(alert_router)
app.include_router(transaction_router)
app.include_router(fundamental_router)
app.include_router(news_router)
app.include_router(sector_router)
app.include_router(economic_router)
app.include_router(analytics_router)
app.include_router(paper_trading_router)
app.include_router(screener_router)
app.include_router(backtesting_router)
app.include_router(social_router)
app.include_router(admin_router)
app.include_router(tax_router)
app.include_router(metrics_router)
app.include_router(notification_router)

@app.get("/")
async def root():
    return {"message": "Stock Tracking Dashboard API"}

@app.get("/health")
async def health():
    return {"status": "healthy"}


@app.get("/health/ready")
async def ready():
    return {
        "status": "ready",
        "environment": settings.ENVIRONMENT,
    }
