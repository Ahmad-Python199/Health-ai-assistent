import logging
from typing import Dict, Any, List

logger = logging.getLogger("health_analyzer.translation")

# Static dictionary for fast, high-accuracy medical translation of standard symptoms, risk levels, and UI texts.
TRANSLATIONS = {
    "ur": {
        # General
        "Low": "کم",
        "Medium": "متوسط",
        "High": "زیادہ",
        "Critical": "انتہائی تشویشناک",
        "This system provides informational insights only and is not a substitute for professional medical advice.": "یہ نظام صرف معلوماتی بصیرت فراہم کرتا ہے اور پیشہ ورانہ طبی مشورے کا متبادل نہیں ہے۔",
        
        # Symptoms
        "chest_pain": "سینے میں درد",
        "shortness_of_breath": "سانس لینے میں دشواری",
        "fever": "بخار",
        "cough": "کھانسی",
        "headache": "سر درد",
        "fatigue": "تھکاوٹ",
        "nausea": "متلی",
        "vomiting": "الٹی",
        "diarrhea": "اسہال (دست)",
        "abdominal_pain": "پیٹ میں درد",
        "dizziness": "چکر آنا",
        "joint_pain": "جوڑوں کا درد",
        "sore_throat": "گلے کی سوزش",
        "numbness": "بے حسی (سن ہو جانا)",
        "confusion": "الجھن / حواس باختگی",
        "rash": "جلد پر خارش / دھبے",
        "loss_of_taste_smell": "ذائقہ یا سونگھنے کی حس کا خاتمہ",
        
        # Conditions
        "Common Cold": "نزلہ زکام",
        "Influenza (Flu)": "انفلوئنزا (فلو)",
        "COVID-19": "کووڈ-19",
        "Heart Attack": "دل کا دورہ (ہارٹ اٹیک)",
        "Stroke": "فالج (سٹروک)",
        "Gastroenteritis (Food Poisoning)": "معدے کی سوزش / فوڈ پوائزننگ",
        "Appendicitis": "اپینڈیسائٹس",
        "Migraine": "آدھے سر کا درد (مائیگرین)",
        "Diabetes Mellitus": "ذیابیطس (شوگر)",
        "Asthma Flare-up": "دمہ کا دورہ",
    },
    "hi": {
        # General
        "Low": "कम",
        "Medium": "मध्यम",
        "High": "उच्च",
        "Critical": "गंभीर / संकटपूर्ण",
        "This system provides informational insights only and is not a substitute for professional medical advice.": "यह प्रणाली केवल सूचनात्मक जानकारी प्रदान करती है और पेशेवर चिकित्सा सलाह का विकल्प नहीं है।",
        
        # Symptoms
        "chest_pain": "छाती में दर्द",
        "shortness_of_breath": "सांस की कमी / हांफना",
        "fever": "बुखार",
        "cough": "खांसी",
        "headache": "सिरदर्द",
        "fatigue": "थकान",
        "nausea": "जी मिचलाना",
        "vomiting": "उल्टी",
        "diarrhea": "दस्त",
        "abdominal_pain": "पेट में दर्द",
        "dizziness": "चक्कर आना",
        "joint_pain": "जोड़ों में दर्द",
        "sore_throat": "गले में खराश",
        "numbness": "सुन्नता",
        "confusion": "भ्रम / घबराहट",
        "rash": "चकत्ते / खुजली",
        "loss_of_taste_smell": "स्वाद या गंध की कमी",
        
        # Conditions
        "Common Cold": "सामान्य सर्दी-जुकाम",
        "Influenza (Flu)": "इन्फ्लूएंजा (फ्लू)",
        "COVID-19": "कोविड-19",
        "Heart Attack": "दिल का दौरा (हार्ट अटैक)",
        "Stroke": "मस्तिष्क आघात (स्ट्रोक)",
        "Gastroenteritis (Food Poisoning)": "गैस्ट्रोएंटेराइटिस (फूड पॉइजनिंग)",
        "Appendicitis": "अपेंडिसाइटिस",
        "Migraine": "माइग्रेन (आधासीसी का दर्द)",
        "Diabetes Mellitus": "मधुमेह (डायबिटीज)",
        "Asthma Flare-up": "दमा का प्रकोप",
    }
}

class TranslationService:
    @staticmethod
    def translate_text(text: str, target_lang: str) -> str:
        """
        Translate a string to the target language (ur or hi) using static dict.
        Returns original text if language is en or if translation is missing.
        """
        if not target_lang or target_lang == "en":
            return text
            
        lang_dict = TRANSLATIONS.get(target_lang.lower())
        if not lang_dict:
            return text
            
        # Try direct mapping
        if text in lang_dict:
            return lang_dict[text]
            
        # Try substring translation for common terms
        translated_text = text
        for eng_key, val in lang_dict.items():
            if eng_key in translated_text:
                translated_text = translated_text.replace(eng_key, val)
                
        return translated_text

    @staticmethod
    def translate_list(items: List[str], target_lang: str) -> List[str]:
        if not target_lang or target_lang == "en":
            return items
        return [TranslationService.translate_text(item, target_lang) for item in items]

    @staticmethod
    async def translate_response_via_llm(response_dict: Dict[str, Any], target_lang: str, openrouter_client) -> Dict[str, Any]:
        """
        Uses OpenRouter dynamic generation (if available) to translate long form text like explanations.
        Otherwise falls back to dictionary translation.
        """
        if not target_lang or target_lang == "en":
            return response_dict
            
        # Translate simple static keys first
        response_dict["risk_level"] = TranslationService.translate_text(response_dict["risk_level"], target_lang)
        response_dict["disclaimer"] = TranslationService.translate_text(response_dict["disclaimer"], target_lang)
        response_dict["symptoms"] = TranslationService.translate_list(response_dict["symptoms"], target_lang)
        
        for cond in response_dict.get("predicted_conditions", []):
            cond["name"] = TranslationService.translate_text(cond["name"], target_lang)
            
        # Translate complex fields via LLM if available, otherwise just keep them in English or apply dictionary
        lang_names = {"ur": "Urdu (اردو)", "hi": "Hindi (हिंदी)"}
        target_lang_name = lang_names.get(target_lang.lower(), target_lang)
        
        try:
            fields_to_translate = {
                "ml_explanation": response_dict.get("ml_explanation", ""),
                "ai_explanation": response_dict.get("ai_explanation", ""),
                "emergency_alert": response_dict.get("emergency_alert", ""),
                "recommendations": " | ".join(response_dict.get("recommendations", [])),
                "diet_suggestions": " | ".join(response_dict.get("diet_suggestions", [])),
                "lifestyle_suggestions": " | ".join(response_dict.get("lifestyle_suggestions", []))
            }
            
            # Formulate translation prompt
            prompt = (
                f"You are a professional medical translator. Translate the following fields into native {target_lang_name}. "
                "Keep the clinical context, tone, and formatting exact. Provide the response as a JSON object matching the input structure.\n\n"
                f"JSON to translate:\n{fields_to_translate}"
            )
            
            translated_data = await openrouter_client.generate_json_translation(prompt)
            if translated_data:
                response_dict["ml_explanation"] = translated_data.get("ml_explanation", response_dict["ml_explanation"])
                response_dict["ai_explanation"] = translated_data.get("ai_explanation", response_dict["ai_explanation"])
                response_dict["emergency_alert"] = translated_data.get("emergency_alert", response_dict["emergency_alert"])
                
                # Split lists back
                if "recommendations" in translated_data:
                    response_dict["recommendations"] = [r.strip() for r in translated_data["recommendations"].split("|") if r.strip()]
                if "diet_suggestions" in translated_data:
                    response_dict["diet_suggestions"] = [d.strip() for d in translated_data["diet_suggestions"].split("|") if d.strip()]
                if "lifestyle_suggestions" in translated_data:
                    response_dict["lifestyle_suggestions"] = [l.strip() for l in translated_data["lifestyle_suggestions"].split("|") if l.strip()]
        except Exception as e:
            logger.warning(f"Failed to dynamically translate response using LLM: {e}. Falling back to basic translations.")
            # Basic translations fallback for lists
            response_dict["recommendations"] = TranslationService.translate_list(response_dict["recommendations"], target_lang)
            response_dict["diet_suggestions"] = TranslationService.translate_list(response_dict["diet_suggestions"], target_lang)
            response_dict["lifestyle_suggestions"] = TranslationService.translate_list(response_dict["lifestyle_suggestions"], target_lang)
            
        return response_dict
