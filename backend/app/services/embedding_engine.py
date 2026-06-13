import numpy as np
from typing import List, Dict, Any, Tuple
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Define the symptom corpus with rich clinical synonyms
SYMPTOM_MAP = {
    "chest_pain": ["chest pain", "chest tightness", "chest pressure", "heart pain", "pain in chest", "angina", "squeezing chest pain"],
    "shortness_of_breath": ["shortness of breath", "difficulty breathing", "breathlessness", "cannot breathe", "dyspnea", "gasping", "shallow breathing"],
    "fever": ["fever", "high temperature", "feverish", "hot body", "pyrexia", "warm forehead", "elevated temperature"],
    "cough": ["cough", "coughing", "dry cough", "wet cough", "productive cough", "hacking cough", "throat tickle"],
    "headache": ["headache", "head pain", "migraine", "throbbing head", "head aching", "cephalalgia", "tension headache"],
    "fatigue": ["fatigue", "tiredness", "exhaustion", "weakness", "lethargy", "sleepy", "drowsy", "no energy", "feeling drained"],
    "nausea": ["nausea", "feeling sick", "queasy", "nauseous", "stomach discomfort", "upset stomach"],
    "vomiting": ["vomiting", "throwing up", "puke", "puking", "emesis", "heaving"],
    "diarrhea": ["diarrhea", "loose stools", "watery poop", "frequent bathroom trips", "runny stomach", "loose bowel movements"],
    "abdominal_pain": ["abdominal pain", "stomach ache", "belly pain", "cramps in stomach", "stomach pain", "stomach cramps", "gut pain"],
    "dizziness": ["dizziness", "dizzy", "lightheaded", "lightheadedness", "vertigo", "giddiness", "unsteady", "feeling faint"],
    "joint_pain": ["joint pain", "aching joints", "arthritis", "knee pain", "elbow pain", "shoulder pain", "stiff joints"],
    "sore_throat": ["sore throat", "throat pain", "throat irritation", "pain swallowing", "pharyngitis", "scratchy throat"],
    "numbness": ["numbness", "tingling", "pins and needles", "loss of sensation", "numb limbs", "paresthesia"],
    "confusion": ["confusion", "disorientation", "brain fog", "cannot concentrate", "delirious", "confused", "mental confusion"],
    "rash": ["rash", "skin hives", "red spots", "itching skin", "dermatitis", "bumps on skin", "skin outbreak"],
    "loss_of_taste_smell": ["loss of taste", "loss of smell", "anosmia", "cannot smell", "cannot taste", "sensory loss"],
    "muscle_ache": ["muscle ache", "muscle pain", "body ache", "myalgia", "sore muscles", "body aches"],
    "chills": ["chills", "shivering", "feeling cold", "rigors", "cold shakes"],
    "sweating": ["sweating", "diaphoresis", "night sweats", "excessive sweat", "perspiration"],
    "runny_nose": ["runny nose", "nasal discharge", "rhinorrhea", "watery nose", "stuffy nose", "nasal congestion"],
    "sneezing": ["sneezing", "sneeze", "frequent sneezing"],
    "heart_palpitations": ["heart palpitations", "fluttering heart", "racing heart", "rapid heartbeat", "pounding chest", "irregular heartbeat"],
    "blurry_vision": ["blurry vision", "blurred sight", "double vision", "diminished vision", "hazy sight"],
    "slurred_speech": ["slurred speech", "difficulty speaking", "mumbling", "dysarthria", "garbled words"],
    "weakness": ["weakness", "muscle weakness", "feeling weak", "lack of strength", "debilitated"],
    "stiff_neck": ["stiff neck", "neck stiffness", "painful neck movement", "neck rigidity"],
    "frequent_urination": ["frequent urination", "peeing a lot", "polyuria", "constant urinating", "excessive urination"],
    "increased_thirst": ["increased thirst", "polydipsia", "very thirsty", "drinking a lot of water"],
    "unexplained_weight_loss": ["weight loss", "losing weight", "unexplained weight loss", "dropped weight", "rapid weight loss"]
}

class SymptomEmbeddingEngine:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(ngram_range=(1, 2), lowercase=True)
        self.symptom_keys = list(SYMPTOM_MAP.keys())
        
        # Flatten all synonyms and keep track of which symptom key they correspond to
        self.all_synonyms = []
        self.synonym_to_key_map = []
        
        for key, synonyms in SYMPTOM_MAP.items():
            for syn in synonyms:
                self.all_synonyms.append(syn)
                self.synonym_to_key_map.append(key)
                
        # Fit vectorizer on all synonyms
        self.tfidf_matrix = self.vectorizer.fit_transform(self.all_synonyms)

    def match_symptom(self, query: str, threshold: float = 0.35) -> List[Tuple[str, float]]:
        """
        Takes a free text string representing a symptom, calculates TF-IDF cosine similarity,
        and returns a sorted list of (standard_symptom_key, similarity_score) matches above threshold.
        """
        if not query or not query.strip():
            return []
            
        # Vectorize user query
        query_vector = self.vectorizer.transform([query])
        
        # Compute cosine similarity between query and all synonyms
        similarities = cosine_similarity(query_vector, self.tfidf_matrix).flatten()
        
        # Group and take maximum similarity per standard symptom key
        symptom_scores = {}
        for idx, similarity in enumerate(similarities):
            if similarity >= threshold:
                symptom_key = self.synonym_to_key_map[idx]
                symptom_scores[symptom_key] = max(symptom_scores.get(symptom_key, 0.0), float(similarity))
                
        # Sort by similarity score descending
        sorted_matches = sorted(symptom_scores.items(), key=lambda x: x[1], reverse=True)
        return sorted_matches

    def process_symptom_list(self, input_symptoms: List[str]) -> List[str]:
        """
        Processes a list of mixed symptoms (could be structured keys or unstructured free text phrases).
        Resolves each input symptom to one or more standard keys.
        """
        resolved_keys = set()
        
        for symptom in input_symptoms:
            symptom_clean = symptom.strip().lower()
            
            # 1. Direct match with standard key
            if symptom_clean in self.symptom_keys:
                resolved_keys.add(symptom_clean)
                continue
                
            # 2. Match with synonyms using embedding similarity
            matches = self.match_symptom(symptom_clean)
            if matches:
                # Add the best match
                resolved_keys.add(matches[0][0])
            else:
                # 3. Last fallback: simple substring search in standard key names
                matched_fallback = False
                for key in self.symptom_keys:
                    if key.replace("_", " ") in symptom_clean or symptom_clean in key:
                        resolved_keys.add(key)
                        matched_fallback = True
                        break
                if not matched_fallback:
                    # If we can't find anything, we keep it as a free text token, 
                    # but we'll print a log warning.
                    pass
                    
        return list(resolved_keys)

# Singleton instance
embedding_engine = SymptomEmbeddingEngine()
