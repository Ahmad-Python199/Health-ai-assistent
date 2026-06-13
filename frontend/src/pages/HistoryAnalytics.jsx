import React, { useEffect, useState } from 'react'
import { Activity, ShieldAlert, Heart, Calendar, Filter, Search, ChevronRight, RefreshCw, AlertTriangle, TrendingUp, Trash2 } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts'
import axios from 'axios'

const API_BASE = 'http://localhost:8000'

function HistoryAnalytics({ userId, language, setCurrentPage, setLatestPrediction }) {
  const [history, setHistory] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filter States
  const [searchTerm, setSearchTerm] = useState('')
  const [riskFilter, setRiskFilter] = useState('All')
  const [sortBy, setSortBy] = useState('newest')

  const handleDeleteHistory = async (id) => {
    if (!window.confirm('Are you sure you want to remove this diagnosis record from your history timeline?')) return
    try {
      await axios.delete(`${API_BASE}/history/${id}`)
      setHistory(prev => prev.filter(item => item._id !== id))
    } catch (err) {
      console.error(err)
      alert('Failed to delete history log item from backend.')
    }
  }

  const fetchHistory = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await axios.get(`${API_BASE}/history?user_id=${userId}`)
      setHistory(res.data.history || [])
      setAnalytics(res.data.analytics || null)
    } catch (err) {
      console.error(err)
      setError('Failed to fetch history logs from the server database.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [userId])

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

  const getTrendColor = (trend) => {
    switch (trend?.toLowerCase()) {
      case 'improving':
        return 'text-emerald-400 bg-emerald-950/20 border-emerald-500/20'
      case 'deteriorating':
        return 'text-rose-400 bg-rose-950/20 border-rose-500/20 emergency-pulse'
      default:
        return 'text-slate-300 bg-slate-950/20 border-slate-800'
    }
  }

  // Filter & Sort Logic
  const filteredHistory = history.filter((item) => {
    const symptomsStr = item.symptoms.map(s => s.replace("_", " ")).join(", ").toLowerCase()
    const matchSearch = symptomsStr.includes(searchTerm.toLowerCase())
    const matchRisk = riskFilter === 'All' || item.risk_level.toLowerCase() === riskFilter.toLowerCase()
    return matchSearch && matchRisk
  })

  const sortedHistory = [...filteredHistory].sort((a, b) => {
    const timeA = new Date(a.timestamp || 0).getTime()
    const timeB = new Date(b.timestamp || 0).getTime()
    return sortBy === 'newest' ? timeB - timeA : timeA - timeB
  })

  // Recharts Chart Formatting
  const chartData = analytics?.timeline || []

  // Compute risk level cohorts breakdown for the donut chart
  const lowCount = history.filter(item => item.risk_level?.toLowerCase() === 'low').length
  const mediumCount = history.filter(item => item.risk_level?.toLowerCase() === 'medium').length
  const highCount = history.filter(item => ['high', 'critical'].includes(item.risk_level?.toLowerCase())).length

  const cohortData = [
    { name: 'Low', value: lowCount, color: '#10b981' },       // Emerald Green
    { name: 'Medium', value: mediumCount, color: '#f59e0b' },   // Amber Yellow
    { name: 'High', value: highCount, color: '#f97316' }        // Orange
  ]

  // Map numbers back to label names for tooltip/axis
  const riskLabels = { 1: "Low", 2: "Medium", 3: "High", 4: "Critical" }
  const severityLabels = { 1: "Mild", 2: "Moderate", 3: "Severe" }

  const labels = {
    en: {
      title: "Longitudinal Health Intelligence",
      subtitle: "Time-series risk trajectory and history tracking of symptom metrics.",
      trendCard: "Historical Severity Trajectory",
      trendStatus: "Trend Direction",
      futureRisk: "Extrapolated Future Risk",
      messageTitle: "Trajectory Assessment Summary",
      filters: "Diagnostic Filters",
      searchPlaceholder: "Search symptoms...",
      riskFilter: "Filter by Risk Level",
      sortBy: "Sort Timeline",
      timelineList: "Complete History Logs",
      reviewBtn: "Review Analysis",
      emptyHistory: "No health history available. Run checks to populate timeline curves."
    },
    ur: {
      title: "صحت کے رجحان کی معلومات",
      subtitle: "علامات اور خطرے کی شرح کی تاریخ کا ٹائم سیریز گراف اور تفصیلی چارٹ۔",
      trendCard: "شدت کی رفتار کا گراف",
      trendStatus: "رجحان کی سمت",
      futureRisk: "مستقبل کے خطرے کا تخمینہ",
      messageTitle: "صحت کی تشخیص کا خلاصہ",
      filters: "فلٹرز",
      searchPlaceholder: "علامت تلاش کریں...",
      riskFilter: "خطرے کی سطح کے فلٹرز",
      sortBy: "ترتیب دیں",
      timelineList: "تاریخ کا مکمل ریکارڈ",
      reviewBtn: "رپورٹ کا جائزہ لیں",
      emptyHistory: "صحت کا کوئی ریکارڈ موجود نہیں ہے۔ ٹائم لائن بنانے کے لیے معائنہ کریں۔"
    },
    hi: {
      title: "दीर्घकालिक स्वास्थ्य खुफिया",
      subtitle: "लक्षण मेट्रिक्स की समय-श्रृंखला जोखिम प्रक्षेपवक्र और इतिहास ट्रैकिंग।",
      trendCard: "ऐतिहासिक गंभीरता प्रक्षेपवक्र",
      trendStatus: "रुझान की दिशा",
      futureRisk: "भविष्य के जोखिम का अनुमान",
      messageTitle: "स्वास्थ्य मूल्यांकन सारांश",
      filters: "फ़िल्टर",
      searchPlaceholder: "लक्षण खोजें...",
      riskFilter: "जोखिम स्तर से फ़िल्टर करें",
      sortBy: "क्रमबद्ध करें",
      timelineList: "पूर्ण इतिहास लॉग",
      reviewBtn: "रिपोर्ट की समीक्षा",
      emptyHistory: "कोई स्वास्थ्य इतिहास उपलब्ध नहीं है। ग्राफ़ बनाने के लिए लक्षण परीक्षण करें।"
    }
  }

  const t = labels[language] || labels['en']

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <TrendingUp className="w-8 h-8 text-brand-primary" />
            {t.title}
          </h2>
          <p className="text-slate-400 text-sm">{t.subtitle}</p>
        </div>
        <button
          onClick={fetchHistory}
          className="p-2.5 bg-slate-900 border border-slate-800 hover:border-brand-primary text-slate-400 hover:text-white rounded-lg transition-all"
          title="Refresh History Database"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-950/10 text-red-400 text-sm font-semibold flex items-center gap-2.5">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <div className="w-10 h-10 rounded-full border-2 border-brand-primary border-t-transparent animate-spin"></div>
          <p className="text-sm text-slate-500 font-semibold">Loading patient longitudinal database...</p>
        </div>
      ) : history.length === 0 ? (
        <div className="glass-panel p-16 rounded-3xl border border-slate-800 text-center flex flex-col items-center justify-center space-y-4">
          <Activity className="w-16 h-16 text-slate-700 animate-pulse" />
          <h3 className="text-lg font-bold text-white">{t.emptyHistory}</h3>
          <button
            onClick={() => setCurrentPage('analyzer')}
            className="px-6 py-3 bg-brand-primary text-white rounded-lg text-xs font-black hover:opacity-90 transition-all shadow-md shadow-brand-primary/20"
          >
            Launch Analyzer Wizard
          </button>
        </div>
      ) : (
        <>
          {/* Longitudinal Chart and Trends section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* The time-series Recharts line chart */}
            <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.trendCard}</h3>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                    <XAxis dataKey="date" stroke="#475569" fontSize={10} />
                    <YAxis
                      stroke="#475569"
                      fontSize={11}
                      domain={[0, 4.5]}
                      ticks={[1, 2, 3, 4]}
                      tickFormatter={(v) => riskLabels[v] || ''}
                    />
                    <Tooltip
                      labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                      contentStyle={{ backgroundColor: '#0b0f19', border: '1px solid #1e293b', borderRadius: 8 }}
                      formatter={(value, name) => {
                        if (name === "Risk Level") return [riskLabels[value] || value, name]
                        if (name === "Severity") return [severityLabels[value] || value, name]
                        return [value, name]
                      }}
                    />
                    <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 12 }} />
                    <Line
                      name="Risk Level"
                      type="monotone"
                      dataKey="risk_score"
                      stroke="#6366f1"
                      strokeWidth={3}
                      activeDot={{ r: 8 }}
                    />
                    <Line
                      name="Severity"
                      type="monotone"
                      dataKey="severity_score"
                      stroke="#06b6d4"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Trajectory Status indicators */}
            <div className="lg:col-span-1 space-y-6">
              {/* Trend Direction */}
              <div className={`glass-panel p-6 rounded-2xl border ${getTrendColor(analytics?.trend_direction)} space-y-3`}>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.trendStatus}</h4>
                <p className="text-3xl font-black">{analytics?.trend_direction || 'Stable'}</p>
                <div className="text-xs font-semibold text-slate-400 flex justify-between">
                  <span>Trend Slope Coefficient:</span>
                  <span className="text-white font-extrabold">{analytics?.trend_slope || 0.0}</span>
                </div>
              </div>

              {/* Extrapolated Future Risk */}
              <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3 bg-slate-950/20">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.futureRisk}</h4>
                <p className="text-2xl font-black text-brand-accent">{analytics?.predicted_future_risk || 'Low'}</p>
                <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                  Extrapolation is calculated from risk variations across chronological data logs using weighted regression.
                </p>
              </div>

              {/* Risk Level Cohorts Donut Chart Card */}
              <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-brand-accent" />
                  RISK LEVEL COHORTS
                </h4>

                {history.length === 0 ? (
                  <p className="text-xs text-slate-500 font-semibold py-8 text-center">No risk data recorded.</p>
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    <div className="h-44 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={cohortData.filter(d => d.value > 0)}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={62}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {cohortData.filter(d => d.value > 0).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(v) => [v, 'Checks count']}
                            contentStyle={{ backgroundColor: '#0b0f19', border: '1px solid #1e293b', borderRadius: 8 }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Custom Legend */}
                    <div className="flex flex-wrap justify-center gap-3 text-[10px] font-bold text-slate-400 mt-2">
                      {cohortData.map((d, index) => (
                        <span key={index} className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded" style={{ backgroundColor: d.color }}></span>
                          {d.name}: {d.value}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Health Assessment Message block */}
          {analytics?.trajectory_message && (
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-900/10 flex items-start gap-4">
              <ShieldAlert className="w-6 h-6 text-brand-accent shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">{t.messageTitle}</h4>
                <p className="text-xs text-slate-300 font-medium leading-relaxed">
                  {analytics.trajectory_message}
                </p>
              </div>
            </div>
          )}

          {/* Filtering controls */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5 shrink-0">
              <Filter className="w-4 h-4 text-brand-primary" />
              {t.filters}
            </h4>

            {/* Inputs */}
            <div className="w-full flex flex-wrap md:flex-nowrap gap-3 items-center">
              {/* Search text */}
              <div className="flex-1 min-w-[180px] flex items-center bg-slate-950 px-3.5 py-2 rounded-lg border border-slate-800">
                <Search className="w-4 h-4 text-slate-500 mr-2 shrink-0" />
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              {/* Risk select */}
              <div className="flex items-center bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 text-xs">
                <span className="text-slate-500 font-semibold mr-2">{t.riskFilter}:</span>
                <select
                  value={riskFilter}
                  onChange={(e) => setRiskFilter(e.target.value)}
                  className="bg-transparent text-slate-300 font-bold outline-none cursor-pointer"
                >
                  <option value="All" className="bg-brand-card">All Risks</option>
                  <option value="Low" className="bg-brand-card">Low</option>
                  <option value="Medium" className="bg-brand-card">Medium</option>
                  <option value="High" className="bg-brand-card">High</option>
                  <option value="Critical" className="bg-brand-card">Critical</option>
                </select>
              </div>

              {/* Sort by */}
              <div className="flex items-center bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 text-xs">
                <span className="text-slate-500 font-semibold mr-2">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent text-slate-300 font-bold outline-none cursor-pointer"
                >
                  <option value="newest" className="bg-brand-card">Newest First</option>
                  <option value="oldest" className="bg-brand-card">Oldest First</option>
                </select>
              </div>
            </div>
          </div>

          {/* Timeline Feed logs list */}
          <div className="space-y-4">
            <h3 className="text-md font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-primary" />
              {t.timelineList} ({sortedHistory.length})
            </h3>

            <div className="space-y-3">
              {sortedHistory.map((item, index) => {
                const date = item.timestamp ? new Date(item.timestamp).toLocaleString() : 'N/A'
                const conditions = item.predicted_conditions || []
                return (
                  <div
                    key={item._id || index}
                    className="p-5 rounded-2xl bg-slate-900/20 border border-slate-800 hover:border-slate-700/80 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
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
                        Classified Output: <span className="font-semibold text-brand-accent">{conditions[0]?.name || 'N/A'} ({conditions[0]?.probability || '0%'})</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      <button
                        onClick={() => {
                          setLatestPrediction(item)
                          setCurrentPage('results')
                        }}
                        className="px-3.5 py-2 rounded-lg text-xs font-bold bg-brand-primary/10 border border-brand-primary/30 hover:border-brand-primary text-brand-primary hover:text-white transition-all flex items-center gap-1"
                      >
                        {t.reviewBtn}
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteHistory(item._id)}
                        className="p-2 bg-slate-950 border border-slate-950 hover:border-red-500/30 text-slate-500 hover:text-red-400 hover:bg-red-950/20 rounded-lg transition-all"
                        title="Delete record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default HistoryAnalytics
