import sqlite3

# Connect to database
conn = sqlite3.connect('blog.db')
cursor = conn.cursor()

try:
    # Check if table exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='bookmarks'")
    if cursor.fetchone():
        print("Table 'bookmarks' already exists.")
    else:
        print("Table 'bookmarks' does not exist. Creating it...")
        # Create table based on models.py
        cursor.execute("""
            CREATE TABLE bookmarks (
                id INTEGER PRIMARY KEY,
                user_id INTEGER,
                blog_id INTEGER,
                created_at VARCHAR
            )
        """)
        # Create indices
        cursor.execute("CREATE INDEX ix_bookmarks_id ON bookmarks (id)")
        cursor.execute("CREATE INDEX ix_bookmarks_user_id ON bookmarks (user_id)")
        cursor.execute("CREATE INDEX ix_bookmarks_blog_id ON bookmarks (blog_id)")
        
        conn.commit()
        print("Migration successful: Created bookmarks table.")

except Exception as e:
    print(f"Migration failed: {e}")

finally:
    conn.close()
