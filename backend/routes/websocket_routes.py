import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from database.database import SessionLocal
from services.stock_service import get_daily_stock_data

router = APIRouter(prefix="/ws", tags=["websockets"])

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

manager = ConnectionManager()

@router.websocket("/stock/{symbol}")
async def websocket_stock_endpoint(websocket: WebSocket, symbol: str):
    await manager.connect(websocket)
    db = SessionLocal()
    try:
        while True:
            # Fetch data using the existing service (which has the 5-minute cache logic)
            data = get_daily_stock_data(symbol.upper(), db)
            
            # Send data to the client
            await websocket.send_json(data)
            
            # Wait for 30 seconds before the next update (matching the polling requirement)
            await asyncio.sleep(30)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"WebSocket error for {symbol}: {e}")
        manager.disconnect(websocket)
    finally:
        db.close()
