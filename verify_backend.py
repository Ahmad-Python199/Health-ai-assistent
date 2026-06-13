import sys
import json
from fastapi.testclient import TestClient

def safe_print(*args, **kwargs):
    encoding = sys.stdout.encoding or "utf-8"
    new_args = []
    for arg in args:
        if isinstance(arg, str):
            new_args.append(arg.encode(encoding, errors="replace").decode(encoding))
        else:
            new_args.append(arg)
    import builtins
    builtins.print(*new_args, **kwargs)

print = safe_print

# Import app to test
try:
    from backend.app.main import app
except ImportError:
    # Adjust path if running from parent directory
    sys.path.insert(0, "./backend")
    try:
        from app.main import app
    except ImportError as e:
        print(f"Failed to import app: {e}")
        print("Please make sure you are running this from the workspace root directory.")
        sys.exit(1)

client = TestClient(app)

def run_tests():
    print("==================================================")
    print("     RUNNING BACKEND LAYER VERIFICATION TESTS    ")
    print("==================================================")
    
    # Test 1: Root endpoint
    print("\n[Test 1/6] GET / (Root Status Check)...")
    res = client.get("/")
    assert res.status_code == 200, f"Root failed: {res.text}"
    data = res.json()
    print("[OK] Output Status:", data["status"])
    print("[OK] DB Status:", data["database"])
    print("[OK] Disclaimer present:", "disclaimer" in data)

    # Test 2: Emergency Check endpoint
    print("\n[Test 2/6] POST /emergency-check (Cardiovascular check)...")
    payload = {
        "symptoms": ["chest pain", "shortness of breath", "sweating"]
    }
    res = client.post("/emergency-check", json=payload)
    assert res.status_code == 200, f"Emergency check failed: {res.text}"
    data = res.json()
    print("[OK] Is Emergency:", data["is_emergency"])
    print("[OK] Emergency Type:", data["emergency_type"])
    print("[OK] Recommended Action:", data["recommended_action"][:60] + "...")
    assert data["is_emergency"] is True

    # Test 3: ML Predict endpoint (with formatting checks)
    print("\n[Test 3/6] POST /predict (Clinical ML inference)...")
    payload = {
        "symptoms": ["fever", "cough", "shivering", "chills"],
        "severity": "moderate",
        "user_profile": {
            "age": 34,
            "gender": "male",
            "lifestyle": {"smoking": False, "activity": "active"},
            "medical_history": ["asthma"]
        },
        "language": "en"
    }
    res = client.post("/predict", json=payload)
    assert res.status_code == 200, f"Predict failed: {res.text}"
    data = res.json()
    print("[OK] Mapped Symptoms:", data["symptoms"])
    print("[OK] Top condition:", data["predicted_conditions"][0]["name"], "(", data["predicted_conditions"][0]["probability"], ")")
    print("[OK] Calculated Risk Level:", data["risk_level"])
    print("[OK] Explainable AI Output:", data["ml_explanation"][:80] + "...")
    print("[OK] AI Explanation narrative:", data["ai_explanation"][:80] + "...")
    
    # Assert output schema keys strictly
    required_keys = [
        "symptoms", "predicted_conditions", "risk_level", "emergency_alert",
        "ml_explanation", "ai_explanation", "recommendations", "diet_suggestions",
        "lifestyle_suggestions", "disclaimer"
    ]
    for key in required_keys:
        assert key in data, f"Missing strict output key: {key}"
    print("[OK] Strict JSON format validation passed!")

    # Test 4: Save endpoint
    print("\n[Test 4/6] POST /save (Archiving results)...")
    res = client.post("/save", json=data)
    assert res.status_code == 200, f"Save failed: {res.text}"
    save_data = res.json()
    print("[OK] Success flag:", save_data["success"])
    print("[OK] Document Saved ID:", save_data["saved_id"])
    assert save_data["success"] is True

    # Test 5: History endpoint (including trajectory analytics)
    print("\n[Test 5/6] GET /history (User clinical history + trends)...")
    res = client.get("/history?user_id=default_user")
    assert res.status_code == 200, f"History failed: {res.text}"
    history_data = res.json()
    print("[OK] Prediction logs count:", len(history_data["history"]))
    analytics = history_data["analytics"]
    print("[OK] Trajectory Trend Direction:", analytics["trend_direction"])
    print("[OK] Future Risk Trajectory:", analytics["predicted_future_risk"])
    print("[OK] Health trend slope:", analytics["trend_slope"])
    print("[OK] Message:", analytics["trajectory_message"][:80] + "...")

    # Test 6: Chat assistant endpoint
    print("\n[Test 6/6] POST /chat (AI conversational agent)...")
    payload = {
        "message": "I have a mild fever. What should I drink?",
        "user_id": "default_user",
        "language": "en"
    }
    res = client.post("/chat", json=payload)
    assert res.status_code == 200, f"Chat failed: {res.text}"
    chat_data = res.json()
    print("[OK] Reply received:", chat_data["reply"][:80] + "...")
    print("[OK] Model used:", chat_data["model_used"])

    print("\n==================================================")
    print("   ALL BACKEND LAYER CHECKS PASSED SUCCESSFULLY! ")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
