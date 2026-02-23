import urllib.request
import urllib.parse
import random

topic = "generate abt aiml"
prompt = f"A hyper-realistic, professional editorial blog header image about {topic}. High quality, detailed, cinematic lighting."
encoded_prompt = urllib.parse.quote(prompt)
seed = random.randint(1, 100000)
url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=1024&height=1024&seed={seed}&nologo=true"

print(f"Testing URL: {url}")
headers = {'User-Agent': 'Mozilla/5.0'}

try:
    req = urllib.request.Request(url, headers=headers, method='HEAD')
    with urllib.request.urlopen(req) as response:
        print(f"Status Code: {response.status}")
        if response.status == 200:
            print("URL is accessible!")
        else:
            print("URL returned non-200 status.")
except Exception as e:
    print(f"Error accessing URL: {e}")
