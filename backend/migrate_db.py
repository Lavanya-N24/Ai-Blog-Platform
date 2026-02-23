import sqlite3

# Connect to database
conn = sqlite3.connect('blog.db')
cursor = conn.cursor()

try:
    # Check if column exists
    cursor.execute("PRAGMA table_info(blogs)")
    columns = [info[1] for info in cursor.fetchall()]
    
    if 'user_id' not in columns:
        print("Adding user_id column to blogs table...")
        cursor.execute("ALTER TABLE blogs ADD COLUMN user_id INTEGER")
        conn.commit()
        print("Migration successful: Added user_id column.")
    else:
        print("Column user_id already exists in blogs table.")

except Exception as e:
    print(f"Migration failed: {e}")

finally:
    conn.close()
