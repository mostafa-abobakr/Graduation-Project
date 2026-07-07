import urllib.request
import json
import os

API_KEY = os.environ.get("GEMINI_API_KEY")
if not API_KEY:
    raise RuntimeError("GEMINI_API_KEY environment variable is not set.")
url = f"https://generativelanguage.googleapis.com/v1beta/models?key={API_KEY}"

req = urllib.request.Request(url)
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode())

for m in data.get("models", []):
    methods = m.get("supportedGenerationMethods", [])
    if "generateContent" in methods:
        print(m["name"])
