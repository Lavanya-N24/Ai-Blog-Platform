import sys
import os

# Add parent dir to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import Blog
import json

db = SessionLocal()
try:
    blogs = db.query(Blog).all()
    print(f"Total blogs: {len(blogs)}")
    for b in blogs:
        print(f"ID: {b.id}, Title: {b.title}, Tags: {b.tags}")
except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
