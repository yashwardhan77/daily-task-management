'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Logo from '@/components/logo'
import { logoutAction, getAdminLogsAction, addEmployeeAction, editEmployeeAction, deleteEmployeeAction, getEmployeesAction, updateSettingAction, getGeoSettingsAction } from '@/lib/actions/tasks'
import { TaskLog } from '@/lib/actions/mockDb'

// Parse bullet-point description string into array of clean strings
function parsePoints(text: string | undefined): string[] {
  if (!text) return []
  return text
    .split('•')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}
import * as XLSX from 'xlsx'
import {
  Calendar,
  Clock,
  Download,
  LogOut,
  UserCheck,
  UserX,
  FileText,
  Search,
  Filter,
  HelpCircle,
  X,
  TrendingUp,
  Coffee,
  UserPlus,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  Menu,
  Users,
  Pencil,
  Trash2,
  ShieldAlert,
  MapPin,
  Navigation,
  ToggleLeft,
  ToggleRight
} from 'lucide-react'

interface LogWithEmpDetails extends TaskLog {
  employeeName: string
  employeeRole: string
  employeeCategory?: string
}

interface Stats {
  total: number
  present: number
  halfday: number
  holiday: number
  pending: number
}

interface AdminDashboardClientProps {
  initialDate: string
  initialLogs: LogWithEmpDetails[]
  initialStats: Stats
  historyLogs: LogWithEmpDetails[]
}

export default function AdminDashboardClient({
  initialDate,
  initialLogs,
  initialStats,
  historyLogs,
}: AdminDashboardClientProps) {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState(initialDate)
  const [logs, setLogs] = useState<LogWithEmpDetails[]>(initialLogs)
  const [stats, setStats] = useState<Stats>(initialStats)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const sidebarRef = React.useRef<HTMLElement>(null)

  // Apply sidebar visibility on state change and on media query change
  React.useEffect(() => {
    const el = sidebarRef.current
    if (!el) return
    const mq = window.matchMedia('(min-width: 1024px)')
    const apply = () => {
      if (mq.matches) {
        // Desktop: always visible
        el.style.transform = 'translateX(0)'
        el.style.visibility = 'visible'
        el.style.width = sidebarCollapsed ? '64px' : '256px'
      } else {
        // Mobile: show/hide based on state
        el.style.transform = mobileSidebarOpen ? 'translateX(0)' : 'translateX(-100%)'
        el.style.visibility = mobileSidebarOpen ? 'visible' : 'hidden'
        el.style.width = '256px' // always full width on mobile
      }
    }
    apply()
    const handler = () => apply()
    if (mq.addEventListener) mq.addEventListener('change', handler)
    else mq.addListener?.(handler) // old browsers
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', handler)
      else mq.removeListener?.(handler)
    }
  }, [mobileSidebarOpen, sidebarCollapsed])

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'All' | 'Full Day' | 'Half Day' | 'Holiday' | 'Pending'>('All')
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Prant' | 'Kshetra'>('All')

  // Detailed view drawer state
  const [selectedLog, setSelectedLog] = useState<LogWithEmpDetails | null>(null)
  
  const [exporting, setExporting] = useState(false)

  // Add Employee form states
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false)
  const [newEmpId, setNewEmpId] = useState('')
  const [newEmpName, setNewEmpName] = useState('')
  const [newEmpPassword, setNewEmpPassword] = useState('')
  const [newEmpRole, setNewEmpRole] = useState('Karyalay Prabhari (कार्यालय प्रभारी)')
  const [newEmpCategory, setNewEmpCategory] = useState<'Prant' | 'Kshetra'>('Kshetra')
  const [addFeedback, setAddFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [adding, setAdding] = useState(false)

  // Manage Employees panel states
  const [isManageOpen, setIsManageOpen] = useState(false)
  const [employeeList, setEmployeeList] = useState<{ id: string; name: string; role: string; password: string; category: string }[]>([])
  const [loadingEmployees, setLoadingEmployees] = useState(false)

  // Edit Employee modal states
  const [editTarget, setEditTarget] = useState<{ id: string; name: string; role: string; password: string; category: string } | null>(null)
  const [editName, setEditName] = useState('')
  const [editRole, setEditRole] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [editCategory, setEditCategory] = useState<'Prant' | 'Kshetra'>('Kshetra')
  const [editFeedback, setEditFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [saving, setSaving] = useState(false)

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Location Settings state
  const [isLocationOpen, setIsLocationOpen] = useState(false)
  const [locEnabled, setLocEnabled] = useState(false)
  const [locLat, setLocLat] = useState('')
  const [locLng, setLocLng] = useState('')
  const [locRadius, setLocRadius] = useState('50')
  const [locFeedback, setLocFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [savingLoc, setSavingLoc] = useState(false)
  const [gettingLoc, setGettingLoc] = useState(false)
  const [loadingLocSettings, setLoadingLocSettings] = useState(false)

  const openLocationPanel = async () => {
    setIsLocationOpen(true)
    setMobileSidebarOpen(false)
    setLocFeedback(null)
    setLoadingLocSettings(true)
    const settings = await getGeoSettingsAction()
    setLocEnabled(settings.enabled)
    setLocLat(settings.lat !== 0 ? String(settings.lat) : '')
    setLocLng(settings.lng !== 0 ? String(settings.lng) : '')
    setLocRadius(String(settings.radiusMeters))
    setLoadingLocSettings(false)
  }

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) { setLocFeedback({ type: 'error', message: 'Geolocation not supported in this browser.' }); return }
    setGettingLoc(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocLat(pos.coords.latitude.toFixed(7))
        setLocLng(pos.coords.longitude.toFixed(7))
        setLocFeedback({ type: 'success', message: `Location captured: ${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}` })
        setGettingLoc(false)
      },
      () => { setLocFeedback({ type: 'error', message: 'Failed to get location. Allow browser location access.' }); setGettingLoc(false) },
      { enableHighAccuracy: true, timeout: 15000 }
    )
  }

  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocFeedback(null)
    if (!locLat || !locLng) { setLocFeedback({ type: 'error', message: 'Please set office coordinates first.' }); return }
    setSavingLoc(true)
    try {
      await updateSettingAction('geo_restriction_enabled', String(locEnabled))
      await updateSettingAction('office_lat', locLat)
      await updateSettingAction('office_lng', locLng)
      await updateSettingAction('geo_radius_meters', locRadius || '50')
      setLocFeedback({ type: 'success', message: 'Location settings saved! Employees must now be within ' + (locRadius || '50') + 'm of office.' })
    } catch { setLocFeedback({ type: 'error', message: 'Failed to save settings.' }) }
    finally { setSavingLoc(false) }
  }

  const openManagePanel = async () => {
    setIsManageOpen(true)
    setMobileSidebarOpen(false)
    setLoadingEmployees(true)
    const res = await getEmployeesAction()
    if (res.success) setEmployeeList(res.employees)
    setLoadingEmployees(false)
  }

  const openEditModal = (emp: { id: string; name: string; role: string; password: string; category: string }) => {
    setEditTarget(emp)
    setEditName(emp.name)
    setEditRole(emp.role)
    setEditPassword(emp.password)
    setEditCategory((emp.category === 'Prant' ? 'Prant' : 'Kshetra'))
    setEditFeedback(null)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTarget) return
    setEditFeedback(null)
    setSaving(true)
    try {
      const res = await editEmployeeAction(editTarget.id, editName, editPassword, editRole, editCategory)
      if (res.success) {
        setEditFeedback({ type: 'success', message: res.message })
        setEmployeeList(prev => prev.map(e => e.id === editTarget.id ? { ...e, name: editName, role: editRole, password: editPassword, category: editCategory } : e))
        setTimeout(() => { setEditTarget(null); setEditFeedback(null) }, 1200)
        router.refresh()
      } else {
        setEditFeedback({ type: 'error', message: res.message })
      }
    } catch { setEditFeedback({ type: 'error', message: 'Something went wrong.' }) }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await deleteEmployeeAction(deleteTarget.id)
      if (res.success) {
        setEmployeeList(prev => prev.filter(e => e.id !== deleteTarget.id))
        setDeleteTarget(null)
        router.refresh()
      }
    } catch { /* ignore */ }
    finally { setDeleting(false) }
  }

  const handleAddEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddFeedback(null)
    
    if (!newEmpId.trim() || !newEmpName.trim() || !newEmpPassword.trim() || !newEmpRole.trim()) {
      setAddFeedback({ type: 'error', message: 'All fields are required.' })
      return
    }

    setAdding(true)
    try {
      const res = await addEmployeeAction(
        newEmpId.trim(),
        newEmpName.trim(),
        newEmpPassword.trim(),
        newEmpRole.trim(),
        newEmpCategory
      )

      if (res.success) {
        setAddFeedback({ type: 'success', message: res.message })
        setNewEmpId('')
        setNewEmpName('')
        setNewEmpPassword('')
        router.refresh()
      } else {
        setAddFeedback({ type: 'error', message: res.message })
      }
    } catch (err) {
      console.error(err)
      setAddFeedback({ type: 'error', message: 'Something went wrong.' })
    } finally {
      setAdding(false)
    }
  }

  const handleDateChange = async (newDate: string) => {
    setSelectedDate(newDate)
    router.push(`/admin/dashboard?date=${newDate}`)
    router.refresh()
    const res = await getAdminLogsAction(newDate)
    if (res.success) {
      setLogs(res.logs)
      setStats(res.employeeStats)
    }
  }

  const handleLogout = async () => {
    await logoutAction('admin')
    router.push('/')
    router.refresh()
  }

  const handleExcelExport = () => {
    setExporting(true)
    try {
      const dataToExport = historyLogs.map((log) => ({
        'Log Date': log.date,
        'Employee ID': log.employeeId,
        'Employee Name': log.employeeName,
        'Category': log.employeeCategory || 'Kshetra',
        'Designation / Role': log.employeeRole,
        'Log Status': log.status,
        'Hours Logged': log.status === 'Holiday' ? 0 : log.hours,
        'Work Description / Reason': log.description,
        'Submitted At': log.submittedAt ? new Date(log.submittedAt).toLocaleString('en-IN') : 'N/A'
      }))

      const worksheet = XLSX.utils.json_to_sheet(dataToExport)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Daily Tasks Logs')

      const maxLens = Object.keys(dataToExport[0] || {}).reduce<Record<string, number>>((acc, key) => {
        acc[key] = key.length
        dataToExport.forEach((row: Record<string, string | number>) => {
          const val = String(row[key] || '')
          acc[key] = Math.max(acc[key], val.length)
        })
        return acc
      }, {})
      worksheet['!cols'] = Object.keys(maxLens).map((key) => ({ wch: maxLens[key] + 3 }))

      XLSX.writeFile(workbook, `Vidhya_Bharati_Sewadham_Task_Report_${new Date().toISOString().split('T')[0]}.xlsx`)
    } catch (err) {
      console.error('Export failed:', err)
      alert('Failed to export data to Excel.')
    } finally {
      setExporting(false)
    }
  }

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.employeeRole.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'All' || log.status === statusFilter
    const matchesCategory = categoryFilter === 'All' || (log.employeeCategory || 'Kshetra') === categoryFilter
    return matchesSearch && matchesStatus && matchesCategory
  })

  const displayDateStr = new Date(selectedDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    weekday: 'long'
  })

  const completionRate = stats.total > 0 ? Math.round(((stats.total - stats.pending) / stats.total) * 100) : 0

  // On large screens sidebar is always visible; on mobile, show/hide via JS state

  return (
    <div className="min-h-screen bg-slate-100 flex">

      {/* ── Sidebar ── */}
      {/* Mobile backdrop overlay */}
      <div
        onClick={() => setMobileSidebarOpen(false)}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.55)',
          zIndex: 40,
          display: mobileSidebarOpen ? 'block' : 'none',
        }}
      />

      <aside
        ref={sidebarRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100%',
          width: sidebarCollapsed ? 64 : 256,
          zIndex: 50,
          transform: 'translateX(-100%)',
          visibility: 'hidden',
          transition: 'transform 0.28s ease, width 0.28s ease',
        }}
        className="flex flex-col bg-emerald-950 text-white shadow-2xl"
      >

        {/* Sidebar Header */}
        <div className={`flex items-center border-b border-white/10 shrink-0 ${sidebarCollapsed ? 'justify-center p-3' : 'gap-3 p-4'}`}>
          <Logo size={36} className="rounded-lg border border-white/20 bg-white shrink-0" />
          {!sidebarCollapsed && (
            <div className="overflow-hidden">
              <h1 className="text-xs font-black tracking-wide leading-none text-white whitespace-nowrap">
                विद्या भारती
              </h1>
              <p className="text-[9px] text-amber-300 font-bold tracking-widest mt-0.5 whitespace-nowrap">
                ADMIN PORTAL
              </p>
            </div>
          )}

          {/* Collapse toggle — desktop only */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex ml-auto p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            aria-label="Toggle sidebar"
          >
            {sidebarCollapsed
              ? <ChevronRight className="w-4 h-4 text-white/60" />
              : <ChevronLeft className="w-4 h-4 text-white/60" />
            }
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 px-2 py-4 flex flex-col gap-1 overflow-y-auto">
          {/* Active: Dashboard */}
          <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/15 border border-white/10 ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <LayoutDashboard className="w-4.5 h-4.5 text-amber-300 shrink-0" />
            {!sidebarCollapsed && (
              <span className="text-xs font-bold text-white">Daily Log Report</span>
            )}
          </div>

          {/* Divider */}
          <div className="my-2 border-t border-white/10" />

          {/* Actions */}
          <button
            onClick={() => {
              setAddFeedback(null)
              setIsAddEmployeeOpen(true)
              setMobileSidebarOpen(false)
            }}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 transition-colors text-left cursor-pointer w-full ${sidebarCollapsed ? 'justify-center' : ''}`}
          >
            <UserPlus className="w-4.5 h-4.5 text-white/70 shrink-0" />
            {!sidebarCollapsed && (
              <span className="text-xs font-semibold text-white/80">Add Employee</span>
            )}
          </button>

          <button
            onClick={openManagePanel}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 transition-colors text-left cursor-pointer w-full ${sidebarCollapsed ? 'justify-center' : ''}`}
          >
            <Users className="w-4.5 h-4.5 text-white/70 shrink-0" />
            {!sidebarCollapsed && (
              <span className="text-xs font-semibold text-white/80">Manage Employees</span>
            )}
          </button>

          <button
            onClick={handleExcelExport}
            disabled={exporting}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 transition-colors text-left cursor-pointer w-full disabled:opacity-50 ${sidebarCollapsed ? 'justify-center' : ''}`}
          >
            <Download className="w-4.5 h-4.5 text-white/70 shrink-0" />
            {!sidebarCollapsed && (
              <span className="text-xs font-semibold text-white/80">
                {exporting ? 'Exporting...' : 'Export Excel'}
              </span>
            )}
          </button>

          <button
            onClick={openLocationPanel}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 transition-colors text-left cursor-pointer w-full ${sidebarCollapsed ? 'justify-center' : ''}`}
          >
            <MapPin className="w-4.5 h-4.5 text-white/70 shrink-0" />
            {!sidebarCollapsed && (
              <span className="text-xs font-semibold text-white/80">Location Settings</span>
            )}
          </button>
        </nav>

        {/* Date Picker in Sidebar */}
        {!sidebarCollapsed && (
          <div className="px-3 pb-4 border-t border-white/10 pt-4">
            <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> View Date
            </p>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-xs font-semibold text-white focus:outline-none focus:border-amber-400 cursor-pointer"
            />
          </div>
        )}

        {/* Logout */}
        <div className={`p-3 border-t border-white/10 ${sidebarCollapsed ? '' : 'px-3'}`}>
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-red-500/20 transition-colors cursor-pointer ${sidebarCollapsed ? 'justify-center' : ''}`}
          >
            <LogOut className="w-4 h-4 text-red-400 shrink-0" />
            {!sidebarCollapsed && (
              <span className="text-xs font-semibold text-red-300">Logout</span>
            )}
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>

        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3">
            <div className="flex items-center gap-3">
              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <Menu className="w-5 h-5 text-slate-600" />
              </button>

              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-800 tracking-tight leading-tight">
                  दैनिक कर्मचारी प्रगति रिपोर्ट
                </h2>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                  Reviewing: {displayDateStr}
                </p>
              </div>
            </div>

            {/* Completion badge */}
            <div className="hidden sm:flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-black text-emerald-800">
                {stats.total - stats.pending} / {stats.total} Submitted
              </span>
              <span className="text-xs font-bold text-emerald-600">({completionRate}%)</span>
            </div>
          </div>
        </header>

        {/* Scrollable page body */}
        <main className="flex-1 px-4 sm:px-6 py-6 flex flex-col gap-6">

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 animate-fade-in-up">
            {/* Present */}
            <div className="bg-white rounded-2xl p-5 border-l-4 border-l-emerald-500 border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md hover:-translate-y-0.5 transition-all">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Present</span>
                <span className="text-2xl font-black text-slate-800">{stats.present}</span>
                <span className="text-[10px] font-semibold text-emerald-600">Full day</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>

            {/* Half Day */}
            <div className="bg-white rounded-2xl p-5 border-l-4 border-l-sky-500 border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md hover:-translate-y-0.5 transition-all">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Half Day</span>
                <span className="text-2xl font-black text-slate-800">{stats.halfday}</span>
                <span className="text-[10px] font-semibold text-sky-600">Part-time</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            {/* Holiday */}
            <div className="bg-white rounded-2xl p-5 border-l-4 border-l-amber-500 border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md hover:-translate-y-0.5 transition-all">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">On Leave</span>
                <span className="text-2xl font-black text-slate-800">{stats.holiday}</span>
                <span className="text-[10px] font-semibold text-amber-600">Holiday</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Coffee className="w-5 h-5" />
              </div>
            </div>

            {/* Pending */}
            <div className={`bg-white rounded-2xl p-5 border-l-4 border-l-red-500 border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md hover:-translate-y-0.5 transition-all ${stats.pending > 0 ? 'ring-1 ring-red-100' : ''}`}>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Pending</span>
                <span className="text-2xl font-black text-slate-800">{stats.pending}</span>
                <span className={`text-[10px] font-semibold ${stats.pending > 0 ? 'text-red-500 animate-pulse' : 'text-slate-400'}`}>
                  {stats.pending > 0 ? 'Action needed' : 'All clear'}
                </span>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${stats.pending > 0 ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-400'}`}>
                <UserX className="w-5 h-5" />
              </div>
            </div>

            {/* Rate */}
            <div className="bg-white rounded-2xl p-5 border-l-4 border-l-slate-700 border border-slate-200 shadow-sm flex items-center justify-between col-span-2 lg:col-span-1 hover:shadow-md hover:-translate-y-0.5 transition-all">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Completion</span>
                <span className="text-2xl font-black text-slate-800">{completionRate}%</span>
                <span className="text-[10px] font-semibold text-slate-500">{stats.total} total staff</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="bg-white rounded-2xl px-5 py-3.5 border border-slate-200 shadow-sm flex items-center gap-4 text-xs font-bold text-slate-500">
            <span className="shrink-0 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Daily Progress:
            </span>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-700"
                style={{ width: `${completionRate}%` }}
              />
            </div>
            <span className="shrink-0 text-slate-800 font-extrabold whitespace-nowrap">
              {stats.total - stats.pending} / {stats.total}
            </span>
          </div>

          {/* Filter controls */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col gap-3">
            <div className="flex flex-col md:flex-row justify-between gap-3">
              <div className="relative text-slate-600 w-full md:max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, ID, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 font-medium placeholder-slate-400 bg-slate-50/50"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
                <span className="text-slate-400 uppercase text-[10px] mr-1 hidden sm:inline-flex items-center gap-1">
                  <Filter className="w-3 h-3" /> Status:
                </span>
                {(['All', 'Full Day', 'Half Day', 'Holiday', 'Pending'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setStatusFilter(filter)}
                    className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                      statusFilter === filter
                        ? 'bg-emerald-900 text-white border-emerald-900 shadow-sm'
                        : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Category filter row */}
            <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-3">
              <span className="text-slate-400 uppercase text-[10px] mr-1 flex items-center gap-1 font-bold">
                <Filter className="w-3 h-3" /> वर्ग:
              </span>
              {(['All', 'Prant', 'Kshetra'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                    categoryFilter === cat
                      ? cat === 'Prant'
                        ? 'bg-indigo-700 text-white border-indigo-700 shadow-sm'
                        : cat === 'Kshetra'
                        ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                        : 'bg-slate-800 text-white border-slate-800 shadow-sm'
                      : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  {cat === 'All' ? 'All Categories' : cat === 'Prant' ? 'प्रांत (Prant)' : 'क्षेत्र (Kshetra)'}
                </button>
              ))}
              {categoryFilter !== 'All' && (
                <span className={`text-[10px] font-extrabold px-2 py-1 rounded-lg ${
                  categoryFilter === 'Prant' ? 'text-indigo-700 bg-indigo-50 border border-indigo-200' : 'text-orange-700 bg-orange-50 border border-orange-200'
                }`}>
                  Showing {filteredLogs.length} {categoryFilter} employees
                </span>
              )}
            </div>
          </div>

          {/* Daily logs grid */}
          {filteredLogs.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center gap-3 text-slate-400">
              <HelpCircle className="w-12 h-12 stroke-1" />
              <div>
                <h3 className="text-base font-bold text-slate-700">No submissions found</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Adjust your filters or select a different date to view task logs.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredLogs.map((log) => {
                const isPending = log.status === 'Pending'
                const initials = log.employeeName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)

                let avatarGrad = 'from-slate-200 to-slate-300 text-slate-700'
                if (log.status === 'Full Day') avatarGrad = 'from-emerald-500 to-teal-600 text-white'
                else if (log.status === 'Half Day') avatarGrad = 'from-sky-500 to-indigo-600 text-white'
                else if (log.status === 'Holiday') avatarGrad = 'from-amber-500 to-orange-600 text-white'
                else if (isPending) avatarGrad = 'from-red-400 to-rose-600 text-white'

                const beforePoints = parsePoints(log.descriptionBefore)
                const afterPoints = parsePoints(log.descriptionAfter)
                const hasStructured = beforePoints.length > 0 || afterPoints.length > 0

                return (
                  <div
                    key={log.id}
                    onClick={() => !isPending && setSelectedLog(log)}
                    className={`bg-white rounded-2xl border shadow-sm transition-all duration-200 flex flex-col relative overflow-hidden group ${
                      isPending
                        ? 'border-red-100 bg-red-50/20 opacity-80 cursor-default'
                        : 'border-slate-200 hover:border-emerald-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer'
                    }`}
                  >
                    {/* Card Header */}
                    <div className={`px-5 pt-5 pb-4 flex items-start justify-between gap-3 border-b ${
                      isPending ? 'border-red-100' : 'border-slate-100'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${avatarGrad} flex items-center justify-center text-sm font-black shadow-md shrink-0`}>
                          {initials}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-800 text-sm leading-tight group-hover:text-emerald-800 transition-colors">
                            {log.employeeName}
                          </h4>
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mt-0.5 truncate max-w-[180px]">
                            {log.employeeRole}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                              {log.employeeId}
                            </p>
                            <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                              (log.employeeCategory || 'Kshetra') === 'Prant'
                                ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                                : 'bg-orange-100 text-orange-700 border border-orange-200'
                            }`}>
                              {(log.employeeCategory || 'Kshetra') === 'Prant' ? 'प्रांत' : 'क्षेत्र'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className={`text-[9px] uppercase tracking-widest font-extrabold px-2.5 py-1.5 rounded-lg border shrink-0 mt-0.5 ${
                        log.status === 'Full Day' ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : log.status === 'Half Day' ? 'bg-sky-50 text-sky-800 border-sky-200'
                        : log.status === 'Holiday' ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-red-50 text-red-700 border-red-200 animate-pulse'
                      }`}>
                        {log.status}
                      </span>
                    </div>

                    {/* Card Body */}
                    <div className="px-5 py-4 flex flex-col gap-3 flex-1">
                      {isPending ? (
                        <div className="flex items-center gap-2 py-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                          <p className="text-xs text-red-400 italic font-medium">No task log submitted yet.</p>
                        </div>
                      ) : log.status === 'Holiday' ? (
                        <div className="flex items-start gap-2">
                          <span className="text-base mt-0.5">🌴</span>
                          <p className="text-xs text-amber-700 font-semibold leading-relaxed">{log.description}</p>
                        </div>
                      ) : hasStructured ? (
                        <div className="flex flex-col gap-3">
                          {/* Before Lunch */}
                          {beforePoints.length > 0 && (
                            <div>
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
                                <span className="text-[9px] font-extrabold text-sky-700 uppercase tracking-widest">
                                  Before Lunch {log.hoursBefore ? `· ${log.hoursBefore}h` : ''}
                                </span>
                              </div>
                              <div className="flex flex-col gap-1 pl-3">
                                {beforePoints.slice(0, 3).map((pt, i) => (
                                  <div key={i} className="flex items-start gap-1.5">
                                    <span className="text-sky-400 text-[10px] mt-0.5 shrink-0">▸</span>
                                    <span className="text-xs text-slate-700 font-medium leading-snug">{pt}</span>
                                  </div>
                                ))}
                                {beforePoints.length > 3 && (
                                  <span className="text-[10px] text-slate-400 font-semibold pl-3">+{beforePoints.length - 3} more…</span>
                                )}
                              </div>
                            </div>
                          )}
                          {/* After Lunch */}
                          {afterPoints.length > 0 && (
                            <div>
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                <span className="text-[9px] font-extrabold text-emerald-700 uppercase tracking-widest">
                                  After Lunch {log.hoursAfter ? `· ${log.hoursAfter}h` : ''}
                                </span>
                              </div>
                              <div className="flex flex-col gap-1 pl-3">
                                {afterPoints.slice(0, 3).map((pt, i) => (
                                  <div key={i} className="flex items-start gap-1.5">
                                    <span className="text-emerald-400 text-[10px] mt-0.5 shrink-0">▸</span>
                                    <span className="text-xs text-slate-700 font-medium leading-snug">{pt}</span>
                                  </div>
                                ))}
                                {afterPoints.length > 3 && (
                                  <span className="text-[10px] text-slate-400 font-semibold pl-3">+{afterPoints.length - 3} more…</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs leading-relaxed text-slate-600 font-medium line-clamp-4">
                          {log.description}
                        </p>
                      )}
                    </div>

                    {/* Card Footer */}
                    <div className={`px-5 py-3 border-t flex items-center justify-between ${
                      isPending ? 'border-red-100 bg-red-50/30' : 'border-slate-100 bg-slate-50/60'
                    }`}>
                      <span className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        <Clock className="w-3.5 h-3.5" />
                        {log.status === 'Holiday' ? '0 Hours' : `${log.hours} Hours`}
                      </span>
                      {!isPending ? (
                        <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg border border-emerald-200 text-[9px] tracking-widest font-extrabold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                          Submitted
                        </span>
                      ) : (
                        <span className="bg-red-50 text-red-600 px-2.5 py-1 rounded-lg border border-red-200 text-[9px] tracking-widest font-extrabold animate-pulse flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                          Missing
                        </span>
                      )}
                    </div>

                    {/* Click hint for submitted */}
                    {!isPending && (
                      <div className="absolute bottom-11 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <span className="text-[9px] text-emerald-600 font-bold tracking-wider">Click to view full log ↗</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 py-4 text-center text-slate-400 text-xs">
          <p>© {new Date().getFullYear()} विद्या भारती सेवाधाम।</p>
        </footer>
      </div>

      {/* ── Add Employee Dialog Modal ── */}
      {isAddEmployeeOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-md overflow-hidden shadow-2xl flex flex-col gap-5 relative animate-fade-in-up">
            <div className="bg-emerald-950 text-white p-6 border-b border-slate-100/10 relative">
              <button
                onClick={() => setIsAddEmployeeOpen(false)}
                className="absolute top-4 right-4 text-white/70 hover:text-white p-1 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
              <span className="text-[10px] font-bold text-amber-300 uppercase tracking-widest block mb-1">
                Management Control
              </span>
              <h3 className="text-xl font-bold text-white leading-none">
                नया कर्मचारी जोड़ें
              </h3>
            </div>

            <form onSubmit={handleAddEmployeeSubmit} className="px-6 pb-6 flex flex-col gap-4 text-slate-700">
              {addFeedback && (
                <div className={`p-3 rounded-xl text-xs font-semibold ${
                  addFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-red-50 text-red-800 border border-red-100'
                }`}>
                  {addFeedback.message}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700" htmlFor="newEmpId">Employee ID (e.g. VB16)</label>
                <input id="newEmpId" type="text" required placeholder="e.g. VB16" value={newEmpId}
                  onChange={(e) => setNewEmpId(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 font-semibold uppercase text-slate-800 bg-white" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700" htmlFor="newEmpName">Full Name (पूरा नाम)</label>
                <input id="newEmpName" type="text" required placeholder="e.g. विजय शर्मा" value={newEmpName}
                  onChange={(e) => setNewEmpName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 font-semibold text-slate-800 bg-white" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700" htmlFor="newEmpPassword">Password (लॉगिन पासवर्ड)</label>
                <input id="newEmpPassword" type="text" required placeholder="e.g. sewadham123" value={newEmpPassword}
                  onChange={(e) => setNewEmpPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 font-semibold text-slate-800 bg-white" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700" htmlFor="newEmpRole">Job Role (पद / दायित्व)</label>
                <select id="newEmpRole" value={newEmpRole} onChange={(e) => setNewEmpRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 bg-white rounded-xl text-sm focus:outline-none focus:border-emerald-500 font-semibold text-slate-800 cursor-pointer">
                  <option>Kshetriya Pramukh (क्षेत्रीय प्रमुख)</option>
                  <option>Sahayak Kshetriya Pramukh (सहायक क्षेत्रीय प्रमुख)</option>
                  <option>Karyalay Prabhari (कार्यालय प्रभारी)</option>
                  <option>Sahayak Karyalay Prabhari (सहायक कार्यालय प्रभारी)</option>
                  <option>Lekhakar (लेखाकार)</option>
                  <option>Sahayak Lekhakar (सहायक लेखाकार)</option>
                  <option>Karyalay Sahayak (कार्यालय सहायक)</option>
                  <option>Data Entry Operator (डेटा प्रविष्टि)</option>
                  <option>IT Prabhari (IT प्रभारी)</option>
                  <option>Sanghatan Sahayak (संगठन सहायक)</option>
                  <option>Pracharya Sampark (प्राचार्य संपर्क)</option>
                  <option>Pracharak (प्रचारक)</option>
                  <option>Driver (वाहन चालक)</option>
                  <option>Suraksha Prahari (सुरक्षा प्रहरी)</option>
                  <option>Karyalay Sevak (कार्यालय सेवक)</option>
                  <option>Sahayak (सहायक)</option>
                </select>
              </div>

              {/* Category */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Category (वर्ग)</label>
                <div className="flex gap-2">
                  {(['Kshetra', 'Prant'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setNewEmpCategory(cat)}
                      className={`flex-1 py-2.5 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${
                        newEmpCategory === cat
                          ? cat === 'Prant'
                            ? 'bg-indigo-700 text-white border-indigo-700'
                            : 'bg-orange-600 text-white border-orange-600'
                          : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {cat === 'Prant' ? 'प्रांत (Prant)' : 'क्षेत्र (Kshetra)'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button type="button" onClick={() => setIsAddEmployeeOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold text-xs uppercase text-slate-500 transition-colors cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={adding}
                  className="w-1/2 py-2.5 rounded-xl bg-emerald-900 hover:bg-emerald-950 text-white font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer shadow-md">
                  {adding ? 'Adding...' : 'Add Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Manage Employees Panel ── */}
      {isManageOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-fade-in-up">
            {/* Header */}
            <div className="bg-emerald-950 text-white p-6 relative shrink-0">
              <button onClick={() => setIsManageOpen(false)}
                className="absolute top-4 right-4 text-white/70 hover:text-white p-1 hover:bg-white/10 rounded-full transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
              <span className="text-[10px] font-bold text-amber-300 uppercase tracking-widest block mb-1">Management Control</span>
              <h3 className="text-xl font-bold text-white leading-none">कर्मचारी प्रबंधन</h3>
              <p className="text-xs text-slate-300 mt-1">Edit or remove staff members</p>
            </div>

            {/* Employee List */}
            <div className="overflow-y-auto flex-1 px-6 py-4 flex flex-col gap-3">
              {loadingEmployees ? (
                <div className="text-center py-16 text-slate-400 text-sm font-semibold">Loading employees...</div>
              ) : employeeList.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-sm">No employees found.</div>
              ) : (
                employeeList.map((emp) => (
                  <div key={emp.id} className="flex items-center justify-between gap-3 p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-sm transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-900 text-white flex items-center justify-center text-xs font-black shrink-0">
                        {emp.id.replace('VB', '')}
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-slate-800">{emp.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">{emp.role} · {emp.id}</p>
                          <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                            (emp.category || 'Kshetra') === 'Prant'
                              ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                              : 'bg-orange-100 text-orange-700 border border-orange-200'
                          }`}>
                            {(emp.category || 'Kshetra') === 'Prant' ? 'प्रांत' : 'क्षेत्र'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => openEditModal(emp)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold border border-sky-100 transition-colors cursor-pointer">
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button onClick={() => setDeleteTarget({ id: emp.id, name: emp.name })}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold border border-red-100 transition-colors cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Employee Modal ── */}
      {editTarget && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-md overflow-hidden shadow-2xl animate-fade-in-up">
            <div className="bg-sky-900 text-white p-6 relative">
              <button onClick={() => setEditTarget(null)}
                className="absolute top-4 right-4 text-white/70 hover:text-white p-1 hover:bg-white/10 rounded-full transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
              <span className="text-[10px] font-bold text-sky-300 uppercase tracking-widest block mb-1">Edit Staff Member</span>
              <h3 className="text-xl font-bold text-white">{editTarget.id}</h3>
            </div>
            <form onSubmit={handleEditSubmit} className="px-6 pb-6 pt-5 flex flex-col gap-4">
              {editFeedback && (
                <div className={`p-3 rounded-xl text-xs font-semibold ${
                  editFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-red-50 text-red-800 border border-red-100'
                }`}>{editFeedback.message}</div>
              )}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Full Name</label>
                <input type="text" required value={editName} onChange={e => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-500 font-semibold text-slate-800 bg-white" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Password</label>
                <input type="text" required value={editPassword} onChange={e => setEditPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-500 font-semibold text-slate-800 bg-white" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Job Role</label>
                <select value={editRole} onChange={e => setEditRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 bg-white rounded-xl text-sm focus:outline-none focus:border-sky-500 font-semibold text-slate-800 cursor-pointer">
                  <option>Kshetriya Pramukh (क्षेत्रीय प्रमुख)</option>
                  <option>Sahayak Kshetriya Pramukh (सहायक क्षेत्रीय प्रमुख)</option>
                  <option>Karyalay Prabhari (कार्यालय प्रभारी)</option>
                  <option>Sahayak Karyalay Prabhari (सहायक कार्यालय प्रभारी)</option>
                  <option>Lekhakar (लेखाकार)</option>
                  <option>Sahayak Lekhakar (सहायक लेखाकार)</option>
                  <option>Karyalay Sahayak (कार्यालय सहायक)</option>
                  <option>Data Entry Operator (डेटा प्रविष्टि)</option>
                  <option>IT Prabhari (IT प्रभारी)</option>
                  <option>Sanghatan Sahayak (संगठन सहायक)</option>
                  <option>Pracharya Sampark (प्राचार्य संपर्क)</option>
                  <option>Pracharak (प्रचारक)</option>
                  <option>Driver (वाहन चालक)</option>
                  <option>Suraksha Prahari (सुरक्षा प्रहरी)</option>
                  <option>Karyalay Sevak (कार्यालय सेवक)</option>
                  <option>Sahayak (सहायक)</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Category (वर्ग)</label>
                <div className="flex gap-2">
                  {(['Kshetra', 'Prant'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setEditCategory(cat)}
                      className={`flex-1 py-2.5 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${
                        editCategory === cat
                          ? cat === 'Prant'
                            ? 'bg-indigo-700 text-white border-indigo-700'
                            : 'bg-orange-600 text-white border-orange-600'
                          : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {cat === 'Prant' ? 'प्रांत (Prant)' : 'क्षेत्र (Kshetra)'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3 pt-1">
                <button type="button" onClick={() => setEditTarget(null)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold text-xs uppercase text-slate-500 transition-colors cursor-pointer">Cancel</button>
                <button type="submit" disabled={saving}
                  className="w-1/2 py-2.5 rounded-xl bg-sky-800 hover:bg-sky-900 text-white font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer shadow-md">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-sm overflow-hidden shadow-2xl animate-fade-in-up">
            <div className="p-6 flex flex-col items-center gap-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
                <ShieldAlert className="w-7 h-7 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800">Delete Employee?</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Are you sure you want to delete <strong>{deleteTarget.name}</strong> ({deleteTarget.id})?
                  This cannot be undone.
                </p>
              </div>
              <div className="flex items-center gap-3 w-full pt-2">
                <button onClick={() => setDeleteTarget(null)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold text-xs uppercase text-slate-500 transition-colors cursor-pointer">Cancel</button>
                <button onClick={handleDelete} disabled={deleting}
                  className="w-1/2 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer shadow-md">
                  {deleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Log Detail Modal ── */}
      {selectedLog && (() => {
        const modalBeforePoints = parsePoints(selectedLog.descriptionBefore)
        const modalAfterPoints = parsePoints(selectedLog.descriptionAfter)
        const modalHasStructured = modalBeforePoints.length > 0 || modalAfterPoints.length > 0

        let statusColor = 'bg-slate-100 text-slate-700 border-slate-200'
        if (selectedLog.status === 'Full Day') statusColor = 'bg-emerald-100 text-emerald-800 border-emerald-200'
        else if (selectedLog.status === 'Half Day') statusColor = 'bg-sky-100 text-sky-800 border-sky-200'
        else if (selectedLog.status === 'Holiday') statusColor = 'bg-amber-100 text-amber-800 border-amber-200'

        const initials = selectedLog.employeeName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
        let avatarGrad = 'from-slate-400 to-slate-600'
        if (selectedLog.status === 'Full Day') avatarGrad = 'from-emerald-500 to-teal-600'
        else if (selectedLog.status === 'Half Day') avatarGrad = 'from-sky-500 to-indigo-600'
        else if (selectedLog.status === 'Holiday') avatarGrad = 'from-amber-400 to-orange-500'

        return (
          <div
            className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[60] flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setSelectedLog(null) }}
          >
            <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-xl overflow-hidden shadow-2xl flex flex-col animate-fade-in-up max-h-[90vh]">

              {/* Modal Header */}
              <div className="relative bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-900 text-white p-6 pb-8 shrink-0">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="absolute top-4 right-4 text-white/60 hover:text-white p-1.5 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${avatarGrad} flex items-center justify-center text-lg font-black shadow-xl shrink-0`}>
                    {initials}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-amber-300 uppercase tracking-widest mb-1">
                      {selectedLog.date} &nbsp;·&nbsp; Task Log Detail
                    </p>
                    <h3 className="text-xl font-extrabold text-white leading-tight">{selectedLog.employeeName}</h3>
                    <p className="text-xs text-slate-300 font-medium mt-0.5">
                      {selectedLog.employeeRole} &nbsp;·&nbsp; {selectedLog.employeeId}
                    </p>
                  </div>
                </div>

                {/* Status + hours pills */}
                <div className="flex items-center gap-2 mt-5">
                  <span className={`text-[10px] uppercase font-extrabold tracking-widest px-3 py-1.5 rounded-lg border ${statusColor}`}>
                    {selectedLog.status}
                  </span>
                  <span className="text-[10px] font-extrabold text-white/80 bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg uppercase tracking-widest flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {selectedLog.status === 'Holiday' ? '0 Hours' : `${selectedLog.hours} Hours Total`}
                  </span>
                  {selectedLog.submittedAt && (
                    <span className="ml-auto text-[9px] text-white/50 font-semibold">
                      Submitted {new Date(selectedLog.submittedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              </div>

              {/* Modal Body */}
              <div className="overflow-y-auto flex-1 px-6 pb-6 pt-5 flex flex-col gap-4">

                {selectedLog.status === 'Holiday' ? (
                  <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                    <span className="text-2xl mt-0.5">🌴</span>
                    <div>
                      <p className="text-xs font-extrabold text-amber-700 uppercase tracking-wider mb-1">Holiday / Leave Reason</p>
                      <p className="text-sm text-amber-900 font-medium leading-relaxed">{selectedLog.description}</p>
                    </div>
                  </div>
                ) : modalHasStructured ? (
                  <div className="flex flex-col gap-4">

                    {/* Before Lunch Section */}
                    {modalBeforePoints.length > 0 && (
                      <div className="rounded-2xl border border-sky-200 overflow-hidden">
                        <div className="bg-sky-50 px-4 py-2.5 flex items-center justify-between border-b border-sky-200">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-sky-500" />
                            <span className="text-[10px] font-extrabold text-sky-800 uppercase tracking-widest">Before Lunch &nbsp;·&nbsp; प्रथम पाली</span>
                          </div>
                          {selectedLog.hoursBefore !== undefined && (
                            <span className="text-[10px] font-extrabold text-sky-700 bg-sky-100 border border-sky-200 px-2 py-0.5 rounded-lg">
                              {selectedLog.hoursBefore} hrs
                            </span>
                          )}
                        </div>
                        <div className="px-4 py-3 flex flex-col gap-2 bg-white">
                          {modalBeforePoints.map((pt, i) => (
                            <div key={i} className="flex items-start gap-2.5">
                              <div className="w-5 h-5 rounded-full bg-sky-100 border border-sky-200 flex items-center justify-center shrink-0 mt-0.5">
                                <span className="text-[9px] font-extrabold text-sky-600">{i + 1}</span>
                              </div>
                              <span className="text-sm text-slate-700 font-medium leading-snug">{pt}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* After Lunch Section */}
                    {modalAfterPoints.length > 0 && (
                      <div className="rounded-2xl border border-emerald-200 overflow-hidden">
                        <div className="bg-emerald-50 px-4 py-2.5 flex items-center justify-between border-b border-emerald-200">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-widest">After Lunch &nbsp;·&nbsp; द्वितीय पाली</span>
                          </div>
                          {selectedLog.hoursAfter !== undefined && (
                            <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-lg">
                              {selectedLog.hoursAfter} hrs
                            </span>
                          )}
                        </div>
                        <div className="px-4 py-3 flex flex-col gap-2 bg-white">
                          {modalAfterPoints.map((pt, i) => (
                            <div key={i} className="flex items-start gap-2.5">
                              <div className="w-5 h-5 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0 mt-0.5">
                                <span className="text-[9px] font-extrabold text-emerald-600">{i + 1}</span>
                              </div>
                              <span className="text-sm text-slate-700 font-medium leading-snug">{pt}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                    <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" /> Work Description
                    </p>
                    <p className="text-sm text-slate-700 font-medium leading-relaxed whitespace-pre-line">
                      {selectedLog.description}
                    </p>
                  </div>
                )}

                {/* Footer timestamp */}
                {selectedLog.submittedAt && (
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold border-t border-slate-100 pt-3">
                    <span>Log submitted by: <strong className="text-slate-600">{selectedLog.employeeName}</strong></span>
                    <span>{new Date(selectedLog.submittedAt).toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>

              {/* Modal close footer button */}
              <div className="px-6 pb-5 shrink-0">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        )
      })()}

      {/* ── Location Settings Modal ── */}
      {isLocationOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-md overflow-hidden shadow-2xl flex flex-col animate-fade-in-up">
            {/* Header */}
            <div className="bg-emerald-950 text-white p-6 relative shrink-0">
              <button onClick={() => setIsLocationOpen(false)}
                className="absolute top-4 right-4 text-white/70 hover:text-white p-1 hover:bg-white/10 rounded-full transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
              <span className="text-[10px] font-bold text-amber-300 uppercase tracking-widest block mb-1">Access Control</span>
              <h3 className="text-xl font-bold text-white leading-none">📍 Location Settings</h3>
              <p className="text-xs text-slate-300 mt-1">Restrict log submission to office location only</p>
            </div>

            {loadingLocSettings ? (
              <div className="p-8 text-center text-slate-400 text-sm font-semibold">Loading settings...</div>
            ) : (
              <form onSubmit={handleSaveLocation} className="px-6 pb-6 pt-5 flex flex-col gap-5">

                {locFeedback && (
                  <div className={`p-3 rounded-xl text-xs font-semibold border ${
                    locFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-red-50 text-red-800 border-red-100'
                  }`}>{locFeedback.message}</div>
                )}

                {/* Enable / Disable Toggle */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div>
                    <p className="text-sm font-bold text-slate-800">Geo-Restriction</p>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                      {locEnabled ? '🔒 ON — Employees must be at office to submit' : '🔓 OFF — Employees can submit from anywhere'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLocEnabled(!locEnabled)}
                    className="cursor-pointer transition-all"
                  >
                    {locEnabled
                      ? <ToggleRight className="w-10 h-10 text-emerald-600" />
                      : <ToggleLeft className="w-10 h-10 text-slate-400" />
                    }
                  </button>
                </div>

                {/* Office Coordinates */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Office Coordinates</label>
                    <button
                      type="button"
                      onClick={handleUseMyLocation}
                      disabled={gettingLoc}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold border border-sky-200 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Navigation className={`w-3.5 h-3.5 ${gettingLoc ? 'animate-spin' : ''}`} />
                      {gettingLoc ? 'Getting...' : 'Use My Location'}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Latitude</label>
                      <input type="text" value={locLat} onChange={e => setLocLat(e.target.value)}
                        placeholder="e.g. 22.7196" required
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 font-mono text-slate-800 bg-white" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Longitude</label>
                      <input type="text" value={locLng} onChange={e => setLocLng(e.target.value)}
                        placeholder="e.g. 75.8577" required
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 font-mono text-slate-800 bg-white" />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    Click &quot;Use My Location&quot; while at the office to auto-fill coordinates
                  </p>
                </div>

                {/* Radius */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Allowed Radius</label>
                  <div className="flex gap-2">
                    {['25', '50', '100', '200'].map(r => (
                      <button key={r} type="button" onClick={() => setLocRadius(r)}
                        className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          locRadius === r ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                        }`}>
                        {r}m
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400">Recommended: <strong>50m</strong> for strict office-only access</p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setIsLocationOpen(false)}
                    className="w-1/3 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold text-xs text-slate-500 transition-colors cursor-pointer">
                    Cancel
                  </button>
                  <button type="submit" disabled={savingLoc}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-900 hover:bg-emerald-950 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 shadow-md flex items-center justify-center gap-2">
                    {savingLoc ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</> : '💾 Save Settings'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
