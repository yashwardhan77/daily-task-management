'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Logo from '@/components/logo'
import { submitTaskAction, logoutAction, getEmployeeLogsAction } from '@/lib/actions/tasks'
import { Employee, TaskLog } from '@/lib/actions/mockDb'
import {
  Clock,
  ClipboardList,
  LogOut,
  CheckCircle,
  AlertCircle,
  Briefcase,
  Check,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  Menu,
  CalendarDays,
  User,
  Plus,
  X,
  ListChecks,
  Sun,
  Sunset
} from 'lucide-react'

interface EmployeeDashboardClientProps {
  employee: Employee
  initialLogs: TaskLog[]
}

// ── Bullet Point Input Component ──────────────────────────────────────────────
function BulletInput({
  points,
  setPoints,
  inputVal,
  setInputVal,
  placeholder,
  disabled,
  accentColor = 'sky',
}: {
  points: string[]
  setPoints: (p: string[]) => void
  inputVal: string
  setInputVal: (v: string) => void
  placeholder: string
  disabled: boolean
  accentColor?: 'sky' | 'emerald' | 'amber'
}) {
  const addPoint = () => {
    const trimmed = inputVal.trim()
    if (!trimmed) return
    setPoints([...points, trimmed])
    setInputVal('')
  }

  const colorMap = {
    sky:     { btn: 'bg-sky-800 hover:bg-sky-900', dot: 'text-sky-500', border: 'focus:border-sky-500', ring: 'focus:ring-sky-500/20' },
    emerald: { btn: 'bg-emerald-800 hover:bg-emerald-900', dot: 'text-emerald-500', border: 'focus:border-emerald-500', ring: 'focus:ring-emerald-500/20' },
    amber:   { btn: 'bg-amber-700 hover:bg-amber-800', dot: 'text-amber-500', border: 'focus:border-amber-500', ring: 'focus:ring-amber-500/20' },
  }
  const c = colorMap[accentColor]

  return (
    <div className="flex flex-col gap-2">
      {points.length > 0 && (
        <ul className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-0.5">
          {points.map((p, i) => (
            <li
              key={i}
              className="flex items-start gap-2 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 font-medium shadow-sm group"
            >
              <span className={`${c.dot} font-black mt-0.5 text-base leading-none shrink-0`}>•</span>
              <span className="flex-1 leading-snug">{p}</span>
              <button
                type="button"
                onClick={() => setPoints(points.filter((_, j) => j !== i))}
                disabled={disabled}
                className="text-slate-300 hover:text-red-400 transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                aria-label="Remove"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addPoint() } }}
          placeholder={placeholder}
          disabled={disabled}
          className={`flex-1 px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none ${c.border} focus:ring-2 ${c.ring} font-medium text-slate-800 placeholder-slate-400 disabled:bg-slate-50 disabled:text-slate-400 transition-all`}
        />
        <button
          type="button"
          onClick={addPoint}
          disabled={disabled || !inputVal.trim()}
          className={`${c.btn} text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer shadow-sm`}
        >
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      </div>

      <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
        <ListChecks className="w-3 h-3" />
        Press Enter or click Add for each task point
      </p>
    </div>
  )
}

// ── Description renderer (bullets → styled list) ──────────────────────────────
function RenderDescription({ text }: { text: string }) {
  const lines = text.split('\n').map(l => l.replace(/^[•\-\*]\s*/, '').trim()).filter(Boolean)
  if (lines.length <= 1 && !text.includes('•')) {
    return <p className="text-xs text-slate-600 leading-relaxed font-medium">{text}</p>
  }
  return (
    <ul className="flex flex-col gap-1">
      {lines.map((line, i) => (
        <li key={i} className="text-xs text-slate-600 font-medium flex items-start gap-2">
          <span className="text-sky-400 font-black mt-0.5 shrink-0">•</span>
          <span className="leading-relaxed">{line}</span>
        </li>
      ))}
    </ul>
  )
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function EmployeeDashboardClient({
  employee,
  initialLogs
}: EmployeeDashboardClientProps) {
  const router = useRouter()
  const [logs, setLogs] = useState<TaskLog[]>(initialLogs)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<'log' | 'history'>('log')

  const todayStr = new Date().toISOString().split('T')[0]
  const todayLog = logs.find((l) => l.date === todayStr)

  // Stats
  const weeklyHours = logs
    .filter((l) => {
      const diffDays = Math.ceil(Math.abs(new Date().getTime() - new Date(l.date).getTime()) / (1000 * 60 * 60 * 24))
      return diffDays <= 7 && l.status !== 'Holiday'
    })
    .reduce((sum, l) => sum + l.hours, 0)

  const currentMonth = new Date().getMonth()
  const monthlyLogsCount = logs.filter((l) => new Date(l.date).getMonth() === currentMonth).length

  const calendarDays = Array.from({ length: 14 }).map((_, index) => {
    const d = new Date()
    d.setDate(d.getDate() - index)
    const dateStr = d.toISOString().split('T')[0]
    return { date: d, dateStr, log: logs.find((l) => l.date === dateStr) }
  }).reverse()

  // Form state
  const [status, setStatus] = useState<'Full Day' | 'Half Day' | 'Holiday'>(() => {
    if (todayLog?.status === 'Full Day' || todayLog?.status === 'Half Day' || todayLog?.status === 'Holiday') return todayLog.status
    return 'Full Day'
  })
  const [halfDayPeriod, setHalfDayPeriod] = useState<'Before Lunch' | 'After Lunch'>(() => {
    if (todayLog?.status === 'Half Day') return todayLog.hoursBefore && todayLog.hoursBefore > 0 ? 'Before Lunch' : 'After Lunch'
    return 'Before Lunch'
  })
  const [hoursBefore, setHoursBefore] = useState<number>(() => todayLog?.hoursBefore ?? 4)
  const [hoursAfter, setHoursAfter] = useState<number>(() => todayLog?.hoursAfter ?? 4)

  // Bullet point states
  const parsePoints = (text?: string) =>
    text ? text.split('\n').map(s => s.replace(/^[•\-\*]\s*/, '').trim()).filter(Boolean) : []

  const [beforePoints, setBeforePoints] = useState<string[]>(() => parsePoints(todayLog?.descriptionBefore))
  const [afterPoints, setAfterPoints] = useState<string[]>(() => parsePoints(todayLog?.descriptionAfter))
  const [holidayPoints, setHolidayPoints] = useState<string[]>(() =>
    todayLog?.status === 'Holiday' ? parsePoints(todayLog.description) : []
  )
  const [beforeInput, setBeforeInput] = useState('')
  const [afterInput, setAfterInput] = useState('')
  const [holidayInput, setHolidayInput] = useState('')

  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [canSubmit, setCanSubmit] = useState(true)
  const [timeWarning, setTimeWarning] = useState<string | null>(null)

  React.useEffect(() => {
    const checkTimeLimit = () => {
      const now = new Date()
      if (now.getHours() >= 18) {
        setCanSubmit(false)
        setTimeWarning('Task submission and editing for today closed at 6:00 PM.')
      } else {
        setCanSubmit(true)
        setTimeWarning(null)
      }
    }
    checkTimeLimit()
    const timer = setInterval(checkTimeLimit, 30000)
    return () => clearInterval(timer)
  }, [])

  const handleStatusChange = (newStatus: 'Full Day' | 'Half Day' | 'Holiday') => {
    setStatus(newStatus)
    setFeedback(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFeedback(null)

    let finalDesc = ''
    let finalHours = 0
    let descBefore: string | undefined
    let descAfter: string | undefined
    let hBefore: number | undefined
    let hAfter: number | undefined

    if (status === 'Holiday') {
      if (holidayPoints.length === 0) {
        setFeedback({ type: 'error', message: 'Please add at least one reason for Holiday / Leave.' })
        return
      }
      finalDesc = holidayPoints.map(p => `• ${p}`).join('\n')
      finalHours = 0
    } else if (status === 'Full Day') {
      if (beforePoints.length === 0) {
        setFeedback({ type: 'error', message: 'Please add at least one task for Before Lunch.' })
        return
      }
      if (afterPoints.length === 0) {
        setFeedback({ type: 'error', message: 'Please add at least one task for After Lunch.' })
        return
      }
      descBefore = beforePoints.map(p => `• ${p}`).join('\n')
      descAfter = afterPoints.map(p => `• ${p}`).join('\n')
      finalDesc = `[Before Lunch]\n${descBefore}\n[After Lunch]\n${descAfter}`
      finalHours = hoursBefore + hoursAfter
      hBefore = hoursBefore
      hAfter = hoursAfter
    } else if (status === 'Half Day') {
      if (halfDayPeriod === 'Before Lunch') {
        if (beforePoints.length === 0) {
          setFeedback({ type: 'error', message: 'Please add at least one task for Before Lunch.' })
          return
        }
        descBefore = beforePoints.map(p => `• ${p}`).join('\n')
        finalDesc = `[Before Lunch]\n${descBefore}`
        finalHours = hoursBefore
        hBefore = hoursBefore
      } else {
        if (afterPoints.length === 0) {
          setFeedback({ type: 'error', message: 'Please add at least one task for After Lunch.' })
          return
        }
        descAfter = afterPoints.map(p => `• ${p}`).join('\n')
        finalDesc = `[After Lunch]\n${descAfter}`
        finalHours = hoursAfter
        hAfter = hoursAfter
      }
    }

    setLoading(true)
    try {
      const res = await submitTaskAction(todayStr, status, finalDesc, finalHours, descBefore, descAfter, hBefore, hAfter)
      if (res.success) {
        setFeedback({ type: 'success', message: res.message })
        const refreshedLogs = await getEmployeeLogsAction()
        if (refreshedLogs.success) setLogs(refreshedLogs.data)
      } else {
        setFeedback({ type: 'error', message: res.message })
      }
    } catch (err) {
      console.error(err)
      setFeedback({ type: 'error', message: 'Something went wrong. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await logoutAction('employee')
    router.push('/')
    router.refresh()
  }

  const empInitials = employee.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex">

      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`
        fixed top-0 left-0 h-full z-50 flex flex-col bg-[#0c1a2e] text-white
        transition-all duration-300 ease-in-out shadow-2xl
        ${sidebarCollapsed ? 'w-16' : 'w-64'}
        ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>

        {/* Sidebar header */}
        <div className={`flex items-center border-b border-white/8 shrink-0 ${sidebarCollapsed ? 'justify-center p-3' : 'gap-3 p-4'}`}>
          <Logo size={36} className="rounded-lg border border-white/20 bg-white shrink-0" />
          {!sidebarCollapsed && (
            <div className="overflow-hidden">
              <h1 className="text-xs font-black tracking-wide leading-none text-white whitespace-nowrap">विद्या भारती</h1>
              <p className="text-[9px] text-amber-400 font-bold tracking-widest mt-0.5 whitespace-nowrap">EMPLOYEE PORTAL</p>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex ml-auto p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          >
            {sidebarCollapsed
              ? <ChevronRight className="w-4 h-4 text-white/50" />
              : <ChevronLeft className="w-4 h-4 text-white/50" />
            }
          </button>
        </div>

        {/* Employee pill */}
        {!sidebarCollapsed && (
          <div className="mx-3 mt-4 p-3 rounded-2xl bg-white/8 border border-white/8 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-400 flex items-center justify-center text-amber-900 font-black text-sm shrink-0 shadow-sm">
              {empInitials}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate leading-none">{employee.name.split(' ').slice(0, 2).join(' ')}</p>
              <p className="text-[9px] text-white/40 font-semibold mt-0.5 truncate">{employee.id} · {employee.role.split(' ').slice(0, 2).join(' ')}</p>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 flex flex-col gap-1 overflow-y-auto">
          <button
            onClick={() => { setActiveSection('log'); setMobileSidebarOpen(false) }}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left cursor-pointer w-full ${
              activeSection === 'log' ? 'bg-white/12 border border-white/10 shadow-sm' : 'hover:bg-white/8'
            } ${sidebarCollapsed ? 'justify-center' : ''}`}
          >
            <LayoutDashboard className={`w-4 h-4 shrink-0 ${activeSection === 'log' ? 'text-amber-400' : 'text-white/50'}`} />
            {!sidebarCollapsed && <span className="text-xs font-semibold text-white">Submit Daily Log</span>}
          </button>

          <button
            onClick={() => { setActiveSection('history'); setMobileSidebarOpen(false) }}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left cursor-pointer w-full ${
              activeSection === 'history' ? 'bg-white/12 border border-white/10 shadow-sm' : 'hover:bg-white/8'
            } ${sidebarCollapsed ? 'justify-center' : ''}`}
          >
            <ClipboardList className={`w-4 h-4 shrink-0 ${activeSection === 'history' ? 'text-amber-400' : 'text-white/50'}`} />
            {!sidebarCollapsed && (
              <>
                <span className="text-xs font-semibold text-white flex-1">History</span>
                {logs.length > 0 && (
                  <span className="bg-white/15 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">{logs.length}</span>
                )}
              </>
            )}
          </button>

          <div className="my-2 border-t border-white/8" />

          {/* Attendance mini strip in sidebar */}
          <div className={`flex items-center gap-2 px-3 py-1 ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <CalendarDays className="w-3.5 h-3.5 text-white/30 shrink-0" />
            {!sidebarCollapsed && <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Attendance</span>}
          </div>

          {!sidebarCollapsed && (
            <div className="px-3 grid grid-cols-7 gap-1">
              {calendarDays.slice(-7).map(({ dateStr, log, date }) => {
                const isToday = dateStr === todayStr
                let dotColor = 'bg-white/20'
                if (log?.status === 'Full Day') dotColor = 'bg-emerald-400'
                else if (log?.status === 'Half Day') dotColor = 'bg-sky-400'
                else if (log?.status === 'Holiday') dotColor = 'bg-amber-400'
                else if (isToday) dotColor = 'bg-red-400 animate-pulse'
                return (
                  <div key={dateStr} className="flex flex-col items-center gap-1" title={dateStr}>
                    <span className="text-[8px] text-white/30 font-bold">{date.toLocaleDateString('en-IN', { weekday: 'narrow' })}</span>
                    <div className={`w-5 h-5 rounded-full ${dotColor} flex items-center justify-center`}>
                      <span className="text-[7px] font-black text-white/90">{date.getDate()}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-white/8">
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-red-500/15 transition-colors cursor-pointer ${sidebarCollapsed ? 'justify-center' : ''}`}
          >
            <LogOut className="w-4 h-4 text-red-400 shrink-0" />
            {!sidebarCollapsed && <span className="text-xs font-semibold text-red-300">Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>

        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3">
            <div className="flex items-center gap-3">
              <button onClick={() => setMobileSidebarOpen(true)} className="lg:hidden p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer">
                <Menu className="w-5 h-5 text-slate-600" />
              </button>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-800 tracking-tight leading-tight">
                  {activeSection === 'log' ? 'दैनिक कार्य प्रविष्टि' : 'पूर्व प्रविष्टियां'}
                </h2>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  {activeSection === 'log' ? 'Submit your daily task log' : 'Your submission history'}
                </p>
              </div>
            </div>

            <div className={`hidden sm:flex items-center gap-2 rounded-xl px-4 py-2 border text-xs font-bold ${
              todayLog ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-amber-50 border-amber-100 text-amber-800'
            }`}>
              {todayLog ? <Check className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
              {todayLog ? `Submitted · ${todayLog.status}` : 'Not submitted today'}
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 py-6 flex flex-col gap-6 max-w-7xl w-full mx-auto">

          {/* ── Stats row ── */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 animate-fade-in-up">
            {[
              {
                label: "Today's Status", value: todayLog ? todayLog.status : 'Pending',
                sub: todayLog ? `Submitted at ${new Date(todayLog.submittedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : 'Due before 6:00 PM',
                accent: todayLog ? 'bg-emerald-500' : 'bg-amber-500',
                icon: todayLog ? <Check className="w-5 h-5" /> : <Clock className="w-5 h-5" />,
                iconBg: todayLog ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600 animate-pulse',
              },
              {
                label: 'Weekly Hours', value: `${weeklyHours} Hrs`, sub: 'Active hrs — last 7 days',
                accent: 'bg-sky-500', icon: <Clock className="w-5 h-5" />, iconBg: 'bg-sky-50 text-sky-600',
              },
              {
                label: 'Monthly Logs', value: `${monthlyLogsCount} Days`, sub: 'Logs this month',
                accent: 'bg-violet-500', icon: <ClipboardList className="w-5 h-5" />, iconBg: 'bg-violet-50 text-violet-600',
              },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex items-center justify-between relative overflow-hidden hover:shadow-md transition-all">
                <div className={`absolute left-0 top-0 h-full w-1 ${stat.accent} rounded-l-2xl`} />
                <div className="pl-3 flex flex-col gap-0.5 min-w-0">
                  <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">{stat.label}</span>
                  <h4 className="text-sm sm:text-lg font-black text-slate-800 leading-tight truncate">{stat.value}</h4>
                  <span className="text-[10px] font-semibold text-slate-500 hidden sm:block">{stat.sub}</span>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${stat.iconBg}`}>{stat.icon}</div>
              </div>
            ))}
          </div>

          {/* ── 14-Day Attendance Strip ── */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">उपस्थिति विवरण — 14 Day Attendance</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Your task presence for the last 2 weeks</p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[9px] font-bold tracking-wider uppercase text-slate-400">
                {[
                  { color: 'bg-emerald-500', label: 'Full Day' },
                  { color: 'bg-sky-500', label: 'Half Day' },
                  { color: 'bg-amber-500', label: 'Holiday' },
                  { color: 'bg-slate-300', label: 'Pending' },
                ].map(l => (
                  <span key={l.label} className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-sm ${l.color}`} /> {l.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Horizontal scrollable strip */}
            <div className="overflow-x-auto pb-1 -mx-1 px-1">
              <div className="flex gap-2 min-w-max">
                {calendarDays.map(({ date: dayDate, dateStr, log }) => {
                  const isToday = dateStr === todayStr
                  const dayShort = dayDate.toLocaleDateString('en-IN', { weekday: 'short' }) // Mon, Tue, Wed
                  const dateNum = dayDate.getDate()
                  const monthShort = dayDate.toLocaleDateString('en-IN', { month: 'short' })

                  let bgClass = 'bg-slate-50 border-slate-200 text-slate-400'
                  let dotClass = 'bg-slate-300'
                  let textClass = 'text-slate-400'
                  if (log) {
                    if (log.status === 'Full Day') {
                      bgClass = 'bg-emerald-50 border-emerald-200'; dotClass = 'bg-emerald-500'; textClass = 'text-emerald-700'
                    } else if (log.status === 'Half Day') {
                      bgClass = 'bg-sky-50 border-sky-200'; dotClass = 'bg-sky-500'; textClass = 'text-sky-700'
                    } else if (log.status === 'Holiday') {
                      bgClass = 'bg-amber-50 border-amber-200'; dotClass = 'bg-amber-500'; textClass = 'text-amber-700'
                    }
                  } else if (isToday) {
                    bgClass = 'bg-red-50 border-red-300 animate-pulse'; dotClass = 'bg-red-500'; textClass = 'text-red-700'
                  }

                  return (
                    <div
                      key={dateStr}
                      className={`border rounded-xl py-3 px-2 flex flex-col items-center gap-1.5 text-center min-w-[56px] transition-all hover:scale-105 hover:shadow-sm ${bgClass} ${isToday ? 'ring-2 ring-offset-1 ring-red-300' : ''}`}
                    >
                      <span className={`text-[9px] font-extrabold uppercase tracking-wide ${textClass}`}>{dayShort}</span>
                      <span className={`text-base font-black leading-none ${textClass}`}>{dateNum}</span>
                      <span className={`text-[8px] font-semibold opacity-60 ${textClass}`}>{monthShort}</span>
                      <span className={`w-2 h-2 rounded-full ${dotClass} mt-0.5`} />
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ── Two Column Layout ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Log Form */}
            <div className={`lg:col-span-7 flex flex-col gap-5 ${activeSection === 'history' ? 'hidden lg:flex' : 'flex'}`}>

              {/* Profile Card */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 via-sky-500 to-violet-500" />
                <div className="flex items-center gap-4 pt-1">
                  <div className="w-12 h-12 rounded-2xl bg-[#0c1a2e] flex items-center justify-center text-white font-black text-base shrink-0 shadow-md">
                    {empInitials}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-800 leading-tight">{employee.name}</h2>
                    <p className="text-xs font-semibold text-slate-400 mt-0.5 flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-amber-500" />
                      {employee.role} · {employee.id}
                    </p>
                  </div>
                </div>
              </div>

              {/* Form Card */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col gap-5">
                <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ListChecks className="w-5 h-5 text-sky-600" />
                    <h3 className="font-bold text-slate-800 text-base">दैनिक कार्य प्रविष्टि</h3>
                  </div>
                  <span className="text-[10px] font-bold bg-slate-900 text-white px-3 py-1 rounded-lg">
                    {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', weekday: 'short' })}
                  </span>
                </div>

                {timeWarning && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3.5 rounded-xl text-xs font-semibold flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>{timeWarning}</span>
                  </div>
                )}

                {feedback && (
                  <div className={`border p-3.5 rounded-xl text-xs font-semibold flex items-start gap-2.5 ${
                    feedback.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
                  }`}>
                    {feedback.type === 'success'
                      ? <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      : <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    }
                    <span>{feedback.message}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                  {/* Status selector */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-600 tracking-wide uppercase">Work Status</label>
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        { val: 'Full Day', color: 'emerald', emoji: '✅' },
                        { val: 'Half Day', color: 'sky', emoji: '🌤️' },
                        { val: 'Holiday', color: 'amber', emoji: '🏖️' },
                      ] as const).map(({ val, emoji }) => (
                        <button
                          key={val}
                          type="button"
                          disabled={!canSubmit}
                          onClick={() => handleStatusChange(val)}
                          className={`py-3.5 px-2 rounded-2xl border-2 text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1.5 disabled:opacity-50 ${
                            status === val
                              ? val === 'Full Day' ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm'
                              : val === 'Half Day' ? 'border-sky-500 bg-sky-50 text-sky-800 shadow-sm'
                              : 'border-amber-500 bg-amber-50 text-amber-800 shadow-sm'
                              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:border-slate-300'
                          }`}
                        >
                          <span className="text-lg">{emoji}</span>
                          <span>{val}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Half Day period */}
                  {status === 'Half Day' && (
                    <div className="flex flex-col gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Working Session</label>
                      <div className="grid grid-cols-2 gap-2">
                        {(['Before Lunch', 'After Lunch'] as const).map(p => (
                          <button
                            key={p}
                            type="button"
                            disabled={!canSubmit}
                            onClick={() => setHalfDayPeriod(p)}
                            className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                              halfDayPeriod === p ? 'border-sky-500 bg-sky-100/60 text-sky-800' : 'border-slate-200 bg-white text-slate-500'
                            }`}
                          >
                            {p === 'Before Lunch' ? <Sun className="w-3.5 h-3.5" /> : <Sunset className="w-3.5 h-3.5" />}
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Holiday points */}
                  {status === 'Holiday' && (
                    <div className="flex flex-col gap-3 p-4 bg-amber-50/60 rounded-2xl border border-amber-200/60">
                      <div className="flex items-center justify-between border-b border-amber-200/50 pb-2">
                        <span className="text-xs font-extrabold text-amber-900 flex items-center gap-2">
                          🏖️ Reason for Leave
                        </span>
                      </div>
                      <BulletInput
                        points={holidayPoints}
                        setPoints={setHolidayPoints}
                        inputVal={holidayInput}
                        setInputVal={setHolidayInput}
                        placeholder="e.g. Medical leave, family function, gazetted holiday..."
                        disabled={!canSubmit}
                        accentColor="amber"
                      />
                    </div>
                  )}

                  {/* Before Lunch */}
                  {status !== 'Holiday' && (status === 'Full Day' || (status === 'Half Day' && halfDayPeriod === 'Before Lunch')) && (
                    <div className="flex flex-col gap-3 p-4 bg-sky-50/50 rounded-2xl border border-sky-200/60">
                      <div className="flex items-center justify-between border-b border-sky-200/50 pb-2">
                        <span className="text-xs font-extrabold text-sky-900 flex items-center gap-2">
                          <Sun className="w-3.5 h-3.5" /> Before Lunch (भोजन से पहले)
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-500">Hours:</span>
                          <input
                            type="number" min={0.5} max={6} step={0.5} disabled={!canSubmit}
                            value={hoursBefore}
                            onChange={e => setHoursBefore(parseFloat(e.target.value) || 0)}
                            className="w-16 px-2 py-1 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-sky-500 text-center bg-white"
                          />
                        </div>
                      </div>
                      <BulletInput
                        points={beforePoints}
                        setPoints={setBeforePoints}
                        inputVal={beforeInput}
                        setInputVal={setBeforeInput}
                        placeholder="e.g. Conducted morning assembly..."
                        disabled={!canSubmit}
                        accentColor="sky"
                      />
                    </div>
                  )}

                  {/* After Lunch */}
                  {status !== 'Holiday' && (status === 'Full Day' || (status === 'Half Day' && halfDayPeriod === 'After Lunch')) && (
                    <div className="flex flex-col gap-3 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200/60">
                      <div className="flex items-center justify-between border-b border-emerald-200/50 pb-2">
                        <span className="text-xs font-extrabold text-emerald-900 flex items-center gap-2">
                          <Sunset className="w-3.5 h-3.5" /> After Lunch (भोजन के बाद)
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-500">Hours:</span>
                          <input
                            type="number" min={0.5} max={6} step={0.5} disabled={!canSubmit}
                            value={hoursAfter}
                            onChange={e => setHoursAfter(parseFloat(e.target.value) || 0)}
                            className="w-16 px-2 py-1 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 text-center bg-white"
                          />
                        </div>
                      </div>
                      <BulletInput
                        points={afterPoints}
                        setPoints={setAfterPoints}
                        inputVal={afterInput}
                        setInputVal={setAfterInput}
                        placeholder="e.g. Supervised student activities..."
                        disabled={!canSubmit}
                        accentColor="emerald"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !canSubmit}
                    className="w-full py-3.5 rounded-2xl bg-[#0c1a2e] hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-widest shadow-lg hover:shadow-xl transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</span>
                    ) : (
                      <span className="flex items-center gap-2">
                        {todayLog ? '✏️ Update Log Entry' : '✅ Submit Log Entry'}
                      </span>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* History Panel */}
            <div className={`lg:col-span-5 flex flex-col gap-5 ${activeSection === 'log' ? 'hidden lg:flex' : 'flex'}`}>
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col gap-4">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-slate-500" />
                    <h3 className="font-bold text-slate-800 text-base">पूर्व प्रविष्टियां</h3>
                  </div>
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                    {logs.length} entries
                  </span>
                </div>

                {logs.length === 0 ? (
                  <div className="text-center py-16 flex flex-col items-center gap-3 text-slate-400">
                    <ClipboardList className="w-10 h-10 stroke-1" />
                    <p className="text-xs font-semibold">No logs submitted yet.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 max-h-[600px] overflow-y-auto pr-0.5">
                    {logs.map((log) => {
                      const formattedDate = new Date(log.date + 'T00:00:00').toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric', weekday: 'long'
                      })
                      const statusColors = {
                        'Full Day': 'bg-emerald-100 text-emerald-800 border-emerald-200',
                        'Half Day': 'bg-sky-100 text-sky-800 border-sky-200',
                        'Holiday': 'bg-amber-100 text-amber-800 border-amber-200',
                        'Pending': 'bg-slate-100 text-slate-600 border-slate-200',
                      }
                      return (
                        <div
                          key={log.id}
                          className="p-4 rounded-2xl border border-slate-200/80 hover:border-slate-300 hover:shadow-sm transition-all bg-slate-50/50 flex flex-col gap-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-xs font-extrabold text-slate-800 leading-tight">{formattedDate}</p>
                              <p className="text-[10px] text-slate-400 font-semibold mt-0.5 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {log.hours} hrs · {new Date(log.submittedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            <span className={`text-[9px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-lg border shrink-0 ${statusColors[log.status]}`}>
                              {log.status}
                            </span>
                          </div>
                          <div className="border-t border-slate-100 pt-2">
                            {log.descriptionBefore && (
                              <div className="mb-2">
                                <p className="text-[9px] uppercase font-extrabold text-sky-700 mb-1 flex items-center gap-1"><Sun className="w-2.5 h-2.5" /> Before Lunch</p>
                                <RenderDescription text={log.descriptionBefore} />
                              </div>
                            )}
                            {log.descriptionAfter && (
                              <div className="mb-2">
                                <p className="text-[9px] uppercase font-extrabold text-emerald-700 mb-1 flex items-center gap-1"><Sunset className="w-2.5 h-2.5" /> After Lunch</p>
                                <RenderDescription text={log.descriptionAfter} />
                              </div>
                            )}
                            {!log.descriptionBefore && !log.descriptionAfter && log.description && (
                              <RenderDescription text={log.description} />
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

          </div>
        </main>

        <footer className="bg-white border-t border-slate-200/80 py-4 text-center text-slate-400 text-xs">
          <p>© {new Date().getFullYear()} विद्या भारती सेवाधाम। सर्वाधिकार सुरक्षित।</p>
        </footer>
      </div>
    </div>
  )
}
