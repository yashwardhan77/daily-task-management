import { getPrograms } from '@/lib/actions/inventory/programs'
import Link from 'next/link'

const STATUS_COLORS: Record<string, string> = {
  planned: 'bg-blue-100 text-blue-700 border-blue-200',
  active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  completed: 'bg-slate-100 text-slate-600 border-slate-200',
  cancelled: 'bg-red-100 text-red-600 border-red-200',
}
const STATUS_LABELS: Record<string, string> = {
  planned: 'Planned', active: 'Active', completed: 'Completed', cancelled: 'Cancelled',
}

export default async function ProgramsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const sp = await searchParams
  const programs = await getPrograms({ status: sp.status })

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Programs</h1>
          <p className="text-sm text-slate-500 mt-1">{programs.length} Programs Logged</p>
        </div>
        <Link href="/inventory/programs/new" className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl transition-colors shadow-sm w-fit">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          New Program
        </Link>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 flex-wrap mb-5">
        {[['', 'All'], ['planned', 'Planned'], ['active', 'Active'], ['completed', 'Completed'], ['cancelled', 'Cancelled']].map(([val, label]) => (
          <Link
            key={val}
            href={val ? `/inventory/programs?status=${val}` : '/inventory/programs'}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors ${sp.status === val || (!sp.status && val === '') ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
          >
            {label}
          </Link>
        ))}
      </div>

      {programs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
          <p className="text-slate-400">No programs found matching filters.</p>
          <Link href="/inventory/programs/new" className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white text-sm font-bold rounded-xl hover:bg-amber-600">
            Create First Program
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {programs.map((p: any) => (
            <Link
              key={p.id}
              href={`/inventory/programs/${p.id}`}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-amber-200 transition-all p-5 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="font-bold text-slate-900">{p.name}</h3>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${STATUS_COLORS[p.status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                    {STATUS_LABELS[p.status] || p.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-1 mt-1.5 text-sm text-slate-500 font-sans">
                  {p.location && <span>📍 {p.location}</span>}
                  <span>👥 {p.participants_count} attendees</span>
                  <span>📅 {new Date(p.start_date).toLocaleDateString('en-IN')} — {new Date(p.end_date).toLocaleDateString('en-IN')}</span>
                  {p.inv_program_templates?.name && <span>📄 Template: {p.inv_program_templates.name}</span>}
                </div>
              </div>
              <div className="flex-shrink-0 text-slate-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
