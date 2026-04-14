import os
import requests

api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    print("GEMINI_API_KEY not found in environment")
    exit(1)

urls = [
    "https://generativelanguage.googleapis.com/v1/models?key=" + api_key,
    "https://generativelanguage.googleapis.com/v1beta/models?key=" + api_key
]

for url in urls:
    print(f"\nChecking models for {url.split('?')[0]}...")
    try:
        resp = requests.get(url).json()
        if "models" in resp:
            for m in resp["models"]:
                print(f" - {m['name']} (Supports: {', '.join(m['supportedGenerationMethods'])})")
        else:
            print(f" Error: {resp}")
    except Exception as e:
        print(f" Request failed: {e}")
