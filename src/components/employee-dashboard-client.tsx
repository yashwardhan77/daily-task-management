'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Logo from '@/components/logo'
import { submitTaskAction, logoutAction, getEmployeeLogsAction } from '@/lib/actions/tasks'
import { Employee, TaskLog } from '@/lib/actions/mockDb'
import {
  Clock, ClipboardList, LogOut, CheckCircle, AlertCircle,
  Check, LayoutDashboard, ChevronLeft, ChevronRight, Menu,
  CalendarDays, Plus, X, ListChecks, Sun, Sunset
} from 'lucide-react'

interface EmployeeDashboardClientProps {
  employee: Employee
  initialLogs: TaskLog[]
}

// ── Bullet Point Input ────────────────────────────────────────────────────────
function BulletInput({ points, setPoints, inputVal, setInputVal, placeholder, disabled, accent = 'sky' }: {
  points: string[]; setPoints: (p: string[]) => void
  inputVal: string; setInputVal: (v: string) => void
  placeholder: string; disabled: boolean; accent?: 'sky' | 'emerald' | 'amber'
}) {
  const add = () => { const t = inputVal.trim(); if (!t) return; setPoints([...points, t]); setInputVal('') }
  const colors = {
    sky:     { btn: 'bg-sky-800 hover:bg-sky-900', dot: 'text-sky-500', ring: 'focus:border-sky-400' },
    emerald: { btn: 'bg-emerald-800 hover:bg-emerald-900', dot: 'text-emerald-500', ring: 'focus:border-emerald-400' },
    amber:   { btn: 'bg-amber-700 hover:bg-amber-800', dot: 'text-amber-500', ring: 'focus:border-amber-400' },
  }[accent]

  return (
    <div className="flex flex-col gap-2">
      {points.length > 0 && (
        <ul className="flex flex-col gap-1">
          {points.map((p, i) => (
            <li key={i} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm group">
              <span className={`${colors.dot} font-black shrink-0 text-base leading-none`}>•</span>
              <span className="flex-1 text-slate-700 font-medium text-xs leading-snug">{p}</span>
              <button type="button" onClick={() => setPoints(points.filter((_, j) => j !== i))} disabled={disabled}
                className="text-slate-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 shrink-0">
                <X className="w-3 h-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <input type="text" value={inputVal} onChange={e => setInputVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder={placeholder} disabled={disabled}
          className={`flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none ${colors.ring} font-medium text-slate-800 placeholder-slate-400 disabled:bg-slate-50 transition-all`}
        />
        <button type="button" onClick={add} disabled={disabled || !inputVal.trim()}
          className={`${colors.btn} text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all disabled:opacity-40 cursor-pointer`}>
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      </div>
      <p className="text-[10px] text-slate-400">Press Enter or click Add for each task point</p>
    </div>
  )
}

// ── Description Renderer ──────────────────────────────────────────────────────
function RenderDescription({ text }: { text: string }) {
  const lines = text.split('\n').map(l => l.replace(/^[•\-\*]\s*/, '').trim()).filter(Boolean)
  if (lines.length <= 1 && !text.includes('•')) return <p className="text-xs text-slate-600 leading-relaxed">{text}</p>
  return (
    <ul className="flex flex-col gap-1">
      {lines.map((line, i) => (
        <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
          <span className="text-sky-400 font-black shrink-0">•</span>
          <span className="leading-relaxed">{line}</span>
        </li>
      ))}
    </ul>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function EmployeeDashboardClient({ employee, initialLogs }: EmployeeDashboardClientProps) {
  const router = useRouter()
  const [logs, setLogs] = useState<TaskLog[]>(initialLogs)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<'log' | 'history'>('log')

  const todayStr = new Date().toISOString().split('T')[0]
  const todayLog = logs.find(l => l.date === todayStr)

  const weeklyHours = logs.filter(l => {
    const diff = Math.ceil(Math.abs(new Date().getTime() - new Date(l.date).getTime()) / 86400000)
    return diff <= 7 && l.status !== 'Holiday'
  }).reduce((s, l) => s + l.hours, 0)

  const monthlyLogsCount = logs.filter(l => new Date(l.date).getMonth() === new Date().getMonth()).length

  const calendarDays = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    return { date: d, dateStr, log: logs.find(l => l.date === dateStr) }
  }).reverse()

  // Form state
  const [status, setStatus] = useState<'Full Day' | 'Half Day' | 'Holiday'>(() =>
    (todayLog?.status === 'Full Day' || todayLog?.status === 'Half Day' || todayLog?.status === 'Holiday') ? todayLog.status : 'Full Day'
  )
  const [halfDayPeriod, setHalfDayPeriod] = useState<'Before Lunch' | 'After Lunch'>(() =>
    todayLog?.status === 'Half Day' && todayLog.hoursBefore && todayLog.hoursBefore > 0 ? 'Before Lunch' : 'Before Lunch'
  )
  const [hoursBefore, setHoursBefore] = useState(() => todayLog?.hoursBefore ?? 4)
  const [hoursAfter, setHoursAfter] = useState(() => todayLog?.hoursAfter ?? 4)

  const parsePoints = (text?: string) => text ? text.split('\n').map(s => s.replace(/^[•\-\*]\s*/, '').trim()).filter(Boolean) : []
  const [beforePoints, setBeforePoints] = useState<string[]>(() => parsePoints(todayLog?.descriptionBefore))
  const [afterPoints, setAfterPoints] = useState<string[]>(() => parsePoints(todayLog?.descriptionAfter))
  const [holidayPoints, setHolidayPoints] = useState<string[]>(() => todayLog?.status === 'Holiday' ? parsePoints(todayLog.description) : [])
  const [beforeInput, setBeforeInput] = useState('')
  const [afterInput, setAfterInput] = useState('')
  const [holidayInput, setHolidayInput] = useState('')

  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [canSubmit, setCanSubmit] = useState(true)
  const [timeWarning, setTimeWarning] = useState<string | null>(null)

  React.useEffect(() => {
    const check = () => {
      if (new Date().getHours() >= 18) { setCanSubmit(false); setTimeWarning('Task submission closed at 6:00 PM.') }
      else { setCanSubmit(true); setTimeWarning(null) }
    }
    check(); const t = setInterval(check, 30000); return () => clearInterval(t)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setFeedback(null)
    let finalDesc = '', finalHours = 0, descBefore: string | undefined, descAfter: string | undefined, hB: number | undefined, hA: number | undefined

    if (status === 'Holiday') {
      if (!holidayPoints.length) { setFeedback({ type: 'error', message: 'Add at least one leave reason.' }); return }
      finalDesc = holidayPoints.map(p => `• ${p}`).join('\n')
    } else if (status === 'Full Day') {
      if (!beforePoints.length) { setFeedback({ type: 'error', message: 'Add at least one Before Lunch task.' }); return }
      if (!afterPoints.length) { setFeedback({ type: 'error', message: 'Add at least one After Lunch task.' }); return }
      descBefore = beforePoints.map(p => `• ${p}`).join('\n')
      descAfter = afterPoints.map(p => `• ${p}`).join('\n')
      finalDesc = `[Before Lunch]\n${descBefore}\n[After Lunch]\n${descAfter}`
      finalHours = hoursBefore + hoursAfter; hB = hoursBefore; hA = hoursAfter
    } else {
      if (halfDayPeriod === 'Before Lunch') {
        if (!beforePoints.length) { setFeedback({ type: 'error', message: 'Add at least one Before Lunch task.' }); return }
        descBefore = beforePoints.map(p => `• ${p}`).join('\n')
        finalDesc = `[Before Lunch]\n${descBefore}`; finalHours = hoursBefore; hB = hoursBefore
      } else {
        if (!afterPoints.length) { setFeedback({ type: 'error', message: 'Add at least one After Lunch task.' }); return }
        descAfter = afterPoints.map(p => `• ${p}`).join('\n')
        finalDesc = `[After Lunch]\n${descAfter}`; finalHours = hoursAfter; hA = hoursAfter
      }
    }

    setLoading(true)
    try {
      const res = await submitTaskAction(todayStr, status, finalDesc, finalHours, descBefore, descAfter, hB, hA)
      if (res.success) {
        setFeedback({ type: 'success', message: res.message })
        const r = await getEmployeeLogsAction(); if (r.success) setLogs(r.data)
      } else setFeedback({ type: 'error', message: res.message })
    } catch { setFeedback({ type: 'error', message: 'Something went wrong.' }) }
    finally { setLoading(false) }
  }

  const empInitials = employee.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="h-screen overflow-hidden bg-slate-100 flex">

      {/* Mobile overlay */}
      {mobileSidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileSidebarOpen(false)} />}

      {/* ── Sidebar ── */}
      <aside className={`fixed top-0 left-0 h-full z-50 flex flex-col bg-[#0c1a2e] text-white transition-all duration-300 shadow-2xl
        ${sidebarCollapsed ? 'w-16' : 'w-64'} ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>

        {/* Logo */}
        <div className={`flex items-center border-b border-white/8 shrink-0 ${sidebarCollapsed ? 'justify-center p-3' : 'gap-3 p-4'}`}>
          <Logo size={34} className="rounded-lg border border-white/20 bg-white shrink-0" />
          {!sidebarCollapsed && (
            <div className="overflow-hidden flex-1">
              <p className="text-[10px] font-black tracking-wide text-white whitespace-nowrap">विद्या भारती</p>
              <p className="text-[8px] text-amber-400 font-bold tracking-widest mt-0.5">EMPLOYEE PORTAL</p>
            </div>
          )}
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="hidden lg:flex p-1 rounded-lg hover:bg-white/10 cursor-pointer shrink-0">
            {sidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5 text-white/50" /> : <ChevronLeft className="w-3.5 h-3.5 text-white/50" />}
          </button>
        </div>

        {/* Employee pill */}
        {!sidebarCollapsed && (
          <div className="mx-3 mt-3 p-3 rounded-xl bg-white/8 border border-white/8 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400 flex items-center justify-center text-amber-900 font-black text-xs shrink-0">{empInitials}</div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate leading-none">{employee.name.split(' ').slice(0, 2).join(' ')}</p>
              <p className="text-[9px] text-white/40 font-semibold mt-0.5 truncate">{employee.id}</p>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 flex flex-col gap-1">
          {[
            { key: 'log' as const, icon: <LayoutDashboard className="w-4 h-4 shrink-0" />, label: 'Submit Daily Log' },
            { key: 'history' as const, icon: <ClipboardList className="w-4 h-4 shrink-0" />, label: 'History', badge: logs.length },
          ].map(({ key, icon, label, badge }) => (
            <button key={key} onClick={() => { setActiveSection(key); setMobileSidebarOpen(false) }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left cursor-pointer w-full ${sidebarCollapsed ? 'justify-center' : ''}
                ${activeSection === key ? 'bg-white/12 border border-white/10' : 'hover:bg-white/8'}`}>
              <span className={activeSection === key ? 'text-amber-400' : 'text-white/50'}>{icon}</span>
              {!sidebarCollapsed && <span className="text-xs font-semibold text-white flex-1">{label}</span>}
              {!sidebarCollapsed && badge !== undefined && badge > 0 && (
                <span className="bg-white/15 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{badge}</span>
              )}
            </button>
          ))}

          <div className="my-1 border-t border-white/8" />

          {/* Mini attendance dots */}
          {!sidebarCollapsed && (
            <>
              <div className="px-3 py-1 flex items-center gap-1.5">
                <CalendarDays className="w-3 h-3 text-white/30" />
                <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">This Week</span>
              </div>
              <div className="px-3 grid grid-cols-7 gap-1">
                {calendarDays.slice(-7).map(({ dateStr, log, date }) => {
                  const isToday = dateStr === todayStr
                  let dot = 'bg-white/20'
                  if (log?.status === 'Full Day') dot = 'bg-emerald-400'
                  else if (log?.status === 'Half Day') dot = 'bg-sky-400'
                  else if (log?.status === 'Holiday') dot = 'bg-amber-400'
                  else if (isToday) dot = 'bg-red-400 animate-pulse'
                  return (
                    <div key={dateStr} className="flex flex-col items-center gap-0.5" title={dateStr}>
                      <span className="text-[7px] text-white/30 font-bold">{date.toLocaleDateString('en-IN', { weekday: 'narrow' })}</span>
                      <div className={`w-5 h-5 rounded-full ${dot} flex items-center justify-center`}>
                        <span className="text-[7px] font-black text-white/90">{date.getDate()}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-white/8">
          <button onClick={async () => { await logoutAction('employee'); router.push('/'); router.refresh() }}
            className={`flex items-center gap-3 w-full px-3 py-2 rounded-xl hover:bg-red-500/15 transition-colors cursor-pointer ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <LogOut className="w-4 h-4 text-red-400 shrink-0" />
            {!sidebarCollapsed && <span className="text-xs font-semibold text-red-300">Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className={`flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>

        {/* Header */}
        <header className="shrink-0 bg-white/95 backdrop-blur border-b border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between px-4 sm:px-5 py-2.5">
            <div className="flex items-center gap-3">
              <button onClick={() => setMobileSidebarOpen(true)} className="lg:hidden p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer">
                <Menu className="w-5 h-5 text-slate-600" />
              </button>
              <div>
                <h2 className="text-sm font-black text-slate-800 tracking-tight leading-tight">
                  {activeSection === 'log' ? 'दैनिक कार्य प्रविष्टि' : 'पूर्व प्रविष्टियां'}
                </h2>
                <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">
                  {employee.name} · {employee.role}
                </p>
              </div>
            </div>

            {/* Compact stats in header */}
            <div className="hidden sm:flex items-center gap-1">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${
                todayLog ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-amber-50 border-amber-100 text-amber-700'}`}>
                {todayLog ? <Check className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                {todayLog ? `${todayLog.status} · Submitted` : 'Not submitted today'}
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border bg-sky-50 border-sky-100 text-sky-700">
                <Clock className="w-3.5 h-3.5" /> {weeklyHours}h week
              </div>
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border bg-violet-50 border-violet-100 text-violet-700">
                <ClipboardList className="w-3.5 h-3.5" /> {monthlyLogsCount} this month
              </div>
            </div>
          </div>
        </header>

        {/* ── Body — no page-level scroll ── */}
        <div className="flex-1 overflow-hidden flex flex-col p-3 sm:p-4 gap-3 min-h-0">

          {/* Compact 14-Day Attendance Strip */}
          <div className="shrink-0 bg-white rounded-2xl px-4 py-3 border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">14-Day Attendance</span>
              <div className="flex items-center gap-3 text-[8px] font-bold text-slate-400 uppercase tracking-wide">
                {[['bg-emerald-500', 'Full'], ['bg-sky-500', 'Half'], ['bg-amber-500', 'Leave'], ['bg-slate-300', 'Pending']].map(([c, l]) => (
                  <span key={l} className="flex items-center gap-1"><span className={`w-1.5 h-1.5 rounded-sm ${c}`} />{l}</span>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto">
              <div className="flex gap-1.5 min-w-max">
                {calendarDays.map(({ date: d, dateStr, log }) => {
                  const isToday = dateStr === todayStr
                  let bg = 'bg-slate-50 border-slate-200', dot = 'bg-slate-300', text = 'text-slate-400'
                  if (log?.status === 'Full Day')  { bg = 'bg-emerald-50 border-emerald-200'; dot = 'bg-emerald-500'; text = 'text-emerald-700' }
                  if (log?.status === 'Half Day')  { bg = 'bg-sky-50 border-sky-200'; dot = 'bg-sky-500'; text = 'text-sky-700' }
                  if (log?.status === 'Holiday')   { bg = 'bg-amber-50 border-amber-200'; dot = 'bg-amber-500'; text = 'text-amber-700' }
                  if (!log && isToday)             { bg = 'bg-red-50 border-red-300'; dot = 'bg-red-500 animate-pulse'; text = 'text-red-600' }
                  return (
                    <div key={dateStr} className={`border rounded-xl py-2 px-2.5 flex flex-col items-center gap-1 min-w-[46px] ${bg} ${isToday ? 'ring-2 ring-red-300 ring-offset-1' : ''}`}>
                      <span className={`text-[8px] font-extrabold uppercase ${text} opacity-70`}>{d.toLocaleDateString('en-IN', { weekday: 'short' })}</span>
                      <span className={`text-xs font-black leading-none ${text}`}>{d.getDate()}</span>
                      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Two-panel grid — fills remaining space, no page scroll */}
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3">

            {/* ── Form Panel ── */}
            <div className={`lg:col-span-7 min-h-0 flex flex-col overflow-hidden ${activeSection === 'history' ? 'hidden lg:flex' : 'flex'}`}>
              <div className="flex-1 min-h-0 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-y-auto">
                <div className="p-5 flex flex-col gap-4">

                  {/* Form header */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <ListChecks className="w-4 h-4 text-sky-600" />
                      <h3 className="font-bold text-slate-800 text-sm">Daily Task Entry</h3>
                    </div>
                    <span className="text-[10px] font-bold bg-slate-900 text-white px-2.5 py-1 rounded-lg">
                      {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  {/* Alerts */}
                  {timeWarning && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" /> {timeWarning}
                    </div>
                  )}
                  {feedback && (
                    <div className={`border p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                      feedback.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                      {feedback.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                      {feedback.message}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {/* Status */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Work Status</label>
                      <div className="grid grid-cols-3 gap-2">
                        {([
                          { val: 'Full Day' as const, emoji: '✅', color: 'emerald' },
                          { val: 'Half Day' as const, emoji: '🌤️', color: 'sky' },
                          { val: 'Holiday' as const, emoji: '🏖️', color: 'amber' },
                        ]).map(({ val, emoji, color }) => (
                          <button key={val} type="button" disabled={!canSubmit} onClick={() => { setStatus(val); setFeedback(null) }}
                            className={`py-3 rounded-2xl border-2 text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 disabled:opacity-50 ${
                              status === val
                                ? color === 'emerald' ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                                : color === 'sky' ? 'border-sky-500 bg-sky-50 text-sky-800'
                                : 'border-amber-500 bg-amber-50 text-amber-800'
                                : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-500'
                            }`}>
                            <span className="text-xl">{emoji}</span>
                            <span>{val}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Half day period */}
                    {status === 'Half Day' && (
                      <div className="flex gap-2">
                        {(['Before Lunch', 'After Lunch'] as const).map(p => (
                          <button key={p} type="button" disabled={!canSubmit} onClick={() => setHalfDayPeriod(p)}
                            className={`flex-1 py-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                              halfDayPeriod === p ? 'border-sky-400 bg-sky-50 text-sky-800' : 'border-slate-200 bg-white text-slate-500'}`}>
                            {p === 'Before Lunch' ? <Sun className="w-3.5 h-3.5" /> : <Sunset className="w-3.5 h-3.5" />} {p}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Holiday input */}
                    {status === 'Holiday' && (
                      <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/60 flex flex-col gap-3">
                        <span className="text-xs font-extrabold text-amber-900">🏖️ Reason for Leave</span>
                        <BulletInput points={holidayPoints} setPoints={setHolidayPoints} inputVal={holidayInput} setInputVal={setHolidayInput}
                          placeholder="e.g. Medical leave, family function..." disabled={!canSubmit} accent="amber" />
                      </div>
                    )}

                    {/* Before Lunch */}
                    {status !== 'Holiday' && (status === 'Full Day' || (status === 'Half Day' && halfDayPeriod === 'Before Lunch')) && (
                      <div className="p-4 bg-sky-50/50 rounded-2xl border border-sky-200/60 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-sky-900 flex items-center gap-1.5"><Sun className="w-3.5 h-3.5" /> Before Lunch</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-slate-500">Hours:</span>
                            <input type="number" min={0.5} max={6} step={0.5} disabled={!canSubmit} value={hoursBefore}
                              onChange={e => setHoursBefore(parseFloat(e.target.value) || 0)}
                              className="w-14 px-2 py-1 border border-slate-200 rounded-lg text-xs font-bold text-center focus:outline-none focus:border-sky-400 bg-white" />
                          </div>
                        </div>
                        <BulletInput points={beforePoints} setPoints={setBeforePoints} inputVal={beforeInput} setInputVal={setBeforeInput}
                          placeholder="e.g. Conducted morning assembly..." disabled={!canSubmit} accent="sky" />
                      </div>
                    )}

                    {/* After Lunch */}
                    {status !== 'Holiday' && (status === 'Full Day' || (status === 'Half Day' && halfDayPeriod === 'After Lunch')) && (
                      <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200/60 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-emerald-900 flex items-center gap-1.5"><Sunset className="w-3.5 h-3.5" /> After Lunch</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-slate-500">Hours:</span>
                            <input type="number" min={0.5} max={6} step={0.5} disabled={!canSubmit} value={hoursAfter}
                              onChange={e => setHoursAfter(parseFloat(e.target.value) || 0)}
                              className="w-14 px-2 py-1 border border-slate-200 rounded-lg text-xs font-bold text-center focus:outline-none focus:border-emerald-400 bg-white" />
                          </div>
                        </div>
                        <BulletInput points={afterPoints} setPoints={setAfterPoints} inputVal={afterInput} setInputVal={setAfterInput}
                          placeholder="e.g. Supervised student activities..." disabled={!canSubmit} accent="emerald" />
                      </div>
                    )}

                    <button type="submit" disabled={loading || !canSubmit}
                      className="w-full py-3 rounded-2xl bg-[#0c1a2e] hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-widest shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2">
                      {loading
                        ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                        : todayLog ? '✏️  Update Log Entry' : '✅  Submit Log Entry'}
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* ── History Panel ── */}
            <div className={`lg:col-span-5 min-h-0 flex flex-col overflow-hidden ${activeSection === 'log' ? 'hidden lg:flex' : 'flex'}`}>
              <div className="flex-1 min-h-0 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-y-auto">
                <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-slate-100 px-5 py-3.5 flex items-center justify-between z-10">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-slate-500" />
                    <h3 className="font-bold text-slate-800 text-sm">History</h3>
                  </div>
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">{logs.length} entries</span>
                </div>

                <div className="p-4 flex flex-col gap-3">
                  {logs.length === 0 ? (
                    <div className="text-center py-16 flex flex-col items-center gap-3 text-slate-400">
                      <ClipboardList className="w-10 h-10 stroke-1" />
                      <p className="text-xs font-semibold">No logs submitted yet.</p>
                    </div>
                  ) : (
                    logs.map(log => {
                      const fDate = new Date(log.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })
                      const sc: Record<string, string> = {
                        'Full Day': 'bg-emerald-100 text-emerald-800', 'Half Day': 'bg-sky-100 text-sky-800',
                        'Holiday': 'bg-amber-100 text-amber-800', 'Pending': 'bg-slate-100 text-slate-600'
                      }
                      return (
                        <div key={log.id} className="p-4 rounded-2xl border border-slate-200/80 hover:border-slate-300 hover:shadow-sm transition-all bg-slate-50/50 flex flex-col gap-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-xs font-extrabold text-slate-800">{fDate}</p>
                              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{log.hours} hrs</p>
                            </div>
                            <span className={`text-[9px] uppercase tracking-wider font-extrabold px-2 py-1 rounded-lg shrink-0 ${sc[log.status]}`}>{log.status}</span>
                          </div>
                          <div className="border-t border-slate-100 pt-2 flex flex-col gap-2">
                            {log.descriptionBefore && (
                              <div>
                                <p className="text-[8px] font-extrabold text-sky-700 uppercase tracking-wide mb-1 flex items-center gap-1"><Sun className="w-2.5 h-2.5" /> Before Lunch</p>
                                <RenderDescription text={log.descriptionBefore} />
                              </div>
                            )}
                            {log.descriptionAfter && (
                              <div>
                                <p className="text-[8px] font-extrabold text-emerald-700 uppercase tracking-wide mb-1 flex items-center gap-1"><Sunset className="w-2.5 h-2.5" /> After Lunch</p>
                                <RenderDescription text={log.descriptionAfter} />
                              </div>
                            )}
                            {!log.descriptionBefore && !log.descriptionAfter && log.description && <RenderDescription text={log.description} />}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
