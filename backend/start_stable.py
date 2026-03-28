#!/usr/bin/env python
"""
Backend startup script that runs without file watching to prevent continuous reloads
Use this for development when you don't need live reload
"""
import subprocess
import sys

# Run uvicorn WITHOUT --reload to prevent constant reloading
subprocess.run([
    sys.executable, "-m", "uvicorn",
    "app.main:app",
    "--host", "127.0.0.1",
    "--port", "8000",
])
