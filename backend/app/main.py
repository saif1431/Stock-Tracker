from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database.database import engine, Base
from models import user, stock, watchlist, portfolio

# Create database tables
Base.metadata.create_all(bind=engine)

from routes.stock_routes import router as stock_router
from routes.watchlist_routes import router as watchlist_router
from routes.websocket_routes import router as websocket_router
from routes.auth_routes import router as auth_router
from routes.portfolio_routes import router as portfolio_router

app = FastAPI(title="Stock Tracking Dashboard API", version="1.0.0")

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

@app.get("/")
async def root():
    return {"message": "Stock Tracking Dashboard API"}

@app.get("/health")
async def health():
    return {"status": "healthy"}
