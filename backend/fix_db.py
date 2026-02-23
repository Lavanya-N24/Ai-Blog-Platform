"""
Quick database migration script to add missing avatar_url column.
Run this once to fix the database schema.
"""
import sqlite3
import os

db_path = "./blog.db"

if os.path.exists(db_path):
    print(f"Found database at {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if avatar_url column exists
        cursor.execute("PRAGMA table_info(users)")
        columns = [col[1] for col in cursor.fetchall()]
        
        if "avatar_url" not in columns:
            print("Adding missing avatar_url column...")
            cursor.execute("ALTER TABLE users ADD COLUMN avatar_url TEXT DEFAULT ''")
            conn.commit()
            print("✅ Successfully added avatar_url column!")
        else:
            print("✅ avatar_url column already exists.")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        conn.rollback()
    finally:
        conn.close()
else:
    print(f"Database file not found at {db_path}. It will be created on first run.")
