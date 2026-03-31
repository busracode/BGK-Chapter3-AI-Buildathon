import httpx
import asyncio

async def test_api():
    base_url = "http://localhost:8000/api"
    print("=== Testing Hayat Ağacı API ===")
    
    async with httpx.AsyncClient() as client:
        # 1. Test Auth Register
        print("\n1. Testing POST /auth/register...")
        resp = await client.post(f"{base_url}/auth/register", json={
            "name": "Ahmet",
            "age": 22,
            "city": "Istanbul",
            "role": "genç",
            "current_mood_text": "Kariyerim hakkında çok kafam karışık."
        })
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.json()}")
        
        user_id = resp.json().get("id")
        
        if user_id:
            # 2. Test Auth Login
            print("\n2. Testing POST /auth/login...")
            resp2 = await client.post(f"{base_url}/auth/login", json={"user_id": user_id})
            print(f"Status: {resp2.status_code}")
            print(f"Response: {resp2.json()}")
            
            # 3. Test Journal Create
            print("\n3. Testing POST /journal/{user_id}...")
            resp3 = await client.post(f"{base_url}/journal/{user_id}", json={"content": "Zorluklar beni güçlendirir."})
            print(f"Status: {resp3.status_code}")
            print(f"Response: {resp3.json()}")
            
            # 4. Test Journal Read
            print("\n4. Testing GET /journal/{user_id}...")
            resp4 = await client.get(f"{base_url}/journal/{user_id}")
            print(f"Status: {resp4.status_code}")
            print(f"Response: {resp4.json()}")
            
            # 5. Test Moderation Emergency
            print("\n5. Testing POST /moderation/emergency/session_1/{user_id}...")
            resp5 = await client.post(f"{base_url}/moderation/emergency/session_1/{user_id}")
            print(f"Status: {resp5.status_code}")
            print(f"Response: {resp5.json()}")
            
            # 6. Test Moderation Alerts
            print("\n6. Testing GET /moderation/alerts...")
            resp6 = await client.get(f"{base_url}/moderation/alerts")
            print(f"Status: {resp6.status_code}")
            print(f"Response: {resp6.json()}")

if __name__ == "__main__":
    asyncio.run(test_api())
