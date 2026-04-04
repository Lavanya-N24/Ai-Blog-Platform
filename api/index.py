import sys
import os

# Repo root must be on sys.path so `from backend.app.main import app` resolves
# (adding only .../backend would break that import).
_root = os.getcwd()
if _root not in sys.path:
    sys.path.insert(0, _root)

from backend.app.main import app

# This is what Vercel looks for
# It treats this file as a WSGI/ASGI entrypoint
