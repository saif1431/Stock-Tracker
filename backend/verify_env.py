import sys
import os
import subprocess

def check_dependencies():
    print("Checking Python environment...")
    print(f"Python executable: {sys.executable}")
    print(f"Python version: {sys.version}")
    
    try:
        import requests
        print(f"SUCCESS: 'requests' library is found (version: {requests.__version__})")
    except ImportError:
        print("ERROR: 'requests' library is NOT found in this environment.")
        return False
        
    try:
        from backend.core.config import settings
        print("SUCCESS: Project 'backend' module is correctly in sys.path")
    except ImportError as e:
        print(f"WARNING: Could not import 'backend' module: {e}")
        print("This is expected if you are running this script directly without adding the project root to sys.path.")
        
    return True

if __name__ == "__main__":
    if check_dependencies():
        print("\nYour environment is correctly set up for the backend.")
    else:
        print("\nYour environment is NOT correctly set up.")
        print("Please run: pip install -r backend/requirements.txt")
