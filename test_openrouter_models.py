import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

import httpx
import asyncio
from app.config import settings

async def test_models():
    models_to_test = [
        "meta-llama/llama-3.1-8b-instruct:free",
        "google/gemma-2-9b-it:free",
        "mistralai/mistral-7b-instruct:free",
        "qwen/qwen-2-7b-instruct:free",
        "openchat/openchat-7b:free"
    ]
    
    headers = {
        "Authorization": f"Bearer {settings.openrouter_api_key}",
        "HTTP-Referer": "https://github.com/google-deepmind/antigravity",
        "X-Title": "AI Health Symptom Analyzer Test",
        "Content-Type": "application/json"
    }
    
    for model in models_to_test:
        print(f"\nTesting model: {model}...")
        payload = {
            "model": model,
            "messages": [
                {"role": "user", "content": "Hello! Reply with 'OK' and the model name."}
            ]
        }
        
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                response = await client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers=headers,
                    json=payload
                )
                print(f"HTTP Status: {response.status_code}")
                if response.status_code == 200:
                    print("Success! Response:")
                    print(response.json()["choices"][0]["message"]["content"])
                    # Return the first working model
                    return model
                else:
                    print(f"Failed. Response: {response.text}")
        except Exception as e:
            print(f"Error: {e}")
            
    return None

if __name__ == "__main__":
    asyncio.run(test_models())
