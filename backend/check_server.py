import requests

try:
    print("Checking backend root...")
    resp = requests.get("http://localhost:8000/", timeout=5)
    print(f"Root status: {resp.status_code}")
    print(resp.json())

    print("\nChecking backend health...")
    resp = requests.get("http://localhost:8000/health", timeout=5)
    print(f"Health status: {resp.status_code}")
    print(resp.json())
except Exception as e:
    print(f"Error checking server: {e}")
