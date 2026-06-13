import React, { useState } from 'react'
import { Plus, X, Activity, ShieldAlert, Heart, ClipboardList, RefreshCw, AlertTriangle } from 'lucide-react'
import axios from 'axios'

const API_BASE = 'http://localhost:8000'

// 30 structured symptoms list
const STRUCTURED_SYMPTOMS = [
  { id: "chest_pain", label: "Chest Pain" },
  { id: "shortness_of_breath", label: "Shortness of Breath" },
  { id: "fever", label: "Fever" },
  { id: "cough", label: "Cough" },
  { id: "headache", label: "Headache" },
  { id: "fatigue", label: "Fatigue" },
  { id: "nausea", label: "Nausea" },
  { id: "vomiting", label: "Vomiting" },
  { id: "diarrhea", label: "Diarrhea" },
  { id: "abdominal_pain", label: "Abdominal Pain" },
  { id: "dizziness", label: "Dizziness" },
  { id: "joint_pain", label: "Joint Pain" },
  { id: "sore_throat", label: "Sore Throat" },
  { id: "numbness", label: "Numbness / Tingling" },
  { id: "confusion", label: "Confusion / Brain Fog" },
  { id: "rash", label: "Skin Rash" },
  { id: "loss_of_taste_smell", label: "Loss of Taste/Smell" },
  { id: "muscle_ache", label: "Muscle Aches" },
  { id: "chills", label: "Chills" },
  { id: "sweating", label: "Sweating" },
  { id: "runny_nose", label: "Runny Nose" },
  { id: "sneezing", label: "Sneezing" },
  { id: "heart_palpitations", label: "Heart Palpitations" },
  { id: "blurry_vision", label: "Blurry Vision" },
  { id: "slurred_speech", label: "Slurred Speech" },
  { id: "weakness", label: "General Weakness" },
  { id: "stiff_neck", label: "Stiff Neck" },
  { id: "frequent_urination", label: "Frequent Urination" },
  { id: "increased_thirst", label: "Increased Thirst" },
  { id: "unexplained_weight_loss", label: "Weight Loss" }
]

function SymptomAnalyzer({ onPredictionComplete, userId, language }) {
  const [selectedSymptoms, setSelectedSymptoms] = useState([])
  const [freeTextSymptom, setFreeTextSymptom] = useState('')
  const [severity, setSeverity] = useState('moderate')

  // Profile settings
  const [age, setAge] = useState(35)
  const [gender, setGender] = useState('female')

  // Lifestyle settings
  const [smoking, setSmoking] = useState(false)
  const [sedentary, setSedentary] = useState(false)

  // Medical history settings
  const [historyDiabetes, setHistoryDiabetes] = useState(false)
  const [historyHypertension, setHistoryHypertension] = useState(false)
  const [historyAsthma, setHistoryAsthma] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleToggleSymptom = (id) => {
    if (selectedSymptoms.includes(id)) {
      setSelectedSymptoms(selectedSymptoms.filter(s => s !== id))
    } else {
      setSelectedSymptoms([...selectedSymptoms, id])
    }
  }

  const handleAddFreeText = (e) => {
    e.preventDefault()
    const cleaned = freeTextSymptom.trim()
    if (!cleaned) return

    // Check if it already exists
    if (!selectedSymptoms.includes(cleaned)) {
      setSelectedSymptoms([...selectedSymptoms, cleaned])
    }
    setFreeTextSymptom('')
  }

  const handleRemoveSymptom = (symptom) => {
    setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptom))
  }

  const handleReset = () => {
    setSelectedSymptoms([])
    setFreeTextSymptom('')
    setSeverity('moderate')
    setAge(35)
    setGender('female')
    setSmoking(false)
    setSedentary(false)
    setHistoryDiabetes(false)
    setHistoryHypertension(false)
    setHistoryAsthma(false)
    setError('')
  }

  const handleSubmit = async () => {
    if (selectedSymptoms.length === 0) {
      setError(language === 'ur' ? 'براہ کرم کم از کم ایک علامت منتخب کریں۔' : language === 'hi' ? 'कृपया कम से कम एक लक्षण चुनें।' : 'Please select or type at least one symptom.')
      return
    }

    setLoading(true)
    setError('')

    // Prepare history tags
    const medicalHistory = []
    if (historyDiabetes) medicalHistory.push('diabetes')
    if (historyHypertension) medicalHistory.push('hypertension')
    if (historyAsthma) medicalHistory.push('asthma')

    const payload = {
      symptoms: selectedSymptoms,
      severity,
      user_profile: {
        age: parseInt(age),
        gender,
        lifestyle: {
          smoking,
          sedentary
        },
        medical_history: medicalHistory
      },
      language,
      user_id: userId
    }

    try {
      const res = await axios.post(`${API_BASE}/predict`, payload)
      // Save prediction result to DB immediately for tracking
      await axios.post(`${API_BASE}/save`, res.data)
      onPredictionComplete(res.data)
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.detail || 'Failed to communicate with prediction pipeline. Verify local API server is online.')
    } finally {
      setLoading(false)
    }
  }

  // Multilingual labels for picker wizard
  const labels = {
    en: {
      title: "Symptom Diagnostic Wizard",
      desc: "Report your symptoms and context parameters. Our supervised classifiers and embedding matchers evaluate conditions.",
      step1: "1. Specify Symptoms Profile",
      step1Desc: "Select standard conditions below, or type custom symptoms (our similarity engine resolves matching categories).",
      addText: "Add free-text symptom",
      addedSym: "Selected Symptoms:",
      step2: "2. Patient Diagnostics & History",
      severityLabel: "Symptom Severity Intensity",
      ageLabel: "Patient Age",
      genderLabel: "Patient Gender",
      lifestyleLabel: "Lifestyle Risk Factors",
      smokingLabel: "Active Smoker",
      sedentaryLabel: "Sedentary Routine",
      historyLabel: "Existing Medical Preconditions",
      diabetesLabel: "Diabetes Diagnosis",
      hypertensionLabel: "Hypertension (BP)",
      asthmaLabel: "Chronic Asthma",
      reset: "Reset Inputs",
      analyze: "Evaluate Clinical Risk Model",
      analyzing: "Executing Neural Inference Model...",
      placeholder: "e.g., chest tightening, high feverish forehead..."
    },
    ur: {
      title: "علامات کی تشخیص کا وزرڈ",
      desc: "اپنی علامات اور متعلقہ معلومات درج کریں۔ ہمارے الگورتھم خطرے کا تجزیہ کرتے ہیں۔",
      step1: "1. علامات کی تفصیلات",
      step1Desc: "نیچے دی گئی علامات منتخب کریں، یا اپنی مرضی کے مطابق علامات لکھیں (اے آئی مماثلت تلاش کر لے گا)۔",
      addText: "آزادانہ ٹیکسٹ علامت شامل کریں",
      addedSym: "منتخب کردہ علامات:",
      step2: "2. مریض کی معلومات اور تاریخچہ",
      severityLabel: "علامت کی شدت",
      ageLabel: "مریض کی عمر",
      genderLabel: "مریض کی جنس",
      lifestyleLabel: "طرز زندگی کے خطرات",
      smokingLabel: "سگریٹ نوشی",
      sedentaryLabel: "سست طرز زندگی",
      historyLabel: "سابقہ بیماریاں",
      diabetesLabel: "ذیابیطس (شوگر)",
      hypertensionLabel: "بلڈ پریشر (Hypertension)",
      asthmaLabel: "دمہ (Asthma)",
      reset: "دوبارہ شروع کریں",
      analyze: "طبی خطرے کے ماڈل کا جائزہ لیں",
      analyzing: "ماڈل کا تجزیہ جاری ہے...",
      placeholder: "مثال کے طور پر: تیز بخار، سینے میں دباؤ..."
    },
    hi: {
      title: "लक्षण नैदानिक ​​विज़ार्ड",
      desc: "अपने लक्षणों और संदर्भ मापदंडों की रिपोर्ट करें। हमारे एल्गोरिदम स्वास्थ्य स्थितियों का आकलन करते हैं।",
      step1: "1. लक्षण प्रोफ़ाइल निर्दिष्ट करें",
      step1Desc: "नीचे दी गई मानक स्थितियां चुनें, या कस्टम लक्षण टाइप करें (हमारी प्रणाली मिलान कर लेगी)।",
      addText: "कस्टम लक्षण जोड़ें",
      addedSym: "चयनित लक्षण:",
      step2: "2. रोगी निदान और इतिहास",
      severityLabel: "लक्षण की तीव्रता",
      ageLabel: "रोगी की आयु",
      genderLabel: "रोगी का लिंग",
      lifestyleLabel: "जीवनशैली जोखिम कारक",
      smokingLabel: "सक्रिय धूम्रपान",
      sedentaryLabel: "गतिहीन दिनचर्या",
      historyLabel: "मौजूदा चिकित्सा स्थितियां",
      diabetesLabel: "मधुमेह (डायबिटीज)",
      hypertensionLabel: "उच्च रक्तचाप (बीपी)",
      asthmaLabel: "क्रोनिक अस्थमा",
      reset: "रीसेट करें",
      analyze: "नैदानिक ​​​​जोखिम मॉडल का मूल्यांकन करें",
      analyzing: "मॉडल विश्लेषण चल रहा है...",
      placeholder: "जैसे: सीने में जकड़न, तेज बुखार..."
    }
  }

  const t = labels[language] || labels['en']

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        {/* Neon biological pulsing DNA loader simulation */}
        <div className="relative w-24 h-24 flex items-center justify-center">
          <div className="absolute w-20 h-20 rounded-full border-4 border-dashed border-brand-accent animate-spin duration-3000"></div>
          <div className="absolute w-16 h-16 rounded-full border-4 border-dashed border-brand-primary animate-ping"></div>
          <Heart className="w-8 h-8 text-rose-500 animate-pulse" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-xl font-bold text-white tracking-wide">{t.analyzing}</h3>
          <p className="text-sm text-slate-400 max-w-sm">Generating probability charts, evaluating emergency rule matrices, and loading AI explanations.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn">
      {/* Title */}
      <div className="space-y-2">
        <h2 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
          <ClipboardList className="w-8 h-8 text-brand-primary" />
          {t.title}
        </h2>
        <p className="text-slate-400 text-sm md:text-base">{t.desc}</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-950/10 text-red-400 text-sm font-semibold flex items-center gap-2.5">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {/* Grid: Inputs Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Columns: Symptoms Selection */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">{t.step1}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{t.step1Desc}</p>
            </div>

            {/* Custom Input */}
            <form onSubmit={handleAddFreeText} className="flex gap-2">
              <input
                type="text"
                placeholder={t.placeholder}
                value={freeTextSymptom}
                onChange={(e) => setFreeTextSymptom(e.target.value)}
                className="flex-1 bg-slate-950 px-4 py-3 rounded-lg border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-primary"
              />
              <button
                type="submit"
                className="px-4 py-3 bg-slate-900 border border-slate-800 hover:border-brand-primary hover:text-brand-primary rounded-lg text-xs font-bold text-slate-300 transition-all flex items-center gap-1 shrink-0"
              >
                <Plus className="w-4 h-4" />
                {t.addText}
              </button>
            </form>

            {/* Tag Selection list */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quick Select Common Symptoms</h4>
              <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto pr-1">
                {STRUCTURED_SYMPTOMS.map((item) => {
                  const isSelected = selectedSymptoms.includes(item.id)
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleToggleSymptom(item.id)}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${isSelected
                        ? 'bg-brand-primary/20 text-brand-primary border-brand-primary'
                        : 'bg-slate-950 text-slate-400 border-slate-800/80 hover:border-slate-700 hover:text-slate-200'
                        }`}
                    >
                      {item.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Selected tags */}
            {selectedSymptoms.length > 0 && (
              <div className="space-y-2.5 pt-4 border-t border-slate-800">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.addedSym}</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedSymptoms.map((symptom, index) => {
                    const match = STRUCTURED_SYMPTOMS.find(x => x.id === symptom)
                    const displayLabel = match ? match.label : symptom
                    return (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-brand-primary text-white"
                      >
                        {displayLabel}
                        <button onClick={() => handleRemoveSymptom(symptom)} className="hover:text-red-300">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Context Details */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
            <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3">{t.step2}</h3>

            {/* Severity Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.severityLabel}</label>
              <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
                {['mild', 'moderate', 'severe'].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setSeverity(level)}
                    className={`py-2 rounded text-xs font-extrabold uppercase transition-all ${severity === level
                      ? level === 'severe'
                        ? 'bg-rose-500 text-white'
                        : level === 'moderate'
                          ? 'bg-brand-warning text-slate-950'
                          : 'bg-emerald-500 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                      }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Demographics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.ageLabel}</label>
                <input
                  type="number"
                  min="1"
                  max="110"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 text-sm text-white focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.genderLabel}</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 text-sm text-slate-300 focus:outline-none focus:border-brand-primary"
                >
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Lifestyle parameters */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.lifestyleLabel}</label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 bg-slate-950/50 p-2.5 rounded-lg border border-slate-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={smoking}
                    onChange={(e) => setSmoking(e.target.checked)}
                    className="w-4 h-4 accent-brand-primary"
                  />
                  <span className="text-xs font-semibold text-slate-300">{t.smokingLabel}</span>
                </label>

                <label className="flex items-center gap-3 bg-slate-950/50 p-2.5 rounded-lg border border-slate-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sedentary}
                    onChange={(e) => setSedentary(e.target.checked)}
                    className="w-4 h-4 accent-brand-primary"
                  />
                  <span className="text-xs font-semibold text-slate-300">{t.sedentaryLabel}</span>
                </label>
              </div>
            </div>

            {/* Medical History */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.historyLabel}</label>
              <div className="grid grid-cols-1 gap-2">
                <label className="flex items-center gap-3 bg-slate-950/50 p-2.5 rounded-lg border border-slate-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={historyDiabetes}
                    onChange={(e) => setHistoryDiabetes(e.target.checked)}
                    className="w-4 h-4 accent-brand-primary"
                  />
                  <span className="text-xs font-semibold text-slate-300">{t.diabetesLabel}</span>
                </label>

                <label className="flex items-center gap-3 bg-slate-950/50 p-2.5 rounded-lg border border-slate-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={historyHypertension}
                    onChange={(e) => setHistoryHypertension(e.target.checked)}
                    className="w-4 h-4 accent-brand-primary"
                  />
                  <span className="text-xs font-semibold text-slate-300">{t.hypertensionLabel}</span>
                </label>

                <label className="flex items-center gap-3 bg-slate-950/50 p-2.5 rounded-lg border border-slate-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={historyAsthma}
                    onChange={(e) => setHistoryAsthma(e.target.checked)}
                    className="w-4 h-4 accent-brand-primary"
                  />
                  <span className="text-xs font-semibold text-slate-300">{t.asthmaLabel}</span>
                </label>
              </div>
            </div>

            {/* Form actions */}
            <div className="flex gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 py-3 bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-slate-200 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                {t.reset}
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                className="flex-[2] py-3 bg-brand-primary hover:bg-brand-primary/80 text-white text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-md shadow-brand-primary/25"
              >
                <Activity className="w-4 h-4" />
                {t.analyze}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default SymptomAnalyzer
