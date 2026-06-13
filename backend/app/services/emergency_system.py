import logging
from typing import List, Dict, Any, Tuple

logger = logging.getLogger("health_analyzer.emergency")

class EmergencyDetectionSystem:
    # Define clinical emergency risk rules
    EMERGENCY_RULES = [
        {
            "id": "cardiac_emergency",
            "type": "Cardiovascular (Possible Heart Attack)",
            "required_symptoms": ["chest_pain"],
            "contributing_symptoms": ["shortness_of_breath", "numbness", "dizziness", "sweating", "heart_palpitations"],
            "min_contributing": 1,
            "alert_message": "CRITICAL ALERT: Chest pain combined with secondary signs like shortness of breath or left-arm numbness indicates a possible heart attack.",
            "action": "Call emergency services (911 or local equivalent) immediately. Sit down, remain calm, and do not attempt to drive yourself to the hospital."
        },
        {
            "id": "stroke_emergency",
            "type": "Neurological (Possible Stroke)",
            "required_symptoms": ["slurred_speech", "numbness"],  # Numbness represents sudden weakness/numbness
            "contributing_symptoms": ["confusion", "dizziness", "blurry_vision", "weakness"],
            "min_contributing": 1,
            "alert_message": "CRITICAL ALERT: Sudden slurred speech, confusion, and numbness/weakness are primary warning signs of a stroke.",
            "action": "Act FAST. Call emergency services immediately. Note the time when symptoms first appeared."
        },
        {
            "id": "stroke_emergency_alt",
            "type": "Neurological (Possible Stroke)",
            "required_symptoms": ["confusion"],
            "contributing_symptoms": ["slurred_speech", "blurry_vision", "weakness", "dizziness"],
            "min_contributing": 2,
            "alert_message": "CRITICAL ALERT: Severe confusion combined with speech, vision or balance impairments indicates a neurological emergency.",
            "action": "Seek immediate emergency medical care. Do not wait to see if the symptoms improve."
        },
        {
            "id": "severe_respiratory",
            "type": "Respiratory Distress",
            "required_symptoms": ["shortness_of_breath"],
            "contributing_symptoms": ["chest_pain", "confusion", "dizziness", "weakness"],
            "min_contributing": 2,
            "alert_message": "CRITICAL ALERT: Severe breathing difficulties combined with chest discomfort or confusion indicate acute oxygen deprivation.",
            "action": "Call emergency services. Sit upright. If you have a prescribed rescue inhaler, use it immediately."
        },
        {
            "id": "appendicitis_emergency",
            "type": "Acute Abdomen (Possible Appendicitis)",
            "required_symptoms": ["abdominal_pain"],
            "contributing_symptoms": ["fever", "vomiting", "nausea", "chills"],
            "min_contributing": 2,
            "alert_message": "HIGH ALERT: Localized abdominal pain with fever, chills, and vomiting is highly indicative of acute appendicitis or bowel obstruction.",
            "action": "Do not eat or drink anything. Go to an urgent care clinic or emergency room immediately. Do not take laxatives or pain relievers before being evaluated."
        },
        {
            "id": "sepsis_emergency",
            "type": "Potential Sepsis / Severe Infection",
            "required_symptoms": ["fever"],
            "contributing_symptoms": ["confusion", "chills", "sweating", "extreme_fatigue", "heart_palpitations"],
            "min_contributing": 3,
            "alert_message": "CRITICAL ALERT: High fever accompanied by chills, rapid heartbeat, extreme lethargy, and mental confusion suggests a systemic infection (sepsis).",
            "action": "Sepsis is a medical emergency. Go to the nearest emergency room immediately."
        }
    ]

    @staticmethod
    def evaluate(symptoms: List[str], severity: str = "moderate") -> Tuple[bool, str, str, str]:
        """
        Evaluates a list of structured symptoms and severity level to identify emergency patterns.
        Returns:
            is_emergency: bool
            emergency_type: str
            alert_message: str
            recommended_action: str
        """
        # Clean symptoms to match standard list keys
        symptoms_set = set(symptoms)
        
        # 1. Rule-Based Evaluation
        for rule in EmergencyDetectionSystem.EMERGENCY_RULES:
            # Check if all required symptoms are present
            req_match = all(s in symptoms_set for s in rule["required_symptoms"])
            if req_match:
                # Count contributing symptoms present
                contrib_count = sum(1 for s in rule["contributing_symptoms"] if s in symptoms_set)
                
                # If we meet or exceed the contributing count OR if the user stated severity is 'severe'
                if contrib_count >= rule["min_contributing"] or (severity == "severe" and contrib_count > 0):
                    logger.warning(f"Emergency detected by rule: {rule['id']}")
                    return True, rule["type"], rule["alert_message"], rule["action"]

        # 2. General Fallback for Severe Cases
        # If there are multiple high-risk symptoms marked as "severe" overall
        high_risk_symptoms = {"chest_pain", "shortness_of_breath", "slurred_speech", "confusion", "stiff_neck"}
        severe_count = sum(1 for s in symptoms_set if s in high_risk_symptoms)
        
        if severity == "severe" and severe_count >= 1:
            logger.warning("Emergency detected: Single severe high-risk symptom present.")
            return (
                True,
                "General Medical Emergency",
                "CRITICAL WARNING: You have reported severe high-risk symptoms including cardiopulmonary or neurological distress.",
                "Seek emergency medical services or visit the nearest ER immediately. Do not attempt to drive yourself."
            )
            
        return False, "None", "", ""
