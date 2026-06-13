import React, { useEffect, useState } from 'react'
import { Activity, ShieldAlert, Heart, MessageSquare, ClipboardList, CheckCircle2, ChevronRight, Calendar, ArrowRight, Trash2 } from 'lucide-react'
import axios from 'axios'

const API_BASE = 'http://localhost:8000'

function Dashboard({ setCurrentPage, latestPrediction, userId, language }) {
  const [stats, setStats] = useState({
    totalChecks: 0,
    latestRisk: 'N/A',
    trend: 'Stable',
    historyList: [],
    loading: true
  })

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const res = await axios.get(`${API_BASE}/history?user_id=${userId}`)
        const data = res.data
        const history = data.history || []
        const analytics = data.analytics || {}

        setStats({
          totalChecks: history.length,
          latestRisk: history.length > 0 ? history[0].risk_level : 'N/A',
          trend: analytics.trend_direction || 'Stable',
          historyList: history.slice(0, 3), // Top 3
          loading: false
        })
      } catch (err) {
        console.error('Failed to load dashboard stats:', err)
        setStats(prev => ({ ...prev, loading: false }))
      }
    }
    fetchDashboardStats()
  }, [userId, latestPrediction])

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Are you sure you want to remove this diagnosis record?')) return
    try {
      await axios.delete(`${API_BASE}/history/${id}`)
      const res = await axios.get(`${API_BASE}/history?user_id=${userId}`)
      const data = res.data
      const history = data.history || []
      const analytics = data.analytics || {}

      setStats({
        totalChecks: history.length,
        latestRisk: history.length > 0 ? history[0].risk_level : 'N/A',
        trend: analytics.trend_direction || 'Stable',
        historyList: history.slice(0, 3),
        loading: false
      })
    } catch (err) {
      console.error(err)
      alert('Failed to delete history item.')
    }
  }

  const getRiskBadgeColor = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'low':
        return 'from-emerald-500/10 to-teal-500/10 text-emerald-400 border-emerald-500/30'
      case 'medium':
        return 'from-amber-500/10 to-orange-500/10 text-amber-400 border-amber-500/30'
      case 'high':
        return 'from-red-500/10 to-rose-500/10 text-red-400 border-red-500/30'
      case 'critical':
        return 'from-red-600/20 to-rose-600/20 text-red-400 border-red-500/50 emergency-pulse'
      default:
        return 'from-slate-500/10 to-slate-600/10 text-slate-400 border-slate-500/30'
    }
  }

  // Multilingual dashboard labels
  const labels = {
    en: {
      welcome: "Welcome to your Health Command Center",
      subtitle: "AI-driven health intelligence system supporting medical insights & analysis.",
      newCheck: "New Symptom Check",
      newCheckDesc: "Enter symptoms and receive instant classifier predictions and risk scores.",
      chat: "Consult AI Assistant",
      chatDesc: "Ask open-ended medical questions and trace details about predictions.",
      quickStats: "Quick Health Metrics",
      totalChecks: "Total Evaluations",
      trend: "Recent Recovery Trend",
      latestRisk: "Last Calculated Risk",
      recentChecks: "Recent Symptom History",
      emptyHistory: "No checks recorded yet. Start by analyzing your symptoms.",
      viewReport: "View Full Intelligence Report",
      disclaimerTitle: "Non-Medical Educational Tool",
      disclaimerDesc: "Predictions are simulated outputs of classification algorithms. Consult your doctor for medical decisions."
    },
    ur: {
      welcome: "صحت کے کمانڈ سینٹر میں خوش آمدید",
      subtitle: "مصنوعی ذہانت سے چلنے والا ہیلتھ انٹیلی جنس سسٹم جو طبی معلومات اور تجزیہ فراہم کرتا ہے۔",
      newCheck: "نیا علامات کا معائنہ",
      newCheckDesc: "علامات درج کریں اور فوری کلاسیفائر کی پیش گوئیاں اور خطرے کے اسکور حاصل کریں۔",
      chat: "اے آئی اسسٹنٹ سے مشورہ",
      chatDesc: "طبی سوالات پوچھیں اور پیش گوئیوں کے بارے میں تفصیلات معلوم کریں۔",
      quickStats: "صحت کے فوری اعداد و شمار",
      totalChecks: "کل تشخیصات",
      trend: "صحت یابی کا رجحان",
      latestRisk: "آخری حسابی خطرہ",
      recentChecks: "علامات کی حالیہ تاریخ",
      emptyHistory: "ابھی تک کوئی معائنہ ریکارڈ نہیں کیا گیا۔ علامات کا تجزیہ کر کے شروع کریں۔",
      viewReport: "مکمل رپورٹ دیکھیں",
      disclaimerTitle: "غیر طبی معلوماتی نظام",
      disclaimerDesc: "پیش گوئیاں درجہ بندی الگورتھم کی علامتی پیداوار ہیں۔ طبی فیصلوں کے لیے ڈاکٹر سے رجوع کریں۔"
    },
    hi: {
      welcome: "स्वास्थ्य कमांड सेंटर में आपका स्वागत है",
      subtitle: "कृत्रिम बुद्धिमत्ता संचालित स्वास्थ्य खुफिया प्रणाली जो चिकित्सा जानकारी और विश्लेषण प्रदान करती है।",
      newCheck: "नया लक्षण परीक्षण",
      newCheckDesc: "लक्षण दर्ज करें और तुरंत क्लासिफायर भविष्यवाणियां और जोखिम स्कोर प्राप्त करें।",
      chat: "एआई सहायक से परामर्श",
      chatDesc: "चिकित्सा संबंधी प्रश्न पूछें और भविष्यवाणियों के विवरण का पता लगाएं।",
      quickStats: "त्वरित स्वास्थ्य मेट्रिक्स",
      totalChecks: "कुल मूल्यांकन",
      trend: "स्वास्थ्य सुधार की प्रवृत्ति",
      latestRisk: "अंतिम परिकलित जोखिम",
      recentChecks: "हालिया लक्षण इतिहास",
      emptyHistory: "अभी तक कोई परीक्षण दर्ज नहीं किया गया है। अपने लक्षणों का विश्लेषण करके शुरू करें।",
      viewReport: "पूर्ण रिपोर्ट देखें",
      disclaimerTitle: "गैर-चिकित्सीय शैक्षिक उपकरण",
      disclaimerDesc: "भविष्यवाणियां वर्गीकरण एल्गोरिदम के सिम्युलेटेड परिणाम हैं। चिकित्सकीय निर्णयों के लिए अपने डॉक्टर से परामर्श लें।"
    }
  }

  const t = labels[language] || labels['en']

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-8 md:p-12 border border-slate-800">
        <div className="absolute right-0 top-0 w-96 h-96 bg-brand-primary/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-2xl space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            System Online & Guarded
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
            {t.welcome}
          </h2>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            {t.subtitle}
          </p>
        </div>
      </div>

      {/* Primary Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Run Analyzer Card */}
        <div
          onClick={() => setCurrentPage('analyzer')}
          className="group cursor-pointer glass-panel p-8 rounded-2xl border border-slate-800/80 hover:border-brand-primary/50 transition-all duration-300 shadow-glass hover:shadow-glass-hover relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/5 rounded-bl-full transition-all group-hover:scale-125"></div>
          <div className="flex items-start gap-4">
            <div className="bg-brand-primary/10 p-4 rounded-xl text-brand-primary border border-brand-primary/20 group-hover:bg-brand-primary group-hover:text-white transition-all">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                {t.newCheck}
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                {t.newCheckDesc}
              </p>
            </div>
          </div>
        </div>

        {/* Start Chat Card */}
        <div
          onClick={() => setCurrentPage('chat')}
          className="group cursor-pointer glass-panel p-8 rounded-2xl border border-slate-800/80 hover:border-brand-accent/50 transition-all duration-300 shadow-glass hover:shadow-glass-hover relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-accent/5 rounded-bl-full transition-all group-hover:scale-125"></div>
          <div className="flex items-start gap-4">
            <div className="bg-brand-accent/10 p-4 rounded-xl text-brand-accent border border-brand-accent/20 group-hover:bg-brand-accent group-hover:text-white transition-all">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                {t.chat}
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                {t.chatDesc}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics and Timeline widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Metric Cards List */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800">
            <h3 className="text-md font-semibold text-slate-400 tracking-wider uppercase mb-6 flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand-accent" />
              {t.quickStats}
            </h3>

            <div className="space-y-6">
              {/* Total Evaluations */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950/40 border border-slate-900">
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{t.totalChecks}</p>
                  <p className="text-2xl font-black text-white mt-1">{stats.totalChecks}</p>
                </div>
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
              </div>

              {/* Recovery Trend */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950/40 border border-slate-900">
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{t.trend}</p>
                  <p className={`text-lg font-bold mt-1 ${stats.trend === 'Improving' ? 'text-emerald-400' : stats.trend === 'Deteriorating' ? 'text-rose-400' : 'text-slate-300'}`}>
                    {stats.trend}
                  </p>
                </div>
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <Activity className="w-5 h-5 text-indigo-400" />
                </div>
              </div>

              {/* Latest Risk Indicator Widget */}
              <div className="flex flex-col p-4 rounded-xl bg-slate-950/40 border border-slate-900">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{t.latestRisk}</p>
                <div className="flex items-center justify-between mt-2.5">
                  <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-extrabold border bg-gradient-to-r ${getRiskBadgeColor(stats.latestRisk)}`}>
                    {stats.latestRisk}
                  </span>
                  {latestPrediction && (
                    <button
                      onClick={() => setCurrentPage('results')}
                      className="text-xs font-bold text-brand-accent hover:text-white flex items-center gap-1 transition-all"
                    >
                      {t.viewReport}
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* History Feed */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800">
          <h3 className="text-md font-semibold text-slate-400 tracking-wider uppercase mb-6 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-brand-primary" />
            {t.recentChecks}
          </h3>

          {stats.loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-brand-primary border-t-transparent animate-spin"></div>
              <p className="text-sm text-slate-500 font-semibold">Loading diagnostic database logs...</p>
            </div>
          ) : stats.historyList.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-16 px-4 space-y-4">
              <ClipboardList className="w-12 h-12 text-slate-700" />
              <p className="text-slate-400 text-sm font-medium">{t.emptyHistory}</p>
              <button
                onClick={() => setCurrentPage('analyzer')}
                className="px-5 py-2.5 rounded-lg text-xs font-bold bg-brand-primary hover:bg-brand-primary/80 transition-all text-white flex items-center gap-1.5"
              >
                Run First Analysis
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {stats.historyList.map((item, idx) => {
                const date = item.timestamp ? new Date(item.timestamp).toLocaleDateString() : 'Recent'
                const conditions = item.predicted_conditions || []
                return (
                  <div
                    key={item._id || idx}
                    className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {date}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border bg-gradient-to-r ${getRiskBadgeColor(item.risk_level)}`}>
                          {item.risk_level}
                        </span>
                      </div>
                      <p className="text-sm text-slate-300 font-bold">
                        Symptoms: <span className="font-medium text-slate-400">{item.symptoms.map(s => s.replace("_", " ")).join(", ")}</span>
                      </p>
                      <p className="text-xs text-slate-400">
                        Primary Matched: <span className="font-semibold text-brand-accent">{conditions[0]?.name || 'Unknown'}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => {
                          latestPrediction = item
                          setCurrentPage('results')
                        }}
                        className="px-3.5 py-2 rounded-lg text-xs font-bold bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-all"
                      >
                        Review Report
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item._id)}
                        className="p-2 bg-slate-950 border border-slate-950 hover:border-red-500/30 text-slate-500 hover:text-red-400 hover:bg-red-950/20 rounded-lg transition-all"
                        title="Delete Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Informative Safety Callout */}
      <div className="glass-panel p-5 rounded-2xl border border-red-900/20 bg-red-950/5 flex items-start gap-4">
        <ShieldAlert className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-red-400">{t.disclaimerTitle}</h4>
          <p className="text-xs text-red-200/70 leading-relaxed">
            {t.disclaimerDesc}
          </p>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
