#!/usr/bin/env python
import subprocess
import sys
import os

# Change to backend directory
os.chdir(os.path.dirname(os.path.abspath(__file__)))

# Run uvicorn with proper watch directories excluding logs and db files
# --no-access-log prevents continuous log file writes that trigger reload
subprocess.run([
    sys.executable, "-m", "uvicorn",
    "app.main:app",
    "--reload",
    "--reload-dir", "app",
    "--reload-dir", "models",
    "--reload-dir", "routes",
    "--reload-dir", "schemas",
    "--reload-dir", "services",
    "--reload-dir", "core",
    "--reload-dir", "database",
    "--host", "127.0.0.1",
    "--port", "8000",
    "--no-access-log",  # Prevent log file writes that trigger reload
])
