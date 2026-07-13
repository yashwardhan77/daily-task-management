'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Logo from '@/components/logo'
import { submitTaskAction, logoutAction, getEmployeeLogsAction } from '@/lib/actions/tasks'
import { Employee, TaskLog } from '@/lib/actions/mockDb'
import {
  Clock,
  ClipboardList,
  FileText,
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
  User
} from 'lucide-react'

interface EmployeeDashboardClientProps {
  employee: Employee
  initialLogs: TaskLog[]
}

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

  // Form States
  const [status, setStatus] = useState<'Full Day' | 'Half Day' | 'Holiday'>(() => {
    if (todayLog?.status === 'Full Day' || todayLog?.status === 'Half Day' || todayLog?.status === 'Holiday') {
      return todayLog.status
    }
    return 'Full Day'
  })
  const [descriptionBefore, setDescriptionBefore] = useState(() => todayLog?.descriptionBefore || '')
  const [descriptionAfter, setDescriptionAfter] = useState(() => todayLog?.descriptionAfter || '')
  const [hoursBefore, setHoursBefore] = useState<number>(() => todayLog?.hoursBefore ?? 4)
  const [hoursAfter, setHoursAfter] = useState<number>(() => todayLog?.hoursAfter ?? 4)
  const [halfDayPeriod, setHalfDayPeriod] = useState<'Before Lunch' | 'After Lunch'>(() => {
    if (todayLog?.status === 'Half Day') {
      return todayLog.hoursBefore && todayLog.hoursBefore > 0 ? 'Before Lunch' : 'After Lunch'
    }
    return 'Before Lunch'
  })
  const [description, setDescription] = useState(() => todayLog?.status === 'Holiday' ? todayLog.description : '')
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

    if (status === 'Holiday') {
      if (!description.trim()) {
        setFeedback({ type: 'error', message: 'Please write the reason for Holiday / Leave.' })
        return
      }
      finalDesc = description.trim()
      finalHours = 0
    } else if (status === 'Full Day') {
      if (!descriptionBefore.trim()) {
        setFeedback({ type: 'error', message: 'Please write the task details for Before Lunch.' })
        return
      }
      if (!descriptionAfter.trim()) {
        setFeedback({ type: 'error', message: 'Please write the task details for After Lunch.' })
        return
      }
      finalDesc = `[Before Lunch] ${descriptionBefore.trim()} | [After Lunch] ${descriptionAfter.trim()}`
      finalHours = hoursBefore + hoursAfter
    } else if (status === 'Half Day') {
      if (halfDayPeriod === 'Before Lunch') {
        if (!descriptionBefore.trim()) {
          setFeedback({ type: 'error', message: 'Please write the task details for Before Lunch.' })
          return
        }
        finalDesc = `[Before Lunch] ${descriptionBefore.trim()}`
        finalHours = hoursBefore
      } else {
        if (!descriptionAfter.trim()) {
          setFeedback({ type: 'error', message: 'Please write the task details for After Lunch.' })
          return
        }
        finalDesc = `[After Lunch] ${descriptionAfter.trim()}`
        finalHours = hoursAfter
      }
    }

    setLoading(true)
    try {
      const res = await submitTaskAction(
        todayStr,
        status,
        finalDesc,
        finalHours,
        status !== 'Holiday' ? descriptionBefore.trim() : undefined,
        status === 'Full Day' || (status === 'Half Day' && halfDayPeriod === 'After Lunch') ? descriptionAfter.trim() : undefined,
        status !== 'Holiday' ? hoursBefore : undefined,
        status === 'Full Day' || (status === 'Half Day' && halfDayPeriod === 'After Lunch') ? hoursAfter : undefined
      )

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
    <div className="min-h-screen bg-slate-100 flex">

      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={`
        fixed top-0 left-0 h-full z-50 flex flex-col bg-sky-950 text-white
        transition-all duration-300 ease-in-out shadow-2xl
        ${sidebarCollapsed ? 'w-16' : 'w-64'}
        ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>

        {/* Sidebar header */}
        <div className={`flex items-center border-b border-white/10 shrink-0 ${sidebarCollapsed ? 'justify-center p-3' : 'gap-3 p-4'}`}>
          <Logo size={36} className="rounded-lg border border-white/20 bg-white shrink-0" />
          {!sidebarCollapsed && (
            <div className="overflow-hidden">
              <h1 className="text-xs font-black tracking-wide leading-none text-white whitespace-nowrap">विद्या भारती</h1>
              <p className="text-[9px] text-amber-300 font-bold tracking-widest mt-0.5 whitespace-nowrap">EMPLOYEE PORTAL</p>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex ml-auto p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          >
            {sidebarCollapsed
              ? <ChevronRight className="w-4 h-4 text-white/60" />
              : <ChevronLeft className="w-4 h-4 text-white/60" />
            }
          </button>
        </div>

        {/* Employee Profile pill */}
        {!sidebarCollapsed && (
          <div className="mx-3 mt-4 p-3 rounded-xl bg-white/10 border border-white/10 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-400 flex items-center justify-center text-amber-900 font-black text-sm shrink-0">
              {empInitials}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate leading-none">{employee.name.split(' ').slice(0, 2).join(' ')}</p>
              <p className="text-[9px] text-white/50 font-semibold mt-0.5 truncate">{employee.id} · {employee.role.split(' ').slice(0,2).join(' ')}</p>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 flex flex-col gap-1 overflow-y-auto">
          <button
            onClick={() => { setActiveSection('log'); setMobileSidebarOpen(false) }}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left cursor-pointer w-full ${
              activeSection === 'log' ? 'bg-white/15 border border-white/10' : 'hover:bg-white/10'
            } ${sidebarCollapsed ? 'justify-center' : ''}`}
          >
            <LayoutDashboard className={`w-4.5 h-4.5 shrink-0 ${activeSection === 'log' ? 'text-amber-300' : 'text-white/60'}`} />
            {!sidebarCollapsed && <span className="text-xs font-bold text-white">Submit Daily Log</span>}
          </button>

          <button
            onClick={() => { setActiveSection('history'); setMobileSidebarOpen(false) }}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left cursor-pointer w-full ${
              activeSection === 'history' ? 'bg-white/15 border border-white/10' : 'hover:bg-white/10'
            } ${sidebarCollapsed ? 'justify-center' : ''}`}
          >
            <ClipboardList className={`w-4.5 h-4.5 shrink-0 ${activeSection === 'history' ? 'text-amber-300' : 'text-white/60'}`} />
            {!sidebarCollapsed && (
              <span className="text-xs font-bold text-white flex-1">History</span>
            )}
            {!sidebarCollapsed && logs.length > 0 && (
              <span className="bg-white/20 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">
                {logs.length}
              </span>
            )}
          </button>

          <div className="my-2 border-t border-white/10" />

          <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <CalendarDays className="w-4 h-4 text-white/40 shrink-0" />
            {!sidebarCollapsed && (
              <span className="text-[10px] font-semibold text-white/40 uppercase tracking-widest">Attendance</span>
            )}
          </div>

          {/* Mini Calendar dots in sidebar */}
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
                  <div key={dateStr} className="flex flex-col items-center gap-0.5" title={dateStr}>
                    <span className="text-[8px] text-white/40 font-bold">
                      {date.toLocaleDateString('en-IN', { weekday: 'narrow' })}
                    </span>
                    <div className={`w-4 h-4 rounded-full ${dotColor} flex items-center justify-center`}>
                      <span className="text-[7px] font-black text-white/80">{date.getDate()}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-white/10">
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-red-500/20 transition-colors cursor-pointer ${sidebarCollapsed ? 'justify-center' : ''}`}
          >
            <LogOut className="w-4 h-4 text-red-400 shrink-0" />
            {!sidebarCollapsed && <span className="text-xs font-semibold text-red-300">Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>

        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <Menu className="w-5 h-5 text-slate-600" />
              </button>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-800 tracking-tight leading-tight">
                  {activeSection === 'log' ? 'दैनिक कार्य प्रविष्टि' : 'पूर्व प्रविष्टियां'}
                </h2>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                  {activeSection === 'log' ? 'Submit your daily task log' : 'Your submission history'}
                </p>
              </div>
            </div>

            {/* Today status badge */}
            <div className={`hidden sm:flex items-center gap-2 rounded-xl px-4 py-2 border text-xs font-bold ${
              todayLog
                ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                : 'bg-amber-50 border-amber-100 text-amber-800'
            }`}>
              {todayLog ? <Check className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
              {todayLog ? `Submitted · ${todayLog.status}` : 'Not submitted today'}
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 py-6 flex flex-col gap-6">

          {/* ── Stats row ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in-up">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between relative overflow-hidden hover:shadow-md transition-all">
              <div className="absolute left-0 top-0 h-full w-1.5 bg-sky-600 rounded-l-2xl" />
              <div className="pl-3 flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Today&apos;s Status</span>
                <h4 className="text-lg font-black text-slate-800">{todayLog ? todayLog.status : 'Pending'}</h4>
                <span className="text-xs font-semibold text-slate-500">
                  {todayLog
                    ? `Submitted at ${new Date(todayLog.submittedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
                    : 'Due before 6:00 PM'}
                </span>
              </div>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${todayLog ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600 animate-pulse'}`}>
                {todayLog ? <Check className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between relative overflow-hidden hover:shadow-md transition-all">
              <div className="absolute left-0 top-0 h-full w-1.5 bg-amber-500 rounded-l-2xl" />
              <div className="pl-3 flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Weekly Hours</span>
                <h4 className="text-lg font-black text-slate-800">{weeklyHours} Hrs</h4>
                <span className="text-xs font-semibold text-slate-500">Active hours last 7 days</span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between relative overflow-hidden hover:shadow-md transition-all">
              <div className="absolute left-0 top-0 h-full w-1.5 bg-emerald-500 rounded-l-2xl" />
              <div className="pl-3 flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Monthly Days</span>
                <h4 className="text-lg font-black text-slate-800">{monthlyLogsCount} Days</h4>
                <span className="text-xs font-semibold text-slate-500">Logs in current month</span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <ClipboardList className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* ── 14-Day Attendance Matrix ── */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">उपस्थिति विवरण (14-Day Attendance)</h3>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">Your task presence for the last 2 weeks</p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[9px] font-bold tracking-wider uppercase text-slate-400">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-500" /> Full Day</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-sky-500" /> Half Day</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-500" /> Holiday</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-slate-300" /> Pending</span>
              </div>
            </div>

            <div className="grid grid-cols-7 sm:grid-cols-14 gap-2">
              {calendarDays.map(({ date: dayDate, dateStr, log }) => {
                const isToday = dateStr === todayStr
                const dayName = dayDate.toLocaleDateString('en-IN', { weekday: 'narrow' })
                const dateNumber = dayDate.getDate()
                let bgClass = 'bg-slate-50 border-slate-200 text-slate-400'
                let dotClass = 'bg-slate-300'
                if (log) {
                  if (log.status === 'Full Day') { bgClass = 'bg-emerald-50 border-emerald-200 text-emerald-800'; dotClass = 'bg-emerald-500' }
                  else if (log.status === 'Half Day') { bgClass = 'bg-sky-50 border-sky-200 text-sky-800'; dotClass = 'bg-sky-500' }
                  else if (log.status === 'Holiday') { bgClass = 'bg-amber-50 border-amber-200 text-amber-800'; dotClass = 'bg-amber-500' }
                } else if (isToday) { bgClass = 'bg-red-50 border-red-300 text-red-700 animate-pulse'; dotClass = 'bg-red-500' }
                return (
                  <div
                    key={dateStr}
                    className={`border rounded-xl py-2.5 flex flex-col items-center gap-1 text-center transition-all hover:scale-105 ${bgClass} ${isToday ? 'ring-2 ring-red-200' : ''}`}
                  >
                    <span className="text-[8px] font-extrabold opacity-60 uppercase">{dayName}</span>
                    <span className="text-sm font-black leading-none">{dateNumber}</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Two Column Content ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Log Form — show only in 'log' section on mobile, always on desktop */}
            <div className={`lg:col-span-7 flex flex-col gap-5 ${activeSection === 'history' ? 'hidden lg:flex' : 'flex'}`}>

              {/* Profile Card */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-sky-500" />
                <div className="flex items-center gap-4 pt-1">
                  <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center shrink-0">
                    <User className="w-6 h-6 text-sky-700" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-800 leading-tight">{employee.name}</h2>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5 flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5 text-amber-500" />
                      {employee.role} · {employee.id}
                    </p>
                  </div>
                </div>
              </div>

              {/* Form Card */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col gap-5">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-sky-600" />
                    <h3 className="font-bold text-slate-800 text-base">दैनिक कार्य प्रविष्टि</h3>
                  </div>
                  <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/30 px-2.5 py-1 rounded-lg">
                    Today: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
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
                    feedback.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-red-50 border-red-200 text-red-800'
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
                    <label className="text-xs font-bold text-slate-700 tracking-wide">Work Status (उपस्थिति स्थिति)</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['Full Day', 'Half Day', 'Holiday'] as const).map((s) => {
                        const colors = {
                          'Full Day': 'emerald',
                          'Half Day': 'sky',
                          'Holiday': 'amber'
                        }[s]
                        const isActive = status === s
                        return (
                          <button
                            key={s}
                            type="button"
                            disabled={!canSubmit}
                            onClick={() => handleStatusChange(s)}
                            className={`py-3 px-2 text-center rounded-xl border text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex flex-col items-center gap-1 disabled:opacity-50 ${
                              isActive
                                ? `border-${colors}-600 bg-${colors}-50 text-${colors}-800 shadow-sm`
                                : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                            }`}
                          >
                            <Check className={`w-3.5 h-3.5 text-${colors}-600 ${isActive ? 'opacity-100' : 'opacity-0'}`} />
                            {s}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Half Day period selection */}
                  {status === 'Half Day' && (
                    <div className="flex flex-col gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <label className="text-xs font-bold text-slate-700 tracking-wide">Select Working Session (कार्यरत पाली)</label>
                      <div className="grid grid-cols-2 gap-2">
                        {(['Before Lunch', 'After Lunch'] as const).map((p) => (
                          <button
                            key={p}
                            type="button"
                            disabled={!canSubmit}
                            onClick={() => setHalfDayPeriod(p)}
                            className={`py-2 px-3 text-center rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                              halfDayPeriod === p ? 'border-sky-600 bg-sky-100/50 text-sky-800' : 'border-slate-200 bg-white text-slate-600'
                            }`}
                          >
                            {p === 'Before Lunch' ? 'Before Lunch (प्रथम पाली)' : 'After Lunch (द्वितीय पाली)'}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Holiday reason */}
                  {status === 'Holiday' && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        Reason for Leave (अवकाश का विवरण)
                      </label>
                      <textarea rows={4} required disabled={!canSubmit} value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="e.g. Sickness, out of station, personal leave, or educational holiday..."
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-500 font-medium text-slate-800 placeholder-slate-400 leading-relaxed disabled:bg-slate-50 disabled:text-slate-400"
                      />
                    </div>
                  )}

                  {/* Before Lunch task */}
                  {status !== 'Holiday' && (status === 'Full Day' || (status === 'Half Day' && halfDayPeriod === 'Before Lunch')) && (
                    <div className="flex flex-col gap-3 p-4 bg-sky-50/50 rounded-xl border border-sky-200/60">
                      <div className="flex items-center justify-between border-b border-sky-200/50 pb-2">
                        <span className="text-xs font-extrabold text-sky-900">1. Before Lunch (भोजन से पहले)</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-slate-500">Hours:</span>
                          <input type="number" required min={0.5} max={6} step={0.5} disabled={!canSubmit}
                            value={hoursBefore} onChange={(e) => setHoursBefore(parseFloat(e.target.value) || 0)}
                            className="w-16 px-2 py-1 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-sky-500 text-center" />
                        </div>
                      </div>
                      <textarea rows={3} required disabled={!canSubmit} value={descriptionBefore}
                        onChange={(e) => setDescriptionBefore(e.target.value)}
                        placeholder="Describe morning assembly, classes, meetings, admin checks..."
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-500 font-medium text-slate-800 placeholder-slate-400 leading-relaxed disabled:bg-slate-50 disabled:text-slate-400" />
                    </div>
                  )}

                  {/* After Lunch task */}
                  {status !== 'Holiday' && (status === 'Full Day' || (status === 'Half Day' && halfDayPeriod === 'After Lunch')) && (
                    <div className="flex flex-col gap-3 p-4 bg-emerald-50/50 rounded-xl border border-emerald-200/60">
                      <div className="flex items-center justify-between border-b border-emerald-200/50 pb-2">
                        <span className="text-xs font-extrabold text-emerald-900">2. After Lunch (भोजन के बाद)</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-slate-500">Hours:</span>
                          <input type="number" required min={0.5} max={6} step={0.5} disabled={!canSubmit}
                            value={hoursAfter} onChange={(e) => setHoursAfter(parseFloat(e.target.value) || 0)}
                            className="w-16 px-2 py-1 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 text-center" />
                        </div>
                      </div>
                      <textarea rows={3} required disabled={!canSubmit} value={descriptionAfter}
                        onChange={(e) => setDescriptionAfter(e.target.value)}
                        placeholder="Describe afternoon duties, student activities, administrative tasks..."
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 font-medium text-slate-800 placeholder-slate-400 leading-relaxed disabled:bg-slate-50 disabled:text-slate-400" />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !canSubmit}
                    className="w-full py-3 rounded-xl bg-sky-900 hover:bg-sky-950 text-white font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : todayLog ? 'Update Log Entry' : 'Submit Log Entry'}
                  </button>
                </form>
              </div>
            </div>

            {/* History — show only in 'history' section on mobile, always on desktop */}
            <div className={`lg:col-span-5 flex flex-col gap-5 ${activeSection === 'log' ? 'hidden lg:flex' : 'flex'}`}>
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col gap-4">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-slate-500" />
                    <h3 className="font-bold text-slate-800 text-base">पूर्व प्रविष्टियां</h3>
                  </div>
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full">
                    {logs.length} entries
                  </span>
                </div>

                {logs.length === 0 ? (
                  <div className="text-center py-16 flex flex-col items-center gap-2 text-slate-400">
                    <ClipboardList className="w-10 h-10 stroke-1" />
                    <p className="text-xs font-semibold">No logs submitted yet.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1">
                    {logs.map((log) => {
                      const formattedDate = new Date(log.date).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric', weekday: 'short'
                      })
                      return (
                        <div
                          key={log.id}
                          className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-all bg-slate-50/50 flex flex-col gap-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800">{formattedDate}</span>
                            <span className={`text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded ${
                              log.status === 'Full Day' ? 'bg-emerald-100 text-emerald-800'
                              : log.status === 'Half Day' ? 'bg-sky-100 text-sky-800'
                              : 'bg-amber-100 text-amber-800'
                            }`}>
                              {log.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed font-medium line-clamp-3">
                            {log.description}
                          </p>
                          <div className="border-t border-slate-200/50 pt-2 flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {log.hours} Hrs
                            </span>
                            <span>
                              {new Date(log.submittedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
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

        <footer className="bg-white border-t border-slate-200 py-4 text-center text-slate-400 text-xs">
          <p>© {new Date().getFullYear()} विद्या भारती सेवाधाम।</p>
        </footer>
      </div>
    </div>
  )
}
