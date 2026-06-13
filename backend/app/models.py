from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class UserProfile(BaseModel):
    age: Optional[int] = Field(default=None, description="Age of the patient")
    gender: Optional[str] = Field(default=None, description="Gender of the patient")
    lifestyle: Optional[Dict[str, Any]] = Field(
        default_factory=dict, 
        description="Lifestyle factors like {'smoking': False, 'activity': 'moderate', 'diet': 'balanced'}"
    )
    medical_history: Optional[List[str]] = Field(
        default_factory=list,
        description="Past medical conditions, e.g., ['diabetes', 'hypertension']"
    )

class PredictRequest(BaseModel):
    symptoms: List[str] = Field(..., description="List of symptoms entered by the user")
    severity: str = Field(default="moderate", description="Symptom severity: 'mild', 'moderate', 'severe'")
    user_profile: Optional[UserProfile] = Field(default_factory=UserProfile)
    language: Optional[str] = Field(default="en", description="Output language: 'en' (English), 'ur' (Urdu), 'hi' (Hindi)")
    user_id: Optional[str] = Field(default="default_user", description="ID of the user requesting prediction")

class ConditionPrediction(BaseModel):
    name: str = Field(..., description="Condition/disease name")
    probability: str = Field(..., description="Formatted probability percentage, e.g., '85%' or '0.85'")

class PredictResponse(BaseModel):
    symptoms: List[str] = Field(..., description="List of parsed/mapped symptoms")
    predicted_conditions: List[ConditionPrediction] = Field(..., description="Top 3-5 predicted conditions")
    risk_level: str = Field(..., description="Calculated risk level: 'Low', 'Medium', 'High', 'Critical'")
    emergency_alert: str = Field(default="", description="Alert warning description if emergency is detected")
    ml_explanation: str = Field(..., description="Explainable AI output and reasoning based on feature importance")
    ai_explanation: str = Field(..., description="OpenRouter-generated human-friendly natural language explanation")
    recommendations: List[str] = Field(default_factory=list, description="General safety recommendations")
    diet_suggestions: List[str] = Field(default_factory=list, description="Dietary improvements")
    lifestyle_suggestions: List[str] = Field(default_factory=list, description="Lifestyle recommendations")
    disclaimer: str = Field(
        default="This system provides informational insights only and is not a substitute for professional medical advice.",
        description="Required medical safety disclaimer"
    )
    user_id: Optional[str] = Field(default="default_user")
    timestamp: Optional[str] = Field(default=None)

class ChatRequest(BaseModel):
    message: str = Field(..., description="User request message")
    user_id: Optional[str] = Field(default="default_user")
    language: Optional[str] = Field(default="en", description="Language of interaction")
    model: Optional[str] = Field(default=None, description="OpenRouter model name")

class ChatResponse(BaseModel):
    reply: str = Field(..., description="Assistant reply")
    model_used: str = Field(..., description="Name of OpenRouter model used")

class EmergencyCheckRequest(BaseModel):
    symptoms: List[str] = Field(..., description="List of symptoms")

class EmergencyCheckResponse(BaseModel):
    is_emergency: bool = Field(..., description="Flags if symptom set indicates a life-threatening scenario")
    emergency_type: Optional[str] = Field(default=None, description="Type of emergency, e.g. 'Cardiovascular', 'Neurological'")
    alert_message: str = Field(..., description="Safety and emergency directions")
    recommended_action: str = Field(..., description="Action to take immediately, e.g., Call 911 / Go to ER")

class SaveResponse(BaseModel):
    success: bool
    saved_id: str
    message: str
