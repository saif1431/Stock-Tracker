from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database.database import engine, Base, SessionLocal
from models import (
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
)

# Create database tables
Base.metadata.create_all(bind=engine)

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
from services.market_seed_service import seed_market_data_if_empty

app = FastAPI(title="Stock Tracking Dashboard API", version="1.0.0")


@app.on_event("startup")
def seed_initial_market_data() -> None:
    db = SessionLocal()
    try:
        seed_market_data_if_empty(db)
    finally:
        db.close()

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

@app.get("/")
async def root():
    return {"message": "Stock Tracking Dashboard API"}

@app.get("/health")
async def health():
    return {"status": "healthy"}
