import os
from groq import Groq
from dotenv import load_dotenv
import pathlib

# Load .env
base_dir = pathlib.Path(__file__).parent
env_path = base_dir / ".env"
load_dotenv(dotenv_path=env_path)

api_key = os.getenv("GROQ_API_KEY")
print(f"API Key found: {bool(api_key)}")

if api_key:
    try:
        client = Groq(api_key=api_key)
        models = client.models.list()
        with open("full_models.txt", "w", encoding="utf-8") as f:
            for m in models.data:
                f.write(f"{m.id}\n")
        print("Models written to full_models.txt")
    except Exception as e:
        print(f"Error listing models: {e}")
else:
    print("No API key found")
