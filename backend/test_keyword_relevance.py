import urllib.request
import urllib.parse
import json

def test_relevance(prompt):
    print(f"Testing prompt: '{prompt}'")
    url = "http://localhost:8005/api/ai/generate-image"
    try:
        data = json.dumps({"prompt": prompt}).encode('utf-8')
        req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req) as response:
            if response.status == 200:
                response_body = response.read().decode('utf-8')
                data = json.loads(response_body)
                url = data.get("image_url", "")
                print(f"Returned URL: {url}")
                
                # Extract keyword from URL: https://loremflickr.com/1024/1024/{keyword}?lock=...
                # url structure: https://loremflickr.com/1024/1024/keyword?lock=...
                parts = url.split("/")
                if len(parts) >= 6:
                    keyword_part = parts[-1].split("?")[0] # The last part is keyword?lock=...
                    keyword = urllib.parse.unquote(keyword_part)
                    print(f"Extracted Keyword in URL: '{keyword}'")
                    
                    if " " not in keyword and len(keyword) < len(prompt):
                        print("SUCCESS: Keyword extracted and simplified.")
                    elif keyword == prompt:
                         print("WARNING: Keyword is same as prompt (Extraction might have failed or prompt was simple).")
                    else:
                        print(f"INFO: Keyword changed to '{keyword}'.")
                else:
                    print("ERROR: URL format unexpected.")
            else:
                print(f"Error: {response.status}")
    except Exception as e:
        print(f"Exception: {e}")
    print("-" * 30)

if __name__ == "__main__":
    test_relevance("generate about aiml") # Should become 'technology' or 'robot' or 'ai'
    test_relevance("healthy cooking tips") # Should become 'food' or 'cooking'
    test_relevance("space exploration mars") # Should become 'space' or 'mars'
