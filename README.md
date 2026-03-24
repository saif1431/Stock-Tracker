# 📈 Stock Tracking Dashboard

A modern, full-stack stock tracking application with real-time price updates, portfolio management, and watchlist features.

**Live Demo**: http://localhost:3000 (local development)  
**Status**: 🟢 MVP Complete - See [PROJECT_STATUS.md](PROJECT_STATUS.md) for detailed roadmap

---

## ✨ KEY FEATURES

### 📊 Real-Time Stock Charts
- Interactive charts with 30 days of historical data
- Multi-line visualization (Close, High, Low prices)
- Live WebSocket updates every 30 seconds
- Responsive design for all devices

### 🔍 Smart Search
- Search stocks by ticker symbol
- Instant chart loading
- Quick add to watchlist

### ⭐ Watchlist Management
- Add/remove stocks to track
- View current prices and daily changes
- Color-coded performance (green/red)
- Quick stock selection from sidebar

### 💼 Portfolio Tracking
- Record your stock purchases (quantity & price)
- Real-time profit/loss calculation
- Portfolio summary dashboard
- Color-coded gains/losses
- Average cost tracking

### 🔐 Secure Authentication
- User registration & login
- JWT token-based authentication
- Secure password hashing
- Protected API endpoints

### 🌙 Modern UI/UX
- Responsive design (mobile, tablet, desktop)
- Dark mode ready
- Toast notifications
- Real-time connection indicator
- Clean, intuitive interface

---

## 🛠️ TECH STACK

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM for database
- **JWT & Bcrypt** - Security
- **WebSocket** - Real-time updates
- **Alpha Vantage API** - Stock data

### Frontend
- **Next.js 16** - React framework
- **TypeScript** - Type-safe code
- **Tailwind CSS 4** - Styling
- **Recharts** - Data visualization
- **Axios** - HTTP client

---

## 🚀 QUICK START

### Prerequisites
- **Python 3.10+** (for backend)
- **Node.js 18+** (for frontend)
- **npm or yarn** (for package management)

### 1️⃣ Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file (optional)
cp .env.example .env

# Start server
uvicorn app.main:app --reload
```

**Backend runs on**: `http://localhost:8000`  
**API Docs**: `http://localhost:8000/docs`

### 2️⃣ Frontend Setup

```bash
# In a new terminal, from project root
cd frontend

# Install dependencies
npm install

# Create .env.local (optional)
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Start development server
npm run dev
```

**Frontend runs on**: `http://localhost:3000`

### 3️⃣ Access the App
1. Open browser to `http://localhost:3000`
2. Create a new account or login
3. Start tracking stocks! 📈

---

## 🔑 API KEY SETUP (Optional)

For real stock data from Alpha Vantage:

1. Sign up at: https://www.alphavantage.co/
2. Get your free API key (5 calls/minute limit)
3. Create `backend/.env`:
   ```env
   STOCK_API_KEY=your_api_key_here
   ```
4. Restart backend server

**Note**: App works without API key - uses mock data automatically

---

## 📁 PROJECT STRUCTURE

```
StockTrackingDashboard/
├── backend/                    # FastAPI backend
│   ├── app/main.py            # FastAPI app
│   ├── routes/                # API endpoints
│   ├── models/                # Database models
│   ├── services/              # Business logic
│   └── requirements.txt        # Dependencies
├── frontend/                   # Next.js frontend
│   ├── app/                   # Pages
│   ├── components/            # React components
│   ├── hooks/                 # Custom hooks
│   ├── services/              # API services
│   └── package.json           # Dependencies
├── PROJECT_STATUS.md          # Detailed status & roadmap
└── README.md                  # This file
```

---

## 🎯 BASIC USAGE

### Register & Login
1. Click "Register" and create account
2. Login with your credentials
3. JWT token saved automatically

### Search Stocks
1. Enter stock symbol (AAPL, MSFT, GOOGL, etc.)
2. Press Enter or click Search
3. Chart loads with 30 days of price history

### Add to Watchlist
1. View stock chart
2. Click "Watch" button
3. Stock added to sidebar watchlist

### Buy Stocks
1. View stock in chart
2. Click "Buy" button
3. Enter quantity and price
4. Click "Confirm" to record purchase

### Track Portfolio
1. "Your Portfolio" section shows all holdings
2. See: current price, average cost, profit/loss
3. Click row to view stock chart
4. Click trash icon to remove position

---

## 📊 API ENDPOINTS

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Create new user |
| POST | `/auth/login` | Get JWT token |
| GET | `/auth/me` | Get current user |
| GET | `/stock/{symbol}` | Get stock data |
| GET | `/watchlist/` | Get watchlist |
| POST | `/watchlist/` | Add to watchlist |
| DELETE | `/watchlist/{symbol}` | Remove from watchlist |
| GET | `/portfolio/` | Get portfolio |
| POST | `/portfolio/` | Buy stock |
| DELETE | `/portfolio/{symbol}` | Sell stock |
| WS | `/ws/stock/{symbol}` | Real-time updates |

**Full API Docs**: Visit `http://localhost:8000/docs`

---

## 🔐 AUTHENTICATION

**Login Flow:**
```
1. User enters username/email + password
2. POST /auth/login validates credentials
3. Response includes JWT access_token
4. Token stored in localStorage
5. All requests include: Authorization: Bearer <token>
```

**Token Expiry**: 30 minutes

---

## 💾 DATABASE

**Default**: SQLite (auto-created)  
**Location**: `backend/stock_tracker.db`

**Reset Database**:
```bash
rm backend/stock_tracker.db
uvicorn app.main:app --reload
```

---

## 🐛 TROUBLESHOOTING

### Cannot connect to API
- Check backend is running: `http://localhost:8000/docs`
- Check CORS configuration in `backend/app/main.py`
- Verify API_URL in frontend `.env.local`

### Stock data not showing
- Add Alpha Vantage API key to `backend/.env` (optional)
- App automatically uses mock data if key not provided
- Check stock symbol spelling

### Authentication failed
- Clear browser storage: DevTools > Application > Clear All
- Re-login to get new token
- Check token hasn't expired (30 minutes)

---

## 📈 WHAT'S BUILT vs WHAT'S MISSING

See **[PROJECT_STATUS.md](PROJECT_STATUS.md)** for:
- ✅ Complete list of implemented features
- ❌ Missing features & improvements
- 🎯 Recommended roadmap (5 phases)
- 🔧 Technical details and architecture
- 🧪 Testing information

**Quick Summary:**
- ✅ Core features: Auth, Search, Charts, Watchlist, Portfolio
- ❌ Missing: Alerts, Technical indicators, News, Backtesting
- 📈 Next priority: Price alerts, candlestick charts, indicators

---

## 🚀 DEPLOYMENT

### Local Production Build
```bash
# Frontend
cd frontend
npm run build
npm start

# Backend
cd ../backend
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

---

## 📝 ENVIRONMENT VARIABLES

### Backend (.env)
```env
DATABASE_URL=sqlite:///./stock_tracker.db
SECRET_KEY=your-secret-key
STOCK_API_KEY=your-alpha-vantage-key (optional)
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 🧪 TESTING

```bash
cd backend
pytest tests/ -v
```

---

## 📚 DOCUMENTATION

- **[PROJECT_STATUS.md](PROJECT_STATUS.md)** - Detailed project status, roadmap, and architecture
- **API Swagger**: http://localhost:8000/docs
- **Code Comments** - Check source files for inline documentation

---

## 🤝 CONTRIBUTING

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open Pull Request

---

## 📄 LICENSE

This project is open source and available under the MIT License.

---

**Happy Stock Tracking! 📊**

**For detailed information about features, architecture, and roadmap, see [PROJECT_STATUS.md](PROJECT_STATUS.md)**

## IDE Configuration (VS Code)

To ensure VS Code recognizes the virtual environment:
1. Open the Command Palette (`Ctrl+Shift+P`).
2. Type `Python: Select Interpreter`.
3. Select the interpreter located at `./backend/venv/Scripts/python.exe`.
