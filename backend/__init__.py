"""Backend package bootstrap.

FastAPI Cloud can import the app as ``backend.app.main:app`` from the
repository root. This project currently uses imports like ``from database...``
across many modules, so we ensure the backend directory is on ``sys.path`` to
keep those imports resolvable in both local and cloud runtimes.
"""

from pathlib import Path
import sys


_backend_dir = str(Path(__file__).resolve().parent)
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)
