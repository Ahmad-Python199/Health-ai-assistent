import React, { useState } from 'react'
import { Activity, ShieldAlert, Heart, ClipboardList, MessageSquare, Globe, User } from 'lucide-react'
import Dashboard from './pages/Dashboard'
import SymptomAnalyzer from './pages/SymptomAnalyzer'
import ResultsIntelligence from './pages/ResultsIntelligence'
import HistoryAnalytics from './pages/HistoryAnalytics'
import HealthAssistant from './pages/HealthAssistant'

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [latestPrediction, setLatestPrediction] = useState(null)
  const [language, setLanguage] = useState('en')
  const [userId, setUserId] = useState('default_user')

  const handlePredictionComplete = (result) => {
    setLatestPrediction(result)
    setCurrentPage('results')
  }

  // Dict for global translation tokens in Header and Footer
  const uiTranslations = {
    en: {
      brand: "AI Health Insight",
      dashboard: "Dashboard",
      analyzer: "Symptom Analyzer",
      results: "Results Analysis",
      history: "Timeline Analytics",
      assistant: "AI Chat Assistant",
      disclaimer: "This system provides informational insights only and is not a substitute for professional medical advice. If you are experiencing a medical emergency, please call 911 or visit your nearest emergency room immediately.",
      patient: "Patient Profiler"
    },
    ur: {
      brand: "اے آئی ہیلتھ انسائٹ",
      dashboard: "ڈیش بورڈ",
      analyzer: "علامات کا تجزیہ",
      results: "نتائج کا تجزیہ",
      history: "تاریخچہ کی معلومات",
      assistant: "اے آئی چیٹ اسسٹنٹ",
      disclaimer: "یہ نظام صرف معلوماتی بصیرت فراہم کرتا ہے اور پیشہ ورانہ طبی مشورے کا متبادل نہیں ہے۔ اگر آپ کو طبی ایمرجنسی کا سامنا ہے تو براہ کرم فوری طور پر ہنگامی خدمات سے رابطہ کریں یا قریبی ہسپتال تشریف لے جائیں۔",
      patient: "مریض کی پروفائل"
    },
    hi: {
      brand: "एआई हेल्थ इनसाइट",
      dashboard: "डैशबोर्ड",
      analyzer: "लक्षण विश्लेषक",
      results: "परिणाम विश्लेषण",
      history: "इतिहास विश्लेषण",
      assistant: "एआई चैट सहायक",
      disclaimer: "यह प्रणाली केवल सूचनात्मक जानकारी प्रदान करती है और पेशेवर चिकित्सा सलाह का विकल्प नहीं है। यदि आप किसी चिकित्सीय आपात स्थिति का सामना कर रहे हैं, तो कृपया तुरंत आपातकालीन सेवाओं को कॉल करें या नजदीकी अस्पताल जाएं।",
      patient: "रोगी प्रोफ़ाइल"
    }
  }

  const t = uiTranslations[language] || uiTranslations['en']

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden text-slate-100">
      {/* Decorative ambient background meshes */}
      <div className="mesh-bg-1"></div>
      <div className="mesh-bg-2"></div>

      {/* Header Bar */}
      <header className="sticky top-0 z-40 glass-panel border-b border-slate-800 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentPage('dashboard')}>
          <div className="bg-brand-primary/25 p-2.5 rounded-xl border border-brand-primary/50 text-brand-accent">
            <Heart className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-indigo-200 to-brand-accent bg-clip-text text-transparent">
              {t.brand}
            </h1>
            <p className="text-xs text-slate-400 font-medium tracking-wide">Enterprise Health Intelligence Platform</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex flex-wrap items-center gap-1.5 bg-slate-950/60 p-1.5 rounded-xl border border-slate-800/80">
          <button
            onClick={() => setCurrentPage('dashboard')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${currentPage === 'dashboard' ? 'bg-brand-primary text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'}`}
          >
            <Activity className="w-4 h-4" />
            {t.dashboard}
          </button>
          <button
            onClick={() => setCurrentPage('analyzer')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${currentPage === 'analyzer' ? 'bg-brand-primary text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'}`}
          >
            <ClipboardList className="w-4 h-4" />
            {t.analyzer}
          </button>
          <button
            onClick={() => setCurrentPage('results')}
            disabled={!latestPrediction}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${currentPage === 'results' ? 'bg-brand-primary text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'}`}
          >
            <ShieldAlert className="w-4 h-4" />
            {t.results}
          </button>
          <button
            onClick={() => setCurrentPage('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${currentPage === 'history' ? 'bg-brand-primary text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'}`}
          >
            <Activity className="w-4 h-4" />
            {t.history}
          </button>
          <button
            onClick={() => setCurrentPage('chat')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${currentPage === 'chat' ? 'bg-brand-primary text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'}`}
          >
            <MessageSquare className="w-4 h-4" />
            {t.assistant}
          </button>
        </nav>

        {/* Global Selectors */}
        <div className="flex items-center gap-3">
          {/* Language Selector */}
          <div className="flex items-center gap-2 bg-slate-950/60 px-3 py-2 rounded-lg border border-slate-800">
            <Globe className="w-4 h-4 text-brand-accent" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-transparent text-sm font-medium text-slate-300 outline-none cursor-pointer"
            >
              <option value="en" className="bg-brand-card">EN</option>
              <option value="ur" className="bg-brand-card">اردو</option>
              <option value="hi" className="bg-brand-card">हिंदी</option>
            </select>
          </div>

          {/* User badge */}
          <div className="flex items-center gap-2 bg-slate-950/60 px-3 py-2 rounded-lg border border-slate-800">
            <User className="w-4 h-4 text-brand-primary" />
            <span className="text-xs font-semibold text-slate-300">Default Pt.</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 py-8 relative z-10">
        {currentPage === 'dashboard' && (
          <Dashboard
            setCurrentPage={setCurrentPage}
            latestPrediction={latestPrediction}
            userId={userId}
            language={language}
          />
        )}
        {currentPage === 'analyzer' && (
          <SymptomAnalyzer
            onPredictionComplete={handlePredictionComplete}
            userId={userId}
            language={language}
          />
        )}
        {currentPage === 'results' && (
          <ResultsIntelligence
            prediction={latestPrediction}
            setCurrentPage={setCurrentPage}
            language={language}
          />
        )}
        {currentPage === 'history' && (
          <HistoryAnalytics
            userId={userId}
            language={language}
            setCurrentPage={setCurrentPage}
            setLatestPrediction={setLatestPrediction}
          />
        )}
        {currentPage === 'chat' && (
          <HealthAssistant
            userId={userId}
            language={language}
            latestPrediction={latestPrediction}
          />
        )}
      </main>

      {/* Global Safety Footer */}
      <footer className="glass-panel border-t border-slate-800/80 px-6 py-6 text-center mt-auto">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs font-semibold text-red-400 bg-red-950/30 px-4 py-2.5 rounded-lg border border-red-900/30 text-center leading-relaxed">
            ⚠️ <strong>{language === 'ur' ? 'اہم دستبرداری:' : language === 'hi' ? 'महत्वपूर्ण अस्वीकरण:' : 'IMPORTANT DISCLAIMER:'}</strong> {t.disclaimer}
          </p>
          <div className="text-xs text-slate-500 font-medium">
            © 2026 AI Health Symptom Analyzer. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
