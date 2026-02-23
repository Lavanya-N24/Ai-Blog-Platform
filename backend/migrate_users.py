import sqlite3
import json

# Connect to database
conn = sqlite3.connect('blog.db')
cursor = conn.cursor()

try:
    # Check if table exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
    if not cursor.fetchone():
        print("Table 'users' does not exist! Run the app to create tables first.")
    else:
        # Get existing columns
        cursor.execute("PRAGMA table_info(users)")
        columns = [info[1] for info in cursor.fetchall()]
        print(f"Existing columns: {columns}")

        # Columns to add
        new_columns = {
            "bio": "TEXT",
            "avatar_url": "TEXT",
            "social_links": "TEXT" # SQLite doesn't have native JSON, stored as TEXT
        }

        for col_name, col_type in new_columns.items():
            if col_name not in columns:
                print(f"Adding {col_name} column to users table...")
                cursor.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}")
                print(f"Added {col_name}.")
            else:
                print(f"Column {col_name} already exists.")

        conn.commit()
        print("Migration for users table successful.")

except Exception as e:
    print(f"Migration failed: {e}")

finally:
    conn.close()
