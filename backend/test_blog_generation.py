import urllib.request
import json

url = "http://localhost:8005/api/ai/generate-blog"
payload = {
    "topic": "Future of AI",
    "length": "short"
}
data = json.dumps(payload).encode('utf-8')

print(f"Sending request to {url}...")
try:
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req) as response:
        if response.status == 200:
            body = response.read().decode('utf-8')
            data = json.loads(body)
            content = data.get("content", "")
            print("Success!")
            print("-" * 20)
            
            if "pollinations.ai" in content:
                print("FOUND POLLINATIONS IMAGE URL!")
            elif "oaidalleapiprodscus" in content:
                print("FOUND DALL-E IMAGE URL (Unexpected!)")
            elif "picsum.photos" in content:
                print("FOUND FALLBACK PICSUM IMAGE URL.")
            elif "source.unsplash.com" in content:
                print("FOUND BROKEN UNSPLASH URL (Update failed?)")
            else:
                print("NO RECOGNIZED IMAGE URL FOUND.")
            
            print("-" * 20)
            print(content[:500])
        else:
            print(f"Failed: {response.status}")
except Exception as e:
    print(f"Error: {e}")
