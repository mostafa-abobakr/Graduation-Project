import requests

def main():
    url = "https://youseef-awaad-zerobite-ai-engine.hf.space/forecast/all/hourly/54"
    payload = {
        "temperature_celsius": 25.0,
        "event_day": 0
    }
    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        data = response.json()
        print("Success! Response type:", type(data))
        if isinstance(data, dict):
            print("Dict keys:", list(data.keys()))
            # Print a snippet of the first item
            first_key = list(data.keys())[0]
            print(f"Sample data for key '{first_key}':", data[first_key][:2] if isinstance(data[first_key], list) else data[first_key])
        elif isinstance(data, list):
            print("List length:", len(data))
            print("Sample data:", data[:2])
    except requests.RequestException as e:
        print("Failed to query remote forecast:", e)
        if e.response is not None:
            print("Status code:", e.response.status_code)
            print("Response text:", e.response.text)

if __name__ == "__main__":
    main()
