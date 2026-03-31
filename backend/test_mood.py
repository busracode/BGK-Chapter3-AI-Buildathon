import requests
import sys

def test_mood():
    url = "http://localhost:8000/api/users/10d42423-dc85-4ac2-8196-6b7977faa100/mood"
    payload = {"mood_text": "Çok mutluyum ve huzurluyum."}
    try:
        print(f"Testing {url} with {payload}...")
        resp = requests.post(url, json=payload, timeout=15)
        print(f"Status: {resp.status_code}")
        print(f"Body: {resp.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_mood()
