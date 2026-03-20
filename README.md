# Stock Tracking Dashboard

A comprehensive dashboard for tracking stock performance using real-time data from Alpha Vantage.

## Backend Setup

### 1. Create a Virtual Environment
```bash
cd backend
python -m venv venv
```

### 2. Activate the Virtual Environment
- **Windows:**
  ```bash
  .\venv\Scripts\activate
  ```
- **macOS/Linux:**
  ```bash
  source venv/bin/activate
  ```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables
Create a `.env` file in the `backend` directory:
```
STOCK_API_KEY=your_alpha_vantage_api_key
```

### 5. Verify the Environment
Run the verification script to ensure everything is set up correctly:
```bash
# From the project root:
.\backend\venv\Scripts\python.exe backend\verify_env.py
```

### 6. Run the FastAPI Server
From the **project root folder**, run:
```bash
.\backend\venv\Scripts\python.exe -m uvicorn backend.app.main:app --reload
```
Alternatively, if you have the environment activated:
```bash
uvicorn backend.app.main:app --reload
```

## IDE Configuration (VS Code)

To ensure VS Code recognizes the virtual environment:
1. Open the Command Palette (`Ctrl+Shift+P`).
2. Type `Python: Select Interpreter`.
3. Select the interpreter located at `./backend/venv/Scripts/python.exe`.
