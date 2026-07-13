import { getProgramById, getProgramRequirements } from '@/lib/actions/inventory/programs'
import { getMaterialIssues, getConsumptionEntries } from '@/lib/actions/inventory/stock'
import { notFound } from 'next/navigation'
import Link from 'next/link'

const STATUS_COLORS: Record<string, string> = {
  planned: 'bg-blue-100 text-blue-700', active: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-slate-100 text-slate-600', cancelled: 'bg-red-100 text-red-600',
}
const STATUS_LABELS: Record<string, string> = {
  planned: 'Planned', active: 'Active', completed: 'Completed', cancelled: 'Cancelled',
}

export default async function ProgramDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [program, requirements, issues, consumption] = await Promise.all([
    getProgramById(id),
    getProgramRequirements(id),
    getMaterialIssues({ programId: id }),
    getConsumptionEntries({ programId: id }),
  ])

  if (!program) notFound()

  const totalEstimated = requirements.reduce((a: number, r: any) => a + Number(r.estimated_cost), 0)

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/inventory/programs" className="text-slate-400 hover:text-slate-600 text-sm">← Programs List</Link>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">{program.name}</h1>
          <div className="flex flex-wrap items-center gap-3 mt-2 font-sans">
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${STATUS_COLORS[program.status]}`}>
              {STATUS_LABELS[program.status]}
            </span>
            {program.location && <span className="text-sm text-slate-500">📍 {program.location}</span>}
            <span className="text-sm text-slate-500">👥 {program.participants_count} attendees</span>
            <span className="text-sm text-slate-500">📅 {new Date(program.start_date).toLocaleDateString('en-IN')} — {new Date(program.end_date).toLocaleDateString('en-IN')}</span>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href={`/inventory/programs/${id}/requirements`} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl transition-colors">
            📋 Requirements Sheet
          </Link>
          <Link href={`/inventory/programs/${id}/issue`} className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-colors">
            📦 Issue Materials
          </Link>
          <Link href={`/inventory/programs/${id}/consumption`} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-colors">
            ✅ Log Consumption
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center">
          <p className="text-xs text-slate-500 mb-1">Estimated Budget</p>
          <p className="text-xl font-extrabold text-indigo-700">₹{totalEstimated.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center">
          <p className="text-xs text-slate-500 mb-1">Required Items</p>
          <p className="text-xl font-extrabold text-slate-800">{requirements.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center">
          <p className="text-xs text-slate-500 mb-1">Issued Items</p>
          <p className="text-xl font-extrabold text-amber-700">{issues.length} types</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center">
          <p className="text-xs text-slate-500 mb-1">Consumption Logged</p>
          <p className="text-xl font-extrabold text-emerald-700">{consumption.length}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Requirements */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900">Requirements Preview</h2>
            <Link href={`/inventory/programs/${id}/requirements`} className="text-xs text-amber-600 font-semibold hover:text-amber-700">Details →</Link>
          </div>
          {requirements.length === 0 ? (
            <p className="p-6 text-center text-sm text-slate-400">No custom requirements added yet.</p>
          ) : (
            <div className="divide-y divide-slate-50 max-h-64 overflow-y-auto">
              {requirements.slice(0, 8).map((r: any) => (
                <div key={r.id} className="flex items-center justify-between px-5 py-2.5 text-sm">
                  <span className="text-slate-700 font-medium">{r.inv_materials?.name}</span>
                  <span className="text-slate-500 font-mono text-xs font-semibold">{Number(r.required_qty).toFixed(2)} {r.unit}</span>
                </div>
              ))}
              {requirements.length > 8 && <p className="px-5 py-2 text-xs text-slate-400 text-center">... and {requirements.length - 8} more materials</p>}
            </div>
          )}
        </div>

        {/* Issues */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900">Issued Materials log</h2>
            <Link href={`/inventory/programs/${id}/issue`} className="text-xs text-amber-600 font-semibold hover:text-amber-700">Issue Item →</Link>
          </div>
          {issues.length === 0 ? (
            <p className="p-6 text-center text-sm text-slate-400">No items issued to this program yet.</p>
          ) : (
            <div className="divide-y divide-slate-50 max-h-64 overflow-y-auto">
              {issues.map((i: any) => (
                <div key={i.id} className="flex items-center justify-between px-5 py-2.5 text-sm">
                  <span className="text-slate-700 font-medium">{i.inv_materials?.name}</span>
                  <div className="text-right">
                    <span className="text-amber-700 font-bold font-mono text-xs">{Number(i.issued_qty).toFixed(2)} {i.inv_materials?.unit}</span>
                    <p className="text-slate-400 text-xs">{new Date(i.issue_date).toLocaleDateString('en-IN')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {program.remarks && (
        <div className="mt-6 bg-amber-50 border border-amber-100 rounded-2xl p-5">
          <p className="text-xs font-bold text-amber-700 mb-1">Remarks</p>
          <p className="text-sm text-slate-600">{program.remarks}</p>
        </div>
      )}
    </div>
  )
}
