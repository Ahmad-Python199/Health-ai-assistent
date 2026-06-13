import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

import httpx
import asyncio
from app.config import settings

async def test():
    print("Testing OpenRouter API connection...")
    print(f"API Key: {settings.openrouter_api_key[:10]}...{settings.openrouter_api_key[-10:] if len(settings.openrouter_api_key) > 20 else ''}")
    print(f"Model: {settings.default_llm_model}")
    
    headers = {
        "Authorization": f"Bearer {settings.openrouter_api_key}",
        "HTTP-Referer": "https://github.com/google-deepmind/antigravity",
        "X-Title": "AI Health Symptom Analyzer Test",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "openrouter/free",
        "messages": [
            {"role": "user", "content": "Say hello!"}
        ]
    }
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=headers,
                json=payload
            )
            print(f"HTTP Status: {response.status_code}")
            if response.status_code == 200:
                print("Success! Response JSON:")
                print(response.json()["choices"][0]["message"]["content"])
            else:
                print(f"Failed. Status code: {response.status_code}")
                print(response.text)
    except Exception as e:
        print(f"Error occurred: {e}")

if __name__ == "__main__":
    asyncio.run(test())
