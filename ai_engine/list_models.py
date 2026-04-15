import urllib.request
import json

API_KEY = "AIzaSyDkEkf-QTkJVGr19_gNO0eDfRZoMtK79MI"
url = f"https://generativelanguage.googleapis.com/v1beta/models?key={API_KEY}"

req = urllib.request.Request(url)
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode())

for m in data.get("models", []):
    methods = m.get("supportedGenerationMethods", [])
    if "generateContent" in methods:
        print(m["name"])
