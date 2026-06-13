import React, { useState, useEffect, useRef } from 'react'
import { Send, Bot, User, RefreshCw, MessageSquare, Info, ShieldAlert, Sparkles } from 'lucide-react'
import axios from 'axios'

const API_BASE = 'http://localhost:8000'

const MODEL_OPTIONS = [
  { id: "openrouter/free", label: "Auto Free Router (Recommended)" },
  { id: "meta-llama/llama-3.3-70b-instruct:free", label: "Llama 3.3 70B (Free)" },
  { id: "meta-llama/llama-3.2-3b-instruct:free", label: "Llama 3.2 3B (Free)" },
  { id: "google/gemma-4-31b-it:free", label: "Gemma 4 31B (Free)" },
  { id: "nousresearch/hermes-3-llama-3.1-405b:free", label: "Hermes 3 405B (Free)" }
]

function HealthAssistant({ userId, language, latestPrediction }) {
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [selectedModel, setSelectedModel] = useState(MODEL_OPTIONS[0].id)
  const [loading, setLoading] = useState(false)

  const chatEndRef = useRef(null)

  // Scroll to bottom of chat automatically on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Load chat log history from backend on component mount
  useEffect(() => {
    const fetchChatLogs = async () => {
      try {
        const res = await axios.get(`${API_BASE}/history?user_id=${userId}`)
        // Fetch any existing chat logs or initialize welcome message
        const welcomeMsg = {
          id: 'welcome',
          role: 'assistant',
          content: getWelcomeMessage(language, latestPrediction),
          modelUsed: 'System Initialization'
        }

        // We will query logs if they exist, or just set welcome message
        setMessages([welcomeMsg])
      } catch (err) {
        console.error('Failed to load chat context:', err)
      }
    }
    fetchChatLogs()
  }, [userId, latestPrediction])

  const getWelcomeMessage = (lang, prediction) => {
    const pDetails = prediction
      ? ` I noticed your last check indicated symptoms: **${prediction.symptoms.map(s => s.replace("_", " ")).join(", ")}** with primary condition **${prediction.predicted_conditions[0]?.name}**.`
      : ''

    switch (lang) {
      case 'ur':
        return `السلام علیکم! میں آپ کا اے آئی ہیلتھ اسسٹنٹ ہوں۔ میں آپ کی صحت کے حوالے سے معلومات فراہم کرنے کے لیے حاضر ہوں۔${pDetails}\n\nمیں آپ کی کس طرح مدد کر سکتا ہوں؟`
      case 'hi':
        return `नमस्ते! मैं आपका एआई स्वास्थ्य सहायक हूं। मैं आपकी स्वास्थ्य संबंधी जानकारी में मदद के लिए उपलब्ध हूं।${pDetails}\n\nआज मैं आपकी क्या सहायता कर सकता हूं?`
      default:
        return `Hello! I am your AI Health Assistant. I have loaded your historical clinical context.${pDetails}\n\nFeel free to ask any follow-up questions about your symptoms, predictions, or general wellness advice.`
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    const cleaned = inputText.trim()
    if (!cleaned || loading) return

    // Add user message to state
    const userMsg = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: cleaned
    }
    setMessages(prev => [...prev, userMsg])
    setInputText('')
    setLoading(true)

    try {
      const res = await axios.post(`${API_BASE}/chat`, {
        message: cleaned,
        user_id: userId,
        language: language,
        model: selectedModel
      })

      const botMsg = {
        id: `bot_${Date.now()}`,
        role: 'assistant',
        content: res.data.reply,
        modelUsed: res.data.model_used
      }
      setMessages(prev => [...prev, botMsg])
    } catch (err) {
      console.error(err)
      const errorMsg = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: '⚠️ Failed to connect to AI server. Please check that the backend API is online and the OpenRouter gateway is reachable.',
        modelUsed: 'Network Error Handler'
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setLoading(false)
    }
  }

  const clearChat = () => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: getWelcomeMessage(language, latestPrediction),
      modelUsed: 'System Initialization'
    }])
  }

  // Multilingual chat titles
  const labels = {
    en: {
      title: "AI Health Assistant",
      subtitle: "OpenRouter LLM-driven medical conversation with patient context integration.",
      modelSelect: "LLM Model Configuration",
      disclaimer: "Non-Medical Q&A: Do not seek diagnosis for emergency symptoms.",
      placeholder: "Type your wellness query here...",
      clear: "Clear Chat"
    },
    ur: {
      title: "اے آئی ہیلتھ اسسٹنٹ",
      subtitle: "مریض کے ریکارڈ کے مطابق ہیلتھ چیٹ بوٹ۔",
      modelSelect: "اے آئی ماڈل منتخب کریں",
      disclaimer: "غیر طبی چیٹ: ہنگامی علامات کی صورت میں چیٹ پر انحصار نہ کریں۔",
      placeholder: "اپنا سوال یہاں لکھیں...",
      clear: "چیٹ صاف کریں"
    },
    hi: {
      title: "एआई स्वास्थ्य सहायक",
      subtitle: "रोगी इतिहास संदर्भ एकीकरण के साथ संचालित स्वास्थ्य चैटबॉट।",
      modelSelect: "एआई मॉडल विन्यास",
      disclaimer: "गैर-चिकित्सीय चैट: आपातकालीन लक्षणों के निदान के लिए इसका उपयोग न करें।",
      placeholder: "अपना प्रश्न यहां लिखें...",
      clear: "चैट साफ़ करें"
    }
  }

  const t = labels[language] || labels['en']

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <Bot className="w-8 h-8 text-brand-primary" />
            {t.title}
          </h2>
          <p className="text-slate-400 text-sm">{t.subtitle}</p>
        </div>
        <button
          onClick={clearChat}
          className="px-4 py-2 bg-slate-900 border border-slate-800 hover:border-red-500/50 text-slate-400 hover:text-red-400 text-xs font-bold rounded-lg transition-all"
        >
          {t.clear}
        </button>
      </div>

      {/* Grid: Controls + Chat Window */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Model Selector sidebar */}
        <div className="lg:col-span-1 glass-panel p-5 rounded-2xl border border-slate-800 space-y-4 h-fit">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-brand-accent animate-pulse" />
            {t.modelSelect}
          </h3>

          <div className="space-y-2">
            {MODEL_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setSelectedModel(opt.id)}
                className={`w-full text-left px-3.5 py-3 rounded-lg text-xs font-bold border transition-all ${selectedModel === opt.id
                  ? 'bg-brand-primary/20 text-brand-primary border-brand-primary'
                  : 'bg-slate-950 text-slate-400 border-slate-900 hover:border-slate-800 hover:text-slate-300'
                  }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="p-3 bg-red-950/10 border border-red-950/20 rounded-xl flex gap-2">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-[10px] text-red-200/70 leading-relaxed font-semibold">
              {t.disclaimer}
            </p>
          </div>
        </div>

        {/* Chat Interface Box */}
        <div className="lg:col-span-3 glass-panel rounded-2xl border border-slate-800 flex flex-col h-[550px] overflow-hidden">

          {/* Messages list area */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4 scroll-smooth bg-slate-950/20">
            {messages.map((msg) => {
              const isBot = msg.role === 'assistant'
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-[85%] ${isBot ? 'self-start' : 'self-end ml-auto flex-row-reverse'}`}
                >
                  {/* Avatar bubble */}
                  <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${isBot
                    ? 'bg-brand-primary/10 border-brand-primary/30 text-brand-primary'
                    : 'bg-slate-900 border-slate-800 text-brand-accent'
                    }`}>
                    {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>

                  {/* Text panel bubble */}
                  <div className="space-y-1">
                    <div className={`p-4 rounded-2xl text-xs md:text-sm leading-relaxed whitespace-pre-line font-medium ${isBot
                      ? 'bg-slate-900/60 border border-slate-800/80 text-slate-200'
                      : 'bg-brand-primary text-white font-semibold'
                      }`}>
                      {msg.content}
                    </div>
                    {isBot && msg.modelUsed && (
                      <span className="text-[9px] text-slate-500 font-bold block pl-2">
                        via: {msg.modelUsed}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Pulsing loading helper */}
            {loading && (
              <div className="flex gap-3 max-w-[85%]">
                <div className="w-8 h-8 rounded-lg bg-brand-primary/10 border border-brand-primary/30 text-brand-primary flex items-center justify-center animate-pulse">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce delay-100"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce delay-200"></span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* User input footer form */}
          <form onSubmit={handleSendMessage} className="p-4 bg-slate-950/60 border-t border-slate-800/80 flex gap-2">
            <input
              type="text"
              placeholder={t.placeholder}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={loading}
              className="flex-1 bg-slate-900 px-4 py-3 rounded-lg border border-slate-800 text-xs md:text-sm text-white focus:outline-none focus:border-brand-primary disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || loading}
              className="px-5 bg-brand-primary hover:bg-brand-primary/80 disabled:opacity-50 text-white rounded-lg transition-all flex items-center justify-center shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>

      </div>
    </div>
  )
}

export default HealthAssistant
