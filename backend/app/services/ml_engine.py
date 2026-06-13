import os
import pickle
import logging
import numpy as np
import pandas as pd
from typing import List, Dict, Any, Tuple
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from app.services.embedding_engine import SYMPTOM_MAP

logger = logging.getLogger("health_analyzer.ml_engine")

MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "ml")
MODEL_PATH = os.path.join(MODEL_DIR, "symptom_model.pkl")
ENCODER_PATH = os.path.join(MODEL_DIR, "label_encoder.pkl")

# Master symptoms list (features for the model)
FEATURES = list(SYMPTOM_MAP.keys()) + ["severity_score", "age", "gender_code"]

DISEASE_PROFILES = {
    "Heart Attack": {
        "symptoms": ["chest_pain", "shortness_of_breath", "numbness", "sweating", "heart_palpitations", "weakness", "nausea"],
        "base_risk": "Critical",
        "prob_weights": [0.9, 0.7, 0.6, 0.5, 0.5, 0.4, 0.3]
    },
    "Stroke": {
        "symptoms": ["slurred_speech", "confusion", "dizziness", "numbness", "blurry_vision", "weakness"],
        "base_risk": "Critical",
        "prob_weights": [0.95, 0.8, 0.7, 0.75, 0.6, 0.5]
    },
    "Influenza (Flu)": {
        "symptoms": ["fever", "cough", "fatigue", "joint_pain", "sore_throat", "muscle_ache", "chills", "sweating", "runny_nose"],
        "base_risk": "Medium",
        "prob_weights": [0.85, 0.8, 0.75, 0.6, 0.6, 0.7, 0.65, 0.4, 0.5]
    },
    "COVID-19": {
        "symptoms": ["fever", "cough", "shortness_of_breath", "fatigue", "sore_throat", "loss_of_taste_smell", "muscle_ache", "chills"],
        "base_risk": "Medium",
        "prob_weights": [0.8, 0.85, 0.65, 0.75, 0.5, 0.9, 0.6, 0.55]
    },
    "Common Cold": {
        "symptoms": ["cough", "runny_nose", "sneezing", "sore_throat", "fatigue"],
        "base_risk": "Low",
        "prob_weights": [0.75, 0.85, 0.9, 0.6, 0.3]
    },
    "Gastroenteritis (Food Poisoning)": {
        "symptoms": ["diarrhea", "vomiting", "nausea", "abdominal_pain", "fever", "fatigue"],
        "base_risk": "Medium",
        "prob_weights": [0.9, 0.85, 0.8, 0.75, 0.4, 0.5]
    },
    "Appendicitis": {
        "symptoms": ["abdominal_pain", "fever", "nausea", "vomiting", "weakness"],
        "base_risk": "High",
        "prob_weights": [0.95, 0.65, 0.7, 0.6, 0.4]
    },
    "Migraine": {
        "symptoms": ["headache", "nausea", "blurry_vision", "dizziness", "fatigue"],
        "base_risk": "Medium",
        "prob_weights": [0.95, 0.6, 0.5, 0.55, 0.4]
    },
    "Diabetes Mellitus": {
        "symptoms": ["frequent_urination", "increased_thirst", "unexplained_weight_loss", "fatigue", "blurry_vision"],
        "base_risk": "Medium",
        "prob_weights": [0.85, 0.9, 0.75, 0.6, 0.5]
    },
    "Asthma Flare-up": {
        "symptoms": ["shortness_of_breath", "cough", "chest_pain", "fatigue"],
        "base_risk": "High",
        "prob_weights": [0.9, 0.7, 0.4, 0.4]
    }
}

class MLEngine:
    def __init__(self):
        os.makedirs(MODEL_DIR, exist_ok=True)
        self.model = None
        self.label_encoder = None
        self.feature_names = FEATURES[:-3]  # Symptoms features list
        
        # Load or train
        if os.path.exists(MODEL_PATH) and os.path.exists(ENCODER_PATH):
            try:
                self.load_model()
            except Exception as e:
                logger.error(f"Error loading model: {e}. Training fresh model.")
                self.train_and_save()
        else:
            self.train_and_save()

    def train_and_save(self):
        """
        Generates clinical-like synthetic dataset and trains a Random Forest Classifier.
        """
        logger.info("Generating synthetic clinical dataset...")
        data = []
        
        # Generate 150 patients per condition
        np.random.seed(42)
        for disease, profile in DISEASE_PROFILES.items():
            for _ in range(180):
                row = {}
                # Set all symptoms to 0
                for sym in self.feature_names:
                    row[sym] = 0
                    
                # Populate symptoms based on conditional weights
                for sym, weight in zip(profile["symptoms"], profile["prob_weights"]):
                    if np.random.random() < weight:
                        row[sym] = 1
                
                # Add background noise: 1-2 random symptoms
                noise_count = np.random.randint(0, 3)
                for _ in range(noise_count):
                    rand_sym = np.random.choice(self.feature_names)
                    row[rand_sym] = 1
                
                # Demographic features
                # age: disease specific distributions
                if disease in ["Heart Attack", "Stroke", "Diabetes Mellitus"]:
                    age = int(np.random.normal(62, 12))
                elif disease in ["Common Cold", "Influenza (Flu)", "Gastroenteritis (Food Poisoning)"]:
                    age = int(np.random.normal(32, 16))
                else:
                    age = int(np.random.normal(40, 18))
                
                row["age"] = max(5, min(100, age))
                
                # gender: 0=Female, 1=Male, 2=Other
                row["gender_code"] = np.random.choice([0, 1]) 
                
                # severity: 1=mild, 2=moderate, 3=severe
                if profile["base_risk"] == "Critical":
                    sev = np.random.choice([2, 3], p=[0.3, 0.7])
                elif profile["base_risk"] == "High":
                    sev = np.random.choice([1, 2, 3], p=[0.1, 0.4, 0.5])
                else:
                    sev = np.random.choice([1, 2, 3], p=[0.5, 0.4, 0.1])
                row["severity_score"] = int(sev)
                
                row["disease"] = disease
                data.append(row)
                
        df = pd.DataFrame(data)
        
        # Train label encoder
        self.label_encoder = LabelEncoder()
        y = self.label_encoder.fit_transform(df["disease"])
        X = df[FEATURES]
        
        # Train model
        self.model = RandomForestClassifier(n_estimators=100, random_state=42, max_depth=12)
        self.model.fit(X, y)
        
        # Save assets
        with open(MODEL_PATH, "wb") as f:
            pickle.dump(self.model, f)
        with open(ENCODER_PATH, "wb") as f:
            pickle.dump(self.label_encoder, f)
            
        logger.info(f"ML Model successfully trained and saved. Classes: {list(self.label_encoder.classes_)}")

    def load_model(self):
        with open(MODEL_PATH, "rb") as f:
            self.model = pickle.load(f)
        with open(ENCODER_PATH, "rb") as f:
            self.label_encoder = pickle.load(f)
        logger.info("ML Model assets loaded successfully.")

    def run_inference(
        self, 
        symptoms: List[str], 
        severity: str, 
        user_profile: Dict[str, Any]
    ) -> Tuple[List[Dict[str, Any]], str, str]:
        """
        Runs ML prediction and adjusts output with the Personalized Health Context Engine.
        Returns:
            predicted_conditions: List of top 3-5 conditions with adjusted probabilities.
            risk_level: overall risk category
            ml_explanation: explainable AI feature importance readout
        """
        # Encode inputs
        x_vector = {}
        for sym in self.feature_names:
            x_vector[sym] = 1 if sym in symptoms else 0
            
        # Severity score
        sev_map = {"mild": 1, "moderate": 2, "severe": 3}
        x_vector["severity_score"] = sev_map.get(severity.lower(), 2)
        
        # Demographic details
        age = user_profile.get("age") or 35
        x_vector["age"] = age
        
        gender = str(user_profile.get("gender") or "female").lower()
        x_vector["gender_code"] = 1 if gender == "male" else 0
        
        # Prepare DataFrame row
        df_row = pd.DataFrame([x_vector])[FEATURES]
        
        # Predict Probabilities
        raw_probs = self.model.predict_proba(df_row)[0]
        classes = self.label_encoder.classes_
        
        # Create dictionary of class -> prob
        probs_dict = {classes[i]: float(raw_probs[i]) for i in range(len(classes))}
        
        # --- 3. PERSONALIZED HEALTH CONTEXT ENGINE (Inference adjustment layer) ---
        lifestyle = user_profile.get("lifestyle") or {}
        med_history = user_profile.get("medical_history") or []
        
        # A. Age Factor adjustments
        if age > 60:
            probs_dict["Heart Attack"] *= 1.35
            probs_dict["Stroke"] *= 1.35
        elif age < 20:
            probs_dict["Common Cold"] *= 1.2
            probs_dict["Influenza (Flu)"] *= 1.15
            probs_dict["Heart Attack"] *= 0.1  # Highly unlikely at young age without congenital issues
            
        # B. Lifestyle Factor adjustments
        if lifestyle.get("smoking") is True:
            probs_dict["Heart Attack"] *= 1.25
            probs_dict["Asthma Flare-up"] *= 1.25
            
        # C. Medical History adjustments
        if "hypertension" in med_history or "high_blood_pressure" in med_history:
            probs_dict["Heart Attack"] *= 1.3
            probs_dict["Stroke"] *= 1.3
        if "asthma" in med_history:
            probs_dict["Asthma Flare-up"] *= 1.50
        if "diabetes" in med_history:
            probs_dict["Diabetes Mellitus"] *= 1.60
            
        # Renormalize probabilities
        total_p = sum(probs_dict.values())
        if total_p > 0:
            for k in probs_dict:
                probs_dict[k] = probs_dict[k] / total_p
                
        # Sort conditions
        sorted_conds = sorted(probs_dict.items(), key=lambda x: x[1], reverse=True)
        
        # Format Top 3-5 conditions
        predicted_conditions = []
        for name, p in sorted_conds[:4]:
            predicted_conditions.append({
                "name": name,
                "probability": f"{round(p * 100, 1)}%"
            })
            
        # Determine Overall Risk Level
        top_condition = sorted_conds[0][0]
        top_prob = sorted_conds[0][1]
        
        base_risk = DISEASE_PROFILES.get(top_condition, {}).get("base_risk", "Low")
        
        # Risk escalation rules
        risk_level = base_risk
        if severity == "severe":
            if base_risk == "Low":
                risk_level = "Medium"
            elif base_risk == "Medium":
                risk_level = "High"
            elif base_risk == "High":
                risk_level = "Critical"
                
        if age > 70 and risk_level == "High":
            risk_level = "Critical"
            
        # --- EXPLAINABLE AI (Feature Importance Readout) ---
        # Calculate feature contributions: For the active symptoms in the user input, 
        # how important are they relative to the Random Forest overall importances?
        importances = self.model.feature_importances_
        feature_importance_dict = {FEATURES[i]: float(importances[i]) for i in range(len(FEATURES))}
        
        active_importances = []
        for sym in symptoms:
            if sym in feature_importance_dict:
                active_importances.append((sym, feature_importance_dict[sym]))
                
        # Sort by importance
        active_importances.sort(key=lambda x: x[1], reverse=True)
        
        if active_importances:
            importance_lines = []
            for sym, val in active_importances[:3]:
                sym_clean = sym.replace("_", " ").title()
                importance_lines.append(f"'{sym_clean}' (model weight: {round(val * 100, 1)}%)")
                
            explanation = (
                f"Explainable AI Diagnostic: The model's decision path was heavily influenced by active symptom drivers: "
                f"{', '.join(importance_lines)}. "
            )
            if severity == "severe":
                explanation += f"The clinical escalation rule triggered a risk adjustment based on your reported severe intensity status."
            else:
                explanation += f"The model predictions were contextualized by patient factors (Age: {age}, History: {', '.join(med_history) or 'None'})."
        else:
            explanation = "Explainable AI Diagnostic: Base classifier predictions generated from patient demographics and symptom profile weights."
            
        return predicted_conditions, risk_level, explanation

ml_engine = MLEngine()
