import { getDashboardStats } from '@/lib/actions/inventory/reports'
import { getLowStockItems } from '@/lib/actions/inventory/reports'
import Link from 'next/link'

const STATUS_COLORS: Record<string, string> = {
  planned: 'bg-blue-100 text-blue-700',
  active: 'bg-green-100 text-green-700',
  completed: 'bg-slate-100 text-slate-600',
  cancelled: 'bg-red-100 text-red-600',
}
const STATUS_LABELS: Record<string, string> = {
  planned: 'Planned', active: 'Active', completed: 'Completed', cancelled: 'Cancelled',
}

function StatCard({ title, value, sub, color, icon }: any) {
  return (
    <div className={`bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500 mb-1">{title}</p>
          <p className={`text-3xl font-extrabold ${color}`}>{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color.replace('text-', 'bg-').replace('700', '50').replace('600', '50').replace('900', '50')}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

export default async function DashboardPage() {
  const [stats, lowStock] = await Promise.all([getDashboardStats(), getLowStockItems()])

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Training Centre — Inventory Portal</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5 mb-8">
        <div className="xl:col-span-2">
          <StatCard
            title="Total Programs"
            value={stats.totalPrograms}
            sub="All logged programs"
            color="text-indigo-700"
            icon={<svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
          />
        </div>
        <div className="xl:col-span-2">
          <StatCard
            title="Total Materials"
            value={stats.totalMaterials}
            sub="Active materials registered"
            color="text-emerald-700"
            icon={<svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
          />
        </div>
        <div className="xl:col-span-2">
          <StatCard
            title="Stock Value"
            value={`₹${stats.stockValue.toLocaleString('en-IN')}`}
            sub="Total estimated value in store"
            color="text-amber-700"
            icon={<svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
        </div>
        <div className="xl:col-span-2">
          <StatCard
            title="Low Stock Alert"
            value={stats.lowStockCount}
            sub="Below minimum threshold"
            color={stats.lowStockCount > 0 ? 'text-red-600' : 'text-slate-500'}
            icon={<svg className={`w-6 h-6 ${stats.lowStockCount > 0 ? 'text-red-500' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
          />
        </div>
        <div className="xl:col-span-2">
          <StatCard
            title="Upcoming Programs"
            value={stats.upcomingPrograms.length}
            sub="Next 30 days schedule"
            color="text-blue-700"
            icon={<svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
          />
        </div>
        <div className="xl:col-span-2">
          <StatCard
            title="Monthly Purchase"
            value={`₹${stats.monthlyPurchase.toLocaleString('en-IN')}`}
            sub="Total purchases in last 30 days"
            color="text-purple-700"
            icon={<svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upcoming Programs */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900">Upcoming Programs</h2>
            <Link href="/inventory/programs" className="text-xs text-amber-600 hover:text-amber-700 font-semibold">View All →</Link>
          </div>
          {stats.upcomingPrograms.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-400 text-sm">
              No upcoming programs scheduled.
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {stats.upcomingPrograms.map((p: any) => (
                <Link key={p.id} href={`/inventory/programs/${p.id}`} className="flex items-center gap-4 px-6 py-3.5 hover:bg-amber-50/50 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">{p.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{p.location} • {p.participants_count} attendees</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold text-slate-700">{new Date(p.start_date).toLocaleDateString('en-IN')}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[p.status] || 'bg-slate-100 text-slate-600'}`}>
                      {STATUS_LABELS[p.status] || p.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Low Stock Alerts
            </h2>
            <Link href="/inventory/reports/stock" className="text-xs text-amber-600 hover:text-amber-700 font-semibold">Report →</Link>
          </div>
          {lowStock.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-slate-500 text-sm font-medium">All items have sufficient stock levels.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
              {lowStock.slice(0, 10).map((item: any) => (
                <div key={item.id} className="flex items-center gap-4 px-6 py-3 hover:bg-red-50/50 transition-colors">
                  <div className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{item.name}</p>
                    <p className="text-xs text-slate-400">{item.group}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-red-600">{item.current_stock.toFixed(2)} {item.unit}</p>
                    <p className="text-xs text-slate-400">Min Threshold: {item.min_stock_level}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { href: '/inventory/programs/new', label: 'Create Program', icon: '🗓️', color: 'from-indigo-500 to-indigo-700' },
          { href: '/inventory/stock/entry', label: 'Add Stock Receipt', icon: '📦', color: 'from-amber-500 to-amber-700' },
          { href: '/inventory/templates', label: 'Create Template', icon: '📄', color: 'from-emerald-500 to-emerald-700' },
          { href: '/inventory/reports/stock', label: 'View Stock Report', icon: '📊', color: 'from-purple-500 to-purple-700' },
        ].map(a => (
          <Link
            key={a.href}
            href={a.href}
            className={`bg-gradient-to-br ${a.color} rounded-2xl p-5 text-white flex flex-col items-center gap-2 hover:shadow-lg hover:scale-[1.02] transition-all duration-200`}
          >
            <span className="text-2xl">{a.icon}</span>
            <span className="text-sm font-bold text-center">{a.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
