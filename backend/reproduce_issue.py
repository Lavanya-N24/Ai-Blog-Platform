import urllib.request
import urllib.parse
import json
import sys
import time
import random

BASE_URL = "http://localhost:8000/api"

def make_request(method, endpoint, data=None):
    url = f"{BASE_URL}{endpoint}"
    if data:
        data_bytes = json.dumps(data).encode('utf-8')
        req = urllib.request.Request(url, data=data_bytes, method=method)
        req.add_header('Content-Type', 'application/json')
    else:
        req = urllib.request.Request(url, method=method)
    
    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode('utf-8')
            return response.getcode(), json.loads(res_body)
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode('utf-8'))
    except urllib.error.URLError as e:
        print(f"Connection error: {e.reason}")
        sys.exit(1)

def test_user_flow():
    print("Waiting for server...")
    # time.sleep(1) 

    # 1. Register a NEW standard user
    email = f"user_{int(time.time())}@example.com"
    password = "password123"
    print(f"1. Registering new user: {email}")
    
    # Check if register endpoint exists (assuming it is in auth)
    # If not, we might need to rely on seed or admin creation. 
    # But for a blog platform, registration usually exists.
    # Let's check auth routes first or try /auth/register
    
    status, res = make_request("POST", "/auth/register", {
        "email": email,
        "password": password,
        "full_name": "Test User"
    })
    
    if status == 404:
        print("Feature /auth/register not found. Trying /auth/signup or skipping if manual.")
        # Try /auth/signup
        status, res = make_request("POST", "/auth/signup", {
            "email": email,
            "password": password,
            "full_name": "Test User"
        })
    
    if status != 200 and status != 201:
        print(f"Registration failed ({status}): {res}")
        # If registration fails, maybe we can't test this easily without UI.
        # But wait, looking at user.py, there is NO create user endpoint there.
        # Looking at auth.py (previously viewed), it only had /login!
        # This might be the problem - users can't register?
        # Or maybe I missed reading the whole auth.py file.
        # Let's assume for now I need to check auth.py content again.
        return

    print("Registration successful.")

    # 2. Login
    print("2. Logging in...")
    status, res = make_request("POST", "/auth/login", {
        "email": email,
        "password": password
    })
    
    if status != 200:
        print(f"Login failed: {res}")
        sys.exit(1)
        
    user_id = res["user_id"]
    print(f"Logged in as user {user_id}")
    
    # 3. Update Profile
    print("3. Updating profile (Bio & Social)...")
    new_bio = "This is a real world bio update."
    new_social = {"twitter": "http://x.com/realworld"}
    
    status, update_res = make_request("PUT", f"/user/{user_id}", {
        "bio": new_bio,
        "social_links": new_social
    })
    
    if status != 200:
        print(f"Update failed: {update_res}")
        sys.exit(1)
        
    print("Update successful.")
    
    # 4. Verify Persistence (Get Profile)
    print("4. Verifying persistence...")
    status, get_res = make_request("GET", f"/user/{user_id}")
    
    if status != 200:
        print(f"Get profile failed: {get_res}")
        sys.exit(1)
        
    fetched_bio = get_res.get("bio")
    fetched_social = get_res.get("social_links")
    
    print(f"Fetched Bio: {fetched_bio}")
    print(f"Fetched Social: {fetched_social}")
    
    if fetched_bio == new_bio and fetched_social.get("twitter") == new_social["twitter"]:
        print("SUCCESS: Profile updates persisted correctly.")
    else:
        print("FAILURE: Profile updates did NOT persist.")
        print(f"Expected: {new_bio}, {new_social}")
        print(f"Got: {fetched_bio}, {fetched_social}")

if __name__ == "__main__":
    test_user_flow()
