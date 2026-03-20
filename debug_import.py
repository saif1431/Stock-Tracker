import sys
import traceback

sys.path.append('d:/Web Projects/StockTrackingDashboard')
print(f"sys.path: {sys.path}")

try:
    from backend.app.main import app
    print("SUCCESS: backend.app.main imported successfully")
except Exception:
    print("ERROR: Failed to import backend.app.main")
    traceback.print_exc()
