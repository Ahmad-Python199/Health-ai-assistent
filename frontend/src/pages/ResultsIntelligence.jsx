import React from 'react'
import { ShieldAlert, AlertOctagon, Heart, ChevronLeft, ArrowRight, MessageSquare, Apple, Compass, Info } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts'

function ResultsIntelligence({ prediction, setCurrentPage, language }) {
  if (!prediction) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-slate-600" />
        <h3 className="text-xl font-bold text-white">No active intelligence report found</h3>
        <p className="text-slate-400 text-sm max-w-sm">Please analyze your symptoms first using the Symptom Analyzer wizard.</p>
        <button
          onClick={() => setCurrentPage('analyzer')}
          className="px-5 py-2.5 bg-brand-primary text-white rounded-lg text-xs font-bold transition-all"
        >
          Open Analyzer Wizard
        </button>
      </div>
    )
  }

  // Format Recharts data
  const chartData = prediction.predicted_conditions.map(c => {
    // Extract percentage float
    const probVal = parseFloat(c.probability.replace('%', ''))
    return {
      name: c.name,
      probability: probVal
    }
  })

  const getRiskColor = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'low':
        return { text: 'text-emerald-400', bg: 'bg-emerald-950/20 border-emerald-500/30', badge: 'bg-emerald-500 text-slate-950' }
      case 'medium':
        return { text: 'text-amber-400', bg: 'bg-amber-950/20 border-amber-500/30', badge: 'bg-amber-500 text-slate-950' }
      case 'high':
        return { text: 'text-red-400', bg: 'bg-red-950/20 border-red-500/30', badge: 'bg-red-500 text-white' }
      case 'critical':
        return { text: 'text-red-400', bg: 'bg-red-950/30 border-red-500/60 emergency-pulse', badge: 'bg-red-600 text-white animate-pulse' }
      default:
        return { text: 'text-slate-400', bg: 'bg-slate-950/40 border-slate-800', badge: 'bg-slate-700 text-white' }
    }
  }

  const riskStyle = getRiskColor(prediction.risk_level)

  // Multilingual Results labels
  const labels = {
    en: {
      title: "Clinical Analysis Report",
      subtitle: "Machine learning classifier outcomes and neural narrative explanations.",
      backBtn: "Back to Analyzer",
      riskWidget: "Determined Threat Severity",
      conditionsWidget: "Classified Condition Likelihoods",
      xaiWidget: "Neural Feature Importance (Explainable AI)",
      aiNarrative: "Empathic AI Clinical Summary",
      recsWidget: "Safety & Wellness Actions",
      dietTitle: "Dietary Adjustments",
      lifestyleTitle: "Lifestyle Adjustments",
      generalTitle: "Self-Care Recommendations",
      chatBtn: "Ask AI Assistant about results",
      disclaimer: "DISCLAIMER: Predictions are computational estimates for educational reference only."
    },
    ur: {
      title: "کلینیکل تجزیہ رپورٹ",
      subtitle: "مشین لرننگ کلاسیفائر کے نتائج اور تفصیلی وضاحتی معلومات۔",
      backBtn: "علامات کی سکرین پر واپس",
      riskWidget: "خطرے کی شرح",
      conditionsWidget: "ممکنہ بیماریوں کا امکان",
      xaiWidget: "وضاحتی مصنوعی ذہانت (Explainable AI)",
      aiNarrative: "اے آئی تشخیصی خلاصہ",
      recsWidget: "حفاظت اور تندرستی کے اقدامات",
      dietTitle: "غذائی تبدیلیاں",
      lifestyleTitle: "طرز زندگی میں تبدیلی",
      generalTitle: "عام حفاظتی تجاویز",
      chatBtn: "اے آئی اسسٹنٹ سے سوال پوچھیں",
      disclaimer: "دستبرداری: پیش گوئیاں تعلیمی مقصد کے لیے کمپیوٹرائزڈ تخمینہ ہیں۔"
    },
    hi: {
      title: "नैदानिक ​​विश्लेषण रिपोर्ट",
      subtitle: "मशीन लर्निंग क्लासिफायर के परिणाम और विस्तृत वर्णनात्मक विवरण।",
      backBtn: "लक्षण स्क्रीन पर वापस",
      riskWidget: "निर्धारित जोखिम गंभीरता",
      conditionsWidget: "संभावित बीमारियों की संभावना",
      xaiWidget: "स्पष्टीकरण योग्य एआई (Explainable AI)",
      aiNarrative: "एआई नैदानिक ​​सारांश",
      recsWidget: "सुरक्षा और कल्याण के उपाय",
      dietTitle: "आहार संबंधी बदलाव",
      lifestyleTitle: "जीवनशैली में बदलाव",
      generalTitle: "सामान्य सुरक्षा सिफारिशें",
      chatBtn: "परिणामों के बारे में एआई सहायक से पूछें",
      disclaimer: "अस्वीकरण: भविष्यवाणियां केवल शैक्षिक संदर्भ के लिए संगणकीय अनुमान हैं।"
    }
  }

  const t = labels[language] || labels['en']

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <ShieldAlert className="w-8 h-8 text-brand-accent animate-pulse" />
            {t.title}
          </h2>
          <p className="text-slate-400 text-sm">{t.subtitle}</p>
        </div>
        <button
          onClick={() => setCurrentPage('analyzer')}
          className="px-4 py-2 bg-slate-900 border border-slate-800 hover:border-brand-primary text-slate-300 hover:text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5"
        >
          <ChevronLeft className="w-4 h-4" />
          {t.backBtn}
        </button>
      </div>

      {/* EMERGENCY WARNING BANNER */}
      {prediction.emergency_alert && (
        <div className="p-6 rounded-2xl border border-red-500/50 bg-red-950/20 shadow-lg text-white space-y-3 flex items-start gap-4 emergency-pulse">
          <AlertOctagon className="w-8 h-8 text-red-500 shrink-0 mt-1" />
          <div className="space-y-1">
            <h3 className="text-lg font-black tracking-wide text-red-400 uppercase">🚨 MEDICAL EMERGENCY ALERT DETECTED</h3>
            <p className="text-sm font-semibold leading-relaxed text-red-100">{prediction.emergency_alert}</p>
            {prediction.recommendations.length > 0 && (
              <p className="text-xs font-bold text-rose-300 mt-2">
                Immediate Action Advised: {prediction.recommendations[0]}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Column 1: Risk Widget & Narrative */}
        <div className="lg:col-span-1 space-y-6">
          {/* Risk severity indicator card */}
          <div className={`glass-panel p-6 rounded-2xl border ${riskStyle.bg} space-y-4`}>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.riskWidget}</h3>
            <div className="flex items-center justify-between">
              <span className={`text-3xl font-black ${riskStyle.text}`}>
                {prediction.risk_level}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${riskStyle.badge}`}>
                {prediction.risk_level === 'Critical' ? 'SEEK CARE' : 'MONITOR'}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Calculated risk profile dynamically scales depending on symptom combinations, age brackets, pre-existing history weights, and intensity selectors.
            </p>
          </div>

          {/* User profile parameters list */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Analyzed Profile Inputs</h3>
            <div className="space-y-2 text-xs font-semibold text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-500">Language Model:</span>
                <span>{language.toUpperCase()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-500">Reported Symptoms:</span>
                <span className="text-brand-accent max-w-[200px] text-right truncate">
                  {prediction.symptoms.map(s => s.replace("_", " ")).join(", ")}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-500">Timestamp:</span>
                <span>{prediction.timestamp ? new Date(prediction.timestamp).toLocaleTimeString() : 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Ask AI shortcut */}
          <button
            onClick={() => setCurrentPage('chat')}
            className="w-full py-4 bg-gradient-to-r from-brand-primary to-brand-accent hover:opacity-90 text-white font-extrabold text-sm rounded-2xl transition-all shadow-md flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-4 h-4 animate-bounce" />
            {t.chatBtn}
          </button>
        </div>

        {/* Column 2 & 3: Results, Graphs, and AI analysis */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recharts Disease Probability Chart */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-rose-500" />
              {t.conditionsWidget}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-64 w-full">
              {/* Vertical Bar Chart */}
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                  >
                    <XAxis type="number" domain={[0, 100]} stroke="#475569" fontSize={10} tickFormatter={(v) => `${v}%`} />
                    <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={11} width={110} tickLine={false} />
                    <Tooltip
                      formatter={(v) => [`${v}%`, 'Probability']}
                      contentStyle={{ backgroundColor: '#0b0f19', border: '1px solid #1e293b', borderRadius: 8 }}
                    />
                    <Bar dataKey="probability" radius={[0, 4, 4, 0]} barSize={12}>
                      {chartData.map((entry, index) => {
                        const colors = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444']
                        return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Pie/Donut Chart */}
              <div className="h-64 flex flex-col items-center justify-center">
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={3}
                        dataKey="probability"
                      >
                        {chartData.map((entry, index) => {
                          const colors = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444']
                          return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        })}
                      </Pie>
                      <Tooltip
                        formatter={(v) => [`${v}%`, 'Probability']}
                        contentStyle={{ backgroundColor: '#0b0f19', border: '1px solid #1e293b', borderRadius: 8 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Visual Legend */}
                <div className="flex flex-wrap justify-center gap-3 text-[10px] font-bold text-slate-400">
                  {chartData.map((d, index) => {
                    const colors = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444']
                    return (
                      <span key={index} className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[index % colors.length] }}></span>
                        {d.name} ({d.probability}%)
                      </span>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Explainable AI Block */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 bg-slate-950/20 space-y-2">
            <h4 className="text-xs font-bold text-brand-primary uppercase tracking-wider flex items-center gap-1">
              <Info className="w-3.5 h-3.5" />
              {t.xaiWidget}
            </h4>
            <p className="text-xs text-slate-300 font-medium leading-relaxed italic">
              {prediction.ml_explanation}
            </p>
          </div>

          {/* AI Narrative Narrative */}
          <div className="glass-panel p-8 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-brand-accent" />
              {t.aiNarrative}
            </h3>
            {/* Display formatted markdown simulation or text content */}
            <div className="text-slate-300 text-sm leading-relaxed space-y-3 whitespace-pre-line font-medium">
              {prediction.ai_explanation}
            </div>
          </div>

          {/* Treatment & lifestyle suggestions lists */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
            <h3 className="text-md font-bold text-white border-b border-slate-800 pb-3">
              {t.recsWidget}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Recommendations */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-brand-accent uppercase tracking-wider flex items-center gap-1.5">
                  <Compass className="w-4 h-4" />
                  {t.generalTitle}
                </h4>
                <ul className="space-y-2 text-xs font-medium text-slate-400">
                  {prediction.recommendations.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                      <span className="text-brand-accent mt-0.5">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Diet suggestions */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Apple className="w-4 h-4" />
                  {t.dietTitle}
                </h4>
                <ul className="space-y-2 text-xs font-medium text-slate-400">
                  {prediction.diet_suggestions.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                      <span className="text-emerald-400 mt-0.5">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Lifestyle suggestions */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-brand-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Compass className="w-4 h-4" />
                  {t.lifestyleTitle}
                </h4>
                <ul className="space-y-2 text-xs font-medium text-slate-400">
                  {prediction.lifestyle_suggestions.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                      <span className="text-brand-primary mt-0.5">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}

export default ResultsIntelligence
