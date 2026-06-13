import httpx
import json
import logging
from typing import List, Dict, Any, Optional
from app.config import settings

logger = logging.getLogger("health_analyzer.openrouter")

class OpenRouterClient:
    def __init__(self):
        self.api_key = settings.openrouter_api_key
        self.url = settings.openrouter_url
        self.default_model = settings.default_llm_model

    def _get_headers(self) -> Dict[str, str]:
        headers = {}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        # Required OpenRouter headers
        headers["HTTP-Referer"] = "https://github.com/google-deepmind/antigravity"
        headers["X-Title"] = "AI Health Symptom Analyzer"
        headers["Content-Type"] = "application/json"
        return headers

    async def _post_request(self, payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if not self.api_key:
            logger.warning("No OpenRouter API key found. Using mock system fallback.")
            return None
            
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(
                    f"{self.url}/chat/completions",
                    headers=self._get_headers(),
                    json=payload
                )
                if response.status_code == 200:
                    return response.json()
                else:
                    logger.error(f"OpenRouter API error: {response.status_code} - {response.text}")
                    return None
        except Exception as e:
            logger.error(f"OpenRouter request failed: {e}")
            return None

    async def generate_explanation(
        self, 
        predicted_conditions: List[Dict[str, Any]], 
        symptoms: List[str], 
        severity: str,
        user_profile: Dict[str, Any],
        model: Optional[str] = None
    ) -> str:
        """
        Generates a human-friendly narrative explaining the ML outputs.
        """
        model_name = model or self.default_model
        
        # Prepare condition text
        cond_strings = [f"{c['name']} (with {c['probability']} probability)" for c in predicted_conditions]
        cond_text = ", ".join(cond_strings)
        
        system_prompt = (
            "You are an empathetic, professional AI health assistant. Your role is to explain the results of a "
            "symptom analyzer machine learning model to a user in simple, comforting terms.\n"
            "SAFETY CRITICAL RULES:\n"
            "1. NEVER prescribe medication.\n"
            "2. NEVER state with absolute certainty that the user has a disease.\n"
            "3. State clearly: 'This system provides informational insights only and is not a substitute for professional medical advice.'\n"
            "4. Advise seeing a healthcare professional if they are concerned."
        )
        
        user_prompt = (
            f"The user reported these symptoms: {', '.join(symptoms)}.\n"
            f"Symptom severity: {severity}.\n"
            f"Patient Context: Age {user_profile.get('age', 'N/A')}, Gender {user_profile.get('gender', 'N/A')}, "
            f"Medical History: {', '.join(user_profile.get('medical_history', [])) or 'None'}.\n\n"
            f"The ML classifier predicted these top conditions: {cond_text}.\n\n"
            "Provide a human-readable explanation of these results, what could be causing them, and general non-medical support tips (rest, hydration, etc.)."
        )
        
        payload = {
            "model": model_name,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.3
        }
        
        response = await self._post_request(payload)
        if response:
            try:
                return response["choices"][0]["message"]["content"]
            except (KeyError, IndexError) as e:
                logger.error(f"Error parsing OpenRouter response: {e}")
                
        return self._get_mock_explanation(predicted_conditions, symptoms, severity, user_profile)

    async def generate_chat_reply(
        self, 
        chat_history: List[Dict[str, Any]], 
        user_message: str,
        latest_prediction: Optional[Dict[str, Any]] = None,
        model: Optional[str] = None
    ) -> str:
        """
        Generates a chat response in a conversational health context.
        """
        model_name = model or self.default_model
        
        system_prompt = (
            "You are an empathetic AI Health Assistant. You are conversing with a user who is seeking health insights.\n"
            "SAFETY CRITICAL RULES:\n"
            "1. Always include the disclaimer that you are not a doctor and cannot diagnose or prescribe.\n"
            "2. If the user indicates emergency signs (chest pain, breathing difficulty, severe numbness, slurred speech), "
            "urge them to call emergency services immediately.\n"
            "3. Rely on the user's latest symptom analysis context if provided."
        )
        
        # Add prediction context if available
        if latest_prediction:
            conds = [f"{c['name']} ({c['probability']})" for c in latest_prediction.get("predicted_conditions", [])]
            system_prompt += (
                f"\n[Context] The user recently analyzed their symptoms: {', '.join(latest_prediction.get('symptoms', []))}. "
                f"The ML model predicted: {', '.join(conds)} with a risk level of '{latest_prediction.get('risk_level')}'."
            )
            
        messages = [{"role": "system", "content": system_prompt}]
        
        # Add conversation history
        for msg in chat_history[-6:]:  # Limit history to keep context clean
            messages.append({"role": msg["role"], "content": msg["content"]})
            
        messages.append({"role": "user", "content": user_message})
        
        payload = {
            "model": model_name,
            "messages": messages,
            "temperature": 0.5
        }
        
        response = await self._post_request(payload)
        if response:
            try:
                return response["choices"][0]["message"]["content"]
            except (KeyError, IndexError) as e:
                logger.error(f"Error parsing OpenRouter response: {e}")
                
        return self._get_mock_chat_reply(user_message, latest_prediction)

    async def generate_json_translation(self, prompt: str) -> Optional[Dict[str, Any]]:
        """
        Sends a translation request to OpenRouter expecting a JSON response.
        """
        payload = {
            "model": self.default_model,
            "messages": [
                {"role": "system", "content": "You are a translation service. Output ONLY valid, clean raw JSON. No markdown, no triple backticks."},
                {"role": "user", "content": prompt}
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.1
        }
        
        response = await self._post_request(payload)
        if response:
            try:
                content = response["choices"][0]["message"]["content"]
                # Clean up any potential markdown wrap just in case
                if content.startswith("```json"):
                    content = content.replace("```json", "").replace("```", "").strip()
                elif content.startswith("```"):
                    content = content.replace("```", "").strip()
                return json.loads(content)
            except Exception as e:
                logger.error(f"Error parsing JSON translation: {e}")
        return None

    # MOCK FALLBACKS (Ensure zero runtime failures)
    def _get_mock_explanation(
        self, 
        predicted_conditions: List[Dict[str, Any]], 
        symptoms: List[str], 
        severity: str,
        user_profile: Dict[str, Any]
    ) -> str:
        primary_cond = predicted_conditions[0]["name"] if predicted_conditions else "General Fatigue"
        primary_prob = predicted_conditions[0]["probability"] if predicted_conditions else "N/A"
        
        explanation = (
            f"### AI Health Narrative Summary (Simulation Mode)\n\n"
            f"You are experiencing symptoms: **{', '.join(symptoms)}** with an overall severity level of **{severity}**.\n\n"
            f"Our machine learning model has identified **{primary_cond}** (estimated likelihood: **{primary_prob}**) "
            f"as the most probable matched pattern, followed by other possibilities listed in the results chart.\n\n"
            f"**Potential Causes & Explanation:**\n"
            f"- These symptoms are commonly seen in individuals with mild viral infections or physical stress.\n"
            f"- Since your severity is marked as **{severity}**, you should monitor your symptoms carefully.\n\n"
            f"**Recommended Self-Care Support:**\n"
            f"1. **Rest:** Get 8+ hours of sleep to help your body recover.\n"
            f"2. **Hydration:** Drink plenty of water, herbal teas, or electrolyte fluids.\n"
            f"3. **Temperature Check:** Monitor your temperature daily if you have a fever.\n\n"
            f"> [!NOTE]\n"
            f"> **Informational Only:** This system provides informational insights only and is not a substitute for professional medical advice. "
            f"Please consult a physician for proper medical evaluation."
        )
        return explanation

    def _get_mock_chat_reply(self, message: str, latest_prediction: Optional[Dict[str, Any]] = None) -> str:
        msg_lower = message.lower()
        
        # Check if the query is general/informational rather than an active report
        is_informational = any(term in msg_lower for term in ["what", "how", "tell me", "symptom of", "symptoms of", "info", "define", "explain", "why", "detail"])
        
        # Check for emergency signs in chat, but do not trigger false alarm if it is purely informational Q&A
        if not is_informational and any(term in msg_lower for term in ["chest pain", "heart attack", "stroke", "cannot breathe", "shortness of breath", "slurred"]):
            return (
                "⚠️ **IMPORTANT NOTICE: POTENTIAL MEDICAL EMERGENCY DETECTED** ⚠️\n\n"
                "You have mentioned symptoms that could indicate a serious or life-threatening medical condition (such as cardiac distress or stroke).\n\n"
                "**Please immediately call emergency services (911 or your local emergency number) or go to the nearest emergency room.**\n\n"
                "*This assistant cannot diagnose or provide treatment in emergencies.*"
            )
            
        reply = ""
        
        # Specific mock answers for common informational queries
        if "heart attack" in msg_lower and is_informational:
            return (
                "### Symptoms of a Heart Attack\n\n"
                "A heart attack (myocardial infarction) occurs when the blood supply to part of the heart muscle is severely reduced or blocked. Typical warning signs include:\n\n"
                "1. **Chest Discomfort:** Most heart attacks involve discomfort in the center of the chest that lasts more than a few minutes, or that goes away and comes back. It can feel like uncomfortable pressure, squeezing, fullness, or pain.\n"
                "2. **Discomfort in Other Areas:** Symptoms can include pain or discomfort in one or both arms, the back, neck, jaw, or stomach.\n"
                "3. **Shortness of Breath:** This may occur with or without chest discomfort.\n"
                "4. **Other Signs:** Cold sweat, nausea, vomiting, or lightheadedness.\n\n"
                "⚠️ **IMPORTANT:** If you or someone near you is experiencing these symptoms actively, call emergency services immediately. Do not attempt to drive."
            )
        elif "stroke" in msg_lower and is_informational:
            return (
                "### Warning Signs of a Stroke (F.A.S.T.)\n\n"
                "A stroke is a medical emergency where blood flow to the brain is disrupted. Use the **FAST** test to check for signs:\n\n"
                "- **F - Face Drooping:** Does one side of the face droop or is it numb? Ask the person to smile. Is it uneven?\n"
                "- **A - Arm Weakness:** Is one arm weak or numb? Ask the person to raise both arms. Does one arm drift downward?\n"
                "- **S - Speech Difficulty:** Is speech slurred? Are they unable to speak or hard to understand? Ask the person to repeat a simple sentence.\n"
                "- **T - Time to Call:** If anyone shows any of these signs, even if they disappear, call emergency services (911) and get to a hospital immediately.\n"
            )
        elif any(term in msg_lower for term in ["asthma", "ashtma", "wheezing", "bronchitis"]):
            return (
                "### Asthma Symptoms & Management\n\n"
                "Asthma is a chronic condition that inflames and narrows the airways, making breathing difficult. Common symptoms include:\n\n"
                "1. **Shortness of Breath:** Feeling unable to catch your breath.\n"
                "2. **Wheezing:** A whistling or squeaking sound when breathing out.\n"
                "3. **Chest Tightness:** Sensation of pressure or squeezing in the chest.\n"
                "4. **Coughing:** Often worse at night, early in the morning, or during exercise.\n\n"
                "**Management:**\n"
                "- Use a prescribed rescue inhaler (such as Albuterol) during flareups.\n"
                "- Avoid known triggers (tobacco smoke, cold air, dust mites, pollen).\n"
                "- Follow a written asthma action plan provided by your doctor."
            )
        elif any(term in msg_lower for term in ["diabetes", "sugar", "insulin", "diabetic"]):
            return (
                "### Diabetes Mellitus Overview\n\n"
                "Diabetes is a metabolic disease characterized by chronic high blood sugar levels. Typical symptoms include:\n\n"
                "1. **Frequent Urination (Polyuria):** Often waking at night to urinate.\n"
                "2. **Increased Thirst (Polydipsia):** Feeling constantly thirsty despite drinking fluids.\n"
                "3. **Unexplained Weight Loss:** Losing weight without trying (especially in Type 1).\n"
                "4. **Fatigue & Blurred Vision:** Feeling exhausted due to improper glucose metabolism.\n\n"
                "**Management:**\n"
                "- Monitor blood sugar levels regularly.\n"
                "- Eat a balanced diet low in simple carbohydrates and rich in fiber.\n"
                "- Take prescribed oral hypoglycemic medications or insulin therapy."
            )
        elif any(term in msg_lower for term in ["migraine", "headache", "migrain"]):
            return (
                "### Migraine Headache Insights\n\n"
                "A migraine is a neurological condition causing severe, throbbing headache pain, usually on one side of the head.\n\n"
                "**Symptoms include:**\n"
                "- Intense throbbing or pulsing pain.\n"
                "- Sensitivity to light (photophobia) and sound (phonophobia).\n"
                "- Nausea, vomiting, or lightheadedness.\n"
                "- Aura: Visual disturbances (flashing lights, blind spots) before the pain starts.\n\n"
                "**Support Measures:**\n"
                "- Rest in a quiet, dark room.\n"
                "- Apply a cold compress to the forehead or neck.\n"
                "- Stay hydrated and avoid trigger foods (caffeine, aged cheeses, chocolate)."
            )
        elif any(term in msg_lower for term in ["covid", "corona", "covid-19"]):
            return (
                "### COVID-19 Symptoms & Prevention\n\n"
                "COVID-19 is a highly infectious respiratory illness caused by the SARS-CoV-2 virus.\n\n"
                "**Common Symptoms:**\n"
                "- Fever or chills.\n"
                "- Dry cough and shortness of breath.\n"
                "- Fatigue, muscle or body aches.\n"
                "- Sudden loss of taste or smell (anosmia).\n"
                "- Sore throat, congestion, or runny nose.\n\n"
                "**Care Guidance:**\n"
                "- Isolate from others to prevent spread.\n"
                "- Monitor your blood oxygen level (SPO2) using a pulse oximeter.\n"
                "- Stay hydrated and rest. Seek emergency care if breathing becomes labored."
            )
        elif any(term in msg_lower for term in ["flu", "influenza"]):
            return (
                "### Influenza (Flu) Overview\n\n"
                "The flu is a contagious respiratory infection caused by influenza viruses. It is more severe than a common cold.\n\n"
                "**Common Symptoms:**\n"
                "- Sudden high fever (100°F/37.8°C or higher).\n"
                "- Severe muscle or body aches.\n"
                "- Chills, sweats, and headache.\n"
                "- Dry, persistent cough.\n"
                "- Extreme fatigue and weakness.\n\n"
                "**Supportive Care:**\n"
                "- Stay home, rest, and sleep.\n"
                "- Drink plenty of warm liquids (water, tea, broth).\n"
                "- Over-the-counter fever reducers (acetaminophen/ibuprofen) can help manage fever."
            )
        elif any(term in msg_lower for term in ["food poisoning", "diarrhea", "vomiting", "gastroenteritis", "stomach infection"]):
            return (
                "### Gastroenteritis & Food Poisoning\n\n"
                "Gastroenteritis is inflammation of the stomach and intestines, commonly caused by viral/bacterial infections from contaminated food or water.\n\n"
                "**Typical Symptoms:**\n"
                "- Watery diarrhea and stomach cramps.\n"
                "- Nausea and vomiting.\n"
                "- Mild fever or chills.\n"
                "- Dehydration (dry mouth, dark urine, lightheadedness).\n\n"
                "**Rehydration Care:**\n"
                "- Drink oral rehydration salts (ORS), electrolyte fluids, or coconut water in small, frequent sips.\n"
                "- Follow the BRAT diet (Bananas, Rice, Applesauce, Toast) when ready to eat.\n"
                "- Avoid dairy, greasy foods, caffeine, and alcohol."
            )
        elif any(term in msg_lower for term in ["appendicitis", "appendix"]):
            return (
                "### Appendicitis Warning Signs\n\n"
                "Appendicitis is an inflammation of the appendix and is considered a surgical medical emergency.\n\n"
                "**Symptoms include:**\n"
                "- Sudden pain that begins near the navel and shifts to the lower right abdomen.\n"
                "- Pain that worsens when coughing, walking, or making jarring movements.\n"
                "- Nausea, vomiting, loss of appetite.\n"
                "- Low-grade fever that may worsen.\n\n"
                "⚠️ **WARNING:** If you suspect appendicitis, do not take laxatives or pain medication. Go to the nearest emergency room immediately for evaluation."
            )

        # 1. Check for simple greetings
        if any(term in msg_lower for term in ["hi", "hello", "hey", "greetings", "yo", "namaste", "halo"]):
            return (
                "Hello! I am your AI Health Assistant. How can I help you today?\n\n"
                "I can provide general medical information. Feel free to ask me about:\n"
                "- **Symptoms, Causes, or Management** of conditions like *Asthma*, *Diabetes*, *Migraines*, *Flu*, *COVID-19*, *Food Poisoning*, *Heart Attacks*, or *Stroke*.\n"
                "- **Wellness & Prevention** topics like *Hydration*, *Sleep*, *Nutrition*, *Exercise*, or *Infection Prevention*.\n\n"
                "*Please note: I am currently running in offline simulation mode, but I can still answer your medical-related questions.*"
            )

        # 2. Check for general wellness & medical topics
        if any(term in msg_lower for term in ["carb", "carbohydrate"]):
            return (
                "### Understanding Carbohydrates\n\n"
                "Carbohydrates are essential macronutrients that your body breaks down into glucose to provide energy.\n\n"
                "- **Complex Carbs (Healthy):** Found in whole grains (oats, brown rice), beans, lentils, and vegetables. They release energy slowly and keep you full longer.\n"
                "- **Simple Carbs (Limit):** Found in sugary drinks, candies, white bread, and processed foods. They cause rapid spikes in blood sugar.\n\n"
                "A healthy diet should focus on complex carbs and restrict simple sugars."
            )
        elif any(term in msg_lower for term in ["sweat", "perspiration"]):
            return (
                "### Why Do We Sweat?\n\n"
                "Sweating (perspiration) is your body's primary thermoregulation method. When internal temperature rises due to exercise, fever, or warm environments, the brain's hypothalamus triggers sweat glands to release water and mineral salts. The evaporation of this moisture from your skin cools you down."
            )
        elif any(term in msg_lower for term in ["diet", "nutrition", "eat"]):
            return (
                "### Principles of Healthy Nutrition\n\n"
                "A balanced diet supplies the nutrients your body needs to work effectively. Key components include:\n\n"
                "1. **Lean Proteins:** Poultry, fish, tofu, beans, and eggs for tissue repair.\n"
                "2. **Healthy Fats:** Olive oil, avocados, and nuts to support cell structure and brain function.\n"
                "3. **Vitamins & Minerals:** A colorful variety of vegetables and fresh fruits to boost immunity.\n"
                "4. **Hydration:** Plenty of water throughout the day."
            )
        elif any(term in msg_lower for term in ["sleep", "rest", "insomnia"]):
            return (
                "### The Importance of Quality Sleep\n\n"
                "Quality sleep (7 to 9 hours for adults) is a cornerstone of physical and mental health. During sleep, your body repairs muscles, consolidates memories, regulates hormones, and strengthens the immune system. Lack of sleep is linked to chronic diseases, high stress, and decreased cognitive performance."
            )
        elif any(term in msg_lower for term in ["hydration", "water", "drink"]):
            return (
                "### Health Benefits of Hydration\n\n"
                "Water accounts for about 60% of human body weight and is critical for joint lubrication, temperature regulation, waste removal, and digestion. Adults should aim for 2.5 to 3 liters of fluids daily. Dehydration symptoms include dry mouth, fatigue, dark urine, and lightheadedness."
            )
        elif any(term in msg_lower for term in ["prevent", "prevention", "hygiene"]):
            return (
                "### Preventing Infections & Germ Spread\n\n"
                "To reduce the risk of catching and spreading common viral or bacterial illnesses:\n\n"
                "- **Handwashing:** Wash hands with soap and water for 20 seconds, especially before eating and after using public spaces.\n"
                "- **Avoid Touching Face:** Keep hands away from eyes, nose, and mouth.\n"
                "- **Immunization:** Stay up-to-date with annual flu shots and recommended vaccinations.\n"
                "- **Clean Surfaces:** Sanitize high-touch household areas regularly."
            )

        # 3. Check for specific symptom terms in the query
        if "fever" in msg_lower or "temperature" in msg_lower:
            return (
                "### Managing a Fever\n\n"
                "A fever is a temporary elevation of body temperature, indicating the immune system is actively fighting an infection. \n\n"
                "**Guidance:**\n"
                "- Stay well hydrated. Drink water, warm teas, or broths.\n"
                "- Rest as much as possible.\n"
                "- Monitor your temperature. Seek medical attention if it exceeds 103°F (39.4°C) or lasts longer than 3 days."
            )
        elif "cough" in msg_lower or "throat" in msg_lower:
            return (
                "### Relief for Cough & Sore Throat\n\n"
                "Coughing is a reflex to clear mucus or irritants from your airways.\n\n"
                "**Guidance:**\n"
                "- Drink warm liquids (like tea with honey) to soothe the throat.\n"
                "- Use a saline throat gargle (warm water + salt) to ease swelling.\n"
                "- Avoid cold drafts or smoking environments. Consult a doctor if the cough persists for more than 3 weeks."
            )
        elif "stomach" in msg_lower or "pain" in msg_lower or "cramp" in msg_lower:
            return (
                "### Understanding Abdominal Pain\n\n"
                "Stomach aches can arise from indigestion, gas, mild infections, or food poisoning. Eating bland foods (the BRAT diet) and staying hydrated with water or electrolyte solutions helps.\n\n"
                "⚠️ **WARNING:** If the pain is severe, constant, localized in the lower right side (possible appendicitis), or accompanied by persistent vomiting and high fever, visit an urgent care or ER immediately."
            )

        # 4. Final generic fallback directory
        reply = (
            "I am your AI Health Assistant (currently running in offline simulation mode).\n\n"
            "I can guide you on health-related Q&A. Please specify your question clearly about:\n"
            "- **Condition symptoms, causes, or treatments** (e.g. Asthma, Migraines, Flu, Appendicitis, Diabetes, Heart Attacks)\n"
            "- **Wellness advice** (e.g. Hydration, Nutrition, Sleep, Exercise)\n\n"
            "Please rephrase your question with relevant medical terms so I can assist you!"
        )
        return reply

openrouter_client = OpenRouterClient()
