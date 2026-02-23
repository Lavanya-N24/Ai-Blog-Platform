import sys
import os

# Add the backend directory to the sys.path so we can import app
# Check if running on Vercel
if os.environ.get('VERCEL'):
    # Vercel places the root at /var/task
    # We need to add 'backend' to path
    sys.path.append(os.path.join(os.getcwd(), 'backend'))

from backend.app.main import app

# This is what Vercel looks for
# It treats this file as a WSGI/ASGI entrypoint
