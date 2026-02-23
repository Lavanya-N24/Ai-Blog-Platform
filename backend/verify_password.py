import urllib.request
import urllib.parse
import json
import sys
import time

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

def test_password_change():
    print("Waiting for server to start...")
    # time.sleep(5)  <-- Removed sleep as server is running

    # 1. Login
    print("1. Logging in...")
    status, res = make_request("POST", "/auth/login", {
        "email": "lavanyanm75@gmail.com",
        "password": "lav123"
    })

    if status != 200:
        print(f"Login failed: {res}")
        # Try new password
        status, res = make_request("POST", "/auth/login", {
            "email": "lavanyanm75@gmail.com",
            "password": "newpassword123"
        })
        if status == 200:
            print("Login successful with NEW password. Resetting...")
            user_id = res["user_id"]
            status, reset_res = make_request("PUT", f"/user/{user_id}/password", {
                "current_password": "newpassword123",
                "new_password": "lav123"
            })
            if status == 200:
                print("Password reset to default.")
                return
            else:
                print(f"Failed to reset: {reset_res}")
                return
        print("Could not login.")
        sys.exit(1)

    user_id = res["user_id"]
    print(f"Logged in as user {user_id}")

    # 2. Change password
    print("2. Changing password...")
    status, change_res = make_request("PUT", f"/user/{user_id}/password", {
        "current_password": "lav123",
        "new_password": "newpassword123"
    })

    if status == 200:
        print("Password change successful!")
    else:
        print(f"Password change failed: {change_res}")
        sys.exit(1)

    # 3. Verify
    print("3. Verifying login...")
    status, login_res = make_request("POST", "/auth/login", {
        "email": "lavanyanm75@gmail.com",
        "password": "newpassword123"
    })

    if status == 200:
        print("Verification successful!")
        # 4. Revert
        print("4. Reverting...")
        status, revert_res = make_request("PUT", f"/user/{user_id}/password", {
            "current_password": "newpassword123",
            "new_password": "lav123"
        })
        if status == 200:
            print("Revert successful.")
        else:
            print(f"Revert failed: {revert_res}")
    else:
        print(f"Verification failed: {login_res}")
        sys.exit(1)

if __name__ == "__main__":
    test_password_change()
