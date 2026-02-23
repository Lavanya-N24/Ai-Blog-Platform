import requests
import json
import time

BASE_URL = "http://localhost:8005/api/blog"

def test_create_and_fetch():
    print("1. Creating a test blog post...")
    blog_data = {
        "title": "Persistent Blog Test",
        "content": "This content should appear after restart.",
        "author": "Tester",
        "tags": ["testing", "persistence"]
    }
    
    try:
        resp = requests.post(f"{BASE_URL}/create", json=blog_data)
        if resp.status_code == 200:
            print("Blog created successfully.")
            blog_id = resp.json()["blog"]["id"]
            print(f"Blog ID: {blog_id}")
            
            print("2. Fetching all blogs...")
            resp = requests.get(f"{BASE_URL}/")
            blogs = resp.json()["blogs"]
            found = any(b["id"] == blog_id for b in blogs)
            if found:
                print("SUCCESS: Blog found in database list.")
            else:
                print("FAILURE: Blog not found in list.")
        else:
            print(f"Failed to create blog: {resp.text}")
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    test_create_and_fetch()
