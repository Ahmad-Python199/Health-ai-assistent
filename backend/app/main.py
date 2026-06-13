import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from typing import List, Dict, Any

from app.config import settings
from app.database import db
from app.models import (
    PredictRequest, PredictResponse, ConditionPrediction,
    ChatRequest, ChatResponse,
    EmergencyCheckRequest, EmergencyCheckResponse,
    SaveResponse
)
from app.services.embedding_engine import embedding_engine
from app.services.emergency_system import EmergencyDetectionSystem
from app.services.openrouter_client import openrouter_client
from app.services.ml_engine import ml_engine
from app.services.translation_service import TranslationService
from app.services.longitudinal_service import LongitudinalService

# Logger configuration
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("health_analyzer.main")

app = FastAPI(
    title="AI Health Symptom Analyzer API",
    description="Educational health insights, symptom classification, and emergency detection backend.",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development; specify actual domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Standard clinical suggestions fallback dictionary
SUGGESTIONS_DB = {
    "Heart Attack": {
        "recommendations": ["Call emergency services immediately.", "Do not engage in physical activity.", "Sit down, rest, and keep calm."],
        "diet_suggestions": ["Do not consume food or drink until evaluated by emergency professionals."],
        "lifestyle_suggestions": ["Ensure someone stays with you.", "Avoid driving yourself; wait for an ambulance."]
    },
    "Stroke": {
        "recommendations": ["Call emergency services immediately.", "Note the exact time symptoms started.", "Keep the patient lying down with head slightly elevated."],
        "diet_suggestions": ["Do not give the patient anything to eat or drink due to choking risk."],
        "lifestyle_suggestions": ["Follow the FAST guidelines (Face, Arm, Speech, Time to call)."]
    },
    "Influenza (Flu)": {
        "recommendations": ["Rest at home.", "Avoid close contact with others.", "Take over-the-counter pain/fever relievers if approved by doctor."],
        "diet_suggestions": ["Drink warm broths, herbal teas, and plenty of water.", "Consume nutrient-dense soups."],
        "lifestyle_suggestions": ["Ensure 8+ hours of sleep.", "Use a cool-mist humidifier in your bedroom."]
    },
    "COVID-19": {
        "recommendations": ["Self-isolate to prevent transmission.", "Monitor blood oxygen level (SPO2) and temperature.", "Wear a high-quality mask if around others."],
        "diet_suggestions": ["Stay well hydrated with water and electrolyte solutions.", "Eat small, frequent, vitamin-rich meals."],
        "lifestyle_suggestions": ["Get plenty of rest.", "Ventilate your living quarters well."]
    },
    "Common Cold": {
        "recommendations": ["Get plenty of sleep.", "Gargle with warm salt water for throat relief."],
        "diet_suggestions": ["Drink warm water, tea, or lemon honey mixtures.", "Eat light meals like chicken soup."],
        "lifestyle_suggestions": ["Keep your neck and chest warm.", "Wash hands frequently to avoid spreading."]
    },
    "Gastroenteritis (Food Poisoning)": {
        "recommendations": ["Drink small sips of water or rehydration salts frequently.", "Avoid dehydration.", "Rest your digestive system."],
        "diet_suggestions": ["Follow the BRAT diet (Bananas, Rice, Applesauce, Toast).", "Avoid dairy, caffeine, and spicy foods."],
        "lifestyle_suggestions": ["Wash hands thoroughly.", "Sanitize high-touch household surfaces."]
    },
    "Appendicitis": {
        "recommendations": ["Go to the nearest emergency department immediately.", "Do not apply heat to your abdomen."],
        "diet_suggestions": ["Strictly fast (no food or water) in case emergency surgery is needed."],
        "lifestyle_suggestions": ["Avoid all pain relievers or laxatives before medical evaluation."]
    },
    "Migraine": {
        "recommendations": ["Rest in a dark, quiet room.", "Apply a cold compress to the forehead or neck."],
        "diet_suggestions": ["Avoid trigger items (caffeine, aged cheeses, chocolate).", "Maintain consistent meal schedules."],
        "lifestyle_suggestions": ["Keep a migraine journal to identify patterns.", "Reduce stress through breathing exercises."]
    },
    "Diabetes Mellitus": {
        "recommendations": ["Schedule a checkup with a physician for blood glucose testing.", "Learn the signs of high/low blood sugar."],
        "diet_suggestions": ["Focus on low glycemic index foods.", "Incorporate high-fiber vegetables and lean proteins.", "Limit refined sugars."],
        "lifestyle_suggestions": ["Incorporate regular walk routines.", "Check feet daily for minor cuts or blisters."]
    },
    "Asthma Flare-up": {
        "recommendations": ["Use your rescue inhaler as prescribed.", "Move away from known triggers (smoke, pollen, dust)."],
        "diet_suggestions": ["Drink warm liquids to help relax airways.", "Eat a diet high in vitamins C and E."],
        "lifestyle_suggestions": ["Monitor your peak flow rates.", "Ensure your asthma action plan is readily accessible."]
    }
}

@app.get("/")
async def root():
    mongo_status = "connected" if not db.use_fallback else "offline (file fallback active)"
    return {
        "app": "AI Health Symptom Analyzer API",
        "status": "healthy",
        "database": mongo_status,
        "disclaimer": "This system provides informational insights only and is not a substitute for professional medical advice."
    }

@app.post("/predict", response_model=PredictResponse)
async def predict_symptoms(request: PredictRequest):
    try:
        logger.info(f"Received predict request for symptoms: {request.symptoms} in language: {request.language}")
        
        # 1. EMBEDDING INTELLIGENCE: Resolve free-text or structured symptoms to standard features
        resolved_symptoms = embedding_engine.process_symptom_list(request.symptoms)
        if not resolved_symptoms:
            # If no symptoms can be mapped, use the raw ones to avoid blanking
            resolved_symptoms = [s.strip().replace(" ", "_").lower() for s in request.symptoms if s.strip()]
            
        if not resolved_symptoms:
            raise HTTPException(status_code=400, detail="Could not extract any valid symptoms from inputs.")

        # 2. EMERGENCY DETECTION LAYER
        is_emergency, emergency_type, alert, action = EmergencyDetectionSystem.evaluate(
            resolved_symptoms, request.severity
        )

        # 3. MACHINE LEARNING INFERENCE
        profile_dict = request.user_profile.model_dump()
        predicted_conditions, risk_level, ml_explanation = ml_engine.run_inference(
            resolved_symptoms, request.severity, profile_dict
        )

        # Override risk level if emergency evaluation detected critical status
        if is_emergency:
            risk_level = "Critical"

        # 4. PREPARE RECOMMENDATIONS & DIET/LIFESTYLE SUGGESTIONS
        top_condition = predicted_conditions[0]["name"] if predicted_conditions else "Common Cold"
        sugg = SUGGESTIONS_DB.get(top_condition, SUGGESTIONS_DB["Common Cold"])
        
        recommendations = list(sugg["recommendations"])
        diet_suggestions = list(sugg["diet_suggestions"])
        lifestyle_suggestions = list(sugg["lifestyle_suggestions"])
        
        # If emergency was detected, append action advice to recommendations
        if is_emergency and action:
            recommendations.insert(0, action)

        # 5. OPENROUTER AI NARRATIVE GENERATION
        ai_explanation = await openrouter_client.generate_explanation(
            predicted_conditions=predicted_conditions,
            symptoms=resolved_symptoms,
            severity=request.severity,
            user_profile=profile_dict
        )

        # Prepare final raw response dictionary
        response_dict = {
            "symptoms": resolved_symptoms,
            "predicted_conditions": [
                ConditionPrediction(name=c["name"], probability=c["probability"]) for c in predicted_conditions
            ],
            "risk_level": risk_level,
            "emergency_alert": alert if is_emergency else "",
            "ml_explanation": ml_explanation,
            "ai_explanation": ai_explanation,
            "recommendations": recommendations,
            "diet_suggestions": diet_suggestions,
            "lifestyle_suggestions": lifestyle_suggestions,
            "disclaimer": "This system provides informational insights only and is not a substitute for professional medical advice.",
            "user_id": request.user_id,
            "timestamp": datetime.utcnow().isoformat()
        }

        # 6. MULTILINGUAL TRANSLATION LAYER (Urdu/Hindi support)
        if request.language in ["ur", "hi"]:
            response_dict = await TranslationService.translate_response_via_llm(
                response_dict, request.language, openrouter_client
            )

        return PredictResponse(**response_dict)

    except Exception as e:
        logger.error(f"Prediction failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Prediction Engine Error: {str(e)}")

@app.post("/chat", response_model=ChatResponse)
async def chat_health_assistant(request: ChatRequest):
    try:
        # Get user's latest prediction context if available to feed the assistant
        history = await db.get_predictions(request.user_id)
        latest_prediction = history[0] if history else None
        
        # Fetch last chat logs for context
        logs = await db.get_chat_logs(request.user_id)
        chat_history = []
        for log in logs:
            chat_history.append({"role": "user", "content": log["user_message"]})
            chat_history.append({"role": "assistant", "content": log["ai_response"]})
            
        # Call OpenRouter client
        reply = await openrouter_client.generate_chat_reply(
            chat_history=chat_history,
            user_message=request.message,
            latest_prediction=latest_prediction,
            model=request.model
        )
        
        # Save chat log in background/db
        log_payload = {
            "user_id": request.user_id,
            "user_message": request.message,
            "ai_response": reply,
            "model_used": request.model or settings.default_llm_model,
            "timestamp": datetime.utcnow().isoformat()
        }
        await db.save_chat_log(log_payload)
        
        return ChatResponse(
            reply=reply,
            model_used=request.model or settings.default_llm_model
        )
    except Exception as e:
        logger.error(f"Chat completion failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Chat Assistant Error: {str(e)}")

@app.get("/history")
async def get_user_history(user_id: str = "default_user"):
    try:
        history = await db.get_predictions(user_id)
        
        # LONGITUDINAL HEALTH INTELLIGENCE SYSTEM
        # Tracks health metrics and trajectories over time
        analysis = LongitudinalService.analyze_trajectory(history)
        
        return {
            "history": history,
            "analytics": analysis
        }
    except Exception as e:
        logger.error(f"Failed to fetch history: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Database Retrieval Error: {str(e)}")

@app.delete("/history/{prediction_id}")
async def delete_history_item(prediction_id: str):
    try:
        deleted = await db.delete_prediction(prediction_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Prediction log not found or already deleted.")
        return {"success": True, "message": f"Successfully deleted prediction {prediction_id}."}
    except Exception as e:
        logger.error(f"Failed to delete history log: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Database Deletion Error: {str(e)}")

@app.post("/save", response_model=SaveResponse)
async def save_prediction_result(prediction: Dict[str, Any]):
    try:
        if not prediction:
            raise HTTPException(status_code=400, detail="Empty prediction payload.")
            
        # Basic validation of payload keys
        required_keys = ["symptoms", "predicted_conditions", "risk_level"]
        if not all(k in prediction for k in required_keys):
            raise HTTPException(status_code=400, detail="Invalid prediction payload. Missing required fields.")
            
        saved_doc = await db.save_prediction(prediction)
        return SaveResponse(
            success=True,
            saved_id=saved_doc["_id"],
            message="Prediction successfully archived in patient timeline."
        )
    except Exception as e:
        logger.error(f"Failed to save prediction: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Database Insertion Error: {str(e)}")

@app.post("/emergency-check", response_model=EmergencyCheckResponse)
async def check_emergency_status(request: EmergencyCheckRequest):
    try:
        # Resolve symptoms list
        resolved_symptoms = embedding_engine.process_symptom_list(request.symptoms)
        if not resolved_symptoms:
            resolved_symptoms = [s.strip().replace(" ", "_").lower() for s in request.symptoms if s.strip()]
            
        is_emergency, emergency_type, alert, action = EmergencyDetectionSystem.evaluate(
            resolved_symptoms, severity="moderate"
        )
        
        # General response strings
        alert_msg = alert if is_emergency else "No acute emergency patterns detected."
        action_msg = action if is_emergency else "Monitor symptoms and rest. If symptoms worsen, contact a physician."
        
        return EmergencyCheckResponse(
            is_emergency=is_emergency,
            emergency_type=emergency_type if is_emergency else None,
            alert_message=alert_msg,
            recommended_action=action_msg
        )
    except Exception as e:
        logger.error(f"Emergency validation check failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Emergency Validation Error: {str(e)}")
