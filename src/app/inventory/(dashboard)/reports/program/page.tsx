import { getProgramReport } from '@/lib/actions/inventory/reports'

const STATUS_COLORS: Record<string, string> = {
  planned: 'bg-blue-100 text-blue-700', active: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-slate-100 text-slate-600', cancelled: 'bg-red-100 text-red-600',
}
const STATUS_LABELS: Record<string, string> = {
  planned: 'Planned', active: 'Active', completed: 'Completed', cancelled: 'Cancelled',
}

export default async function ProgramReportPage() {
  const programs = await getProgramReport()
  const totalEstimated = programs.reduce((a: number, p: any) => a + p.estimated_cost, 0)
  const totalActual = programs.reduce((a: number, p: any) => a + p.actual_cost, 0)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900">Program Report</h1>
        <p className="text-sm text-slate-500 mt-1">{programs.length} Programs Tracked</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center">
          <p className="text-xs text-slate-500">Total Programs</p>
          <p className="text-xl font-extrabold text-slate-900">{programs.length}</p>
        </div>
        <div className="bg-indigo-50 rounded-2xl border border-indigo-100 shadow-sm p-4 text-center">
          <p className="text-xs text-indigo-700 font-semibold">Total Estimated Cost</p>
          <p className="text-xl font-extrabold text-indigo-700">₹{totalEstimated.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
        </div>
        <div className="bg-amber-50 rounded-2xl border border-amber-100 shadow-sm p-4 text-center">
          <p className="text-xs text-amber-700 font-semibold">Total Actual Cost</p>
          <p className="text-xl font-extrabold text-amber-700">₹{totalActual.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
        </div>
        <div className="bg-emerald-50 rounded-2xl border border-emerald-100 shadow-sm p-4 text-center">
          <p className="text-xs text-emerald-700 font-semibold">Total Attendees</p>
          <p className="text-xl font-extrabold text-emerald-700">{programs.reduce((a: number, p: any) => a + p.participants_count, 0)}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider w-8">#</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Program</th>
                <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Dates</th>
                <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Attendees</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Estimated</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Actual Expense</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Per Person Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {programs.map((p: any, i: number) => (
                <tr key={p.id} className="hover:bg-amber-50/30 transition-colors">
                  <td className="px-4 py-3 text-slate-400 text-xs">{i + 1}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800">{p.name}</p>
                    {p.location && <p className="text-xs text-slate-400">📍 {p.location}</p>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_COLORS[p.status] || 'bg-slate-100 text-slate-600'}`}>
                      {STATUS_LABELS[p.status] || p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {new Date(p.start_date).toLocaleDateString('en-IN')} — {new Date(p.end_date).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-slate-700">{p.participants_count}</td>
                  <td className="px-4 py-3 text-right text-slate-600 font-mono">
                    {p.estimated_cost > 0 ? `₹${p.estimated_cost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-amber-700 font-mono">
                    {p.actual_cost > 0 ? `₹${p.actual_cost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-emerald-700 font-semibold font-mono">
                    {p.cost_per_person > 0 ? `₹${p.cost_per_person.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-slate-200 bg-slate-50 font-sans">
              <tr>
                <td colSpan={5} className="px-4 py-3 text-right font-extrabold text-slate-800">Total:</td>
                <td className="px-4 py-3 text-right font-bold text-slate-700">₹{totalEstimated.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                <td className="px-4 py-3 text-right font-bold text-amber-700">₹{totalActual.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
