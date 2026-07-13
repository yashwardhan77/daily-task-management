import { getConsumptionReport } from '@/lib/actions/inventory/reports'

export default async function ConsumptionReportPage() {
  const data = await getConsumptionReport()
  const totalValue = data.reduce((a: number, r: any) => a + r.consumption_value, 0)
  const totalConsumed = data.length

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900">Consumption Report</h1>
        <p className="text-sm text-slate-500 mt-1">Audit report of materials consumed during events</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center">
          <p className="text-xs text-slate-500">Consumption Records</p>
          <p className="text-xl font-extrabold text-slate-900">{totalConsumed}</p>
        </div>
        <div className="bg-amber-50 rounded-2xl border border-amber-100 shadow-sm p-4 text-center">
          <p className="text-xs text-amber-700 font-semibold">Total Consumption Value</p>
          <p className="text-xl font-extrabold text-amber-700">₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
        </div>
        <div className="bg-emerald-50 rounded-2xl border border-emerald-100 shadow-sm p-4 text-center">
          <p className="text-xs text-emerald-700 font-semibold">Distinct Programs</p>
          <p className="text-xl font-extrabold text-emerald-700">{new Set(data.map((r: any) => r.program_id)).size}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead className="sticky top-0 bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Program</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Material</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Group</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Issued</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Consumed</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-emerald-600">Returned</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-16 text-center text-slate-400">No consumption records found.</td></tr>
              ) : (
                data.map((r: any) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 text-xs text-slate-500 font-mono">{new Date(r.entry_date).toLocaleDateString('en-IN')}</td>
                    <td className="px-4 py-3 text-slate-750 text-xs">{r.program_name}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{r.material_name}</td>
                    <td className="px-4 py-3"><span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-semibold">{r.group_name}</span></td>
                    <td className="px-4 py-3 text-right text-slate-600 font-mono text-xs">{Number(r.issued_qty).toFixed(3)}</td>
                    <td className="px-4 py-3 text-right font-bold text-amber-700 font-mono">{Number(r.consumed_qty).toFixed(3)}</td>
                    <td className={`px-4 py-3 text-right font-bold font-mono ${Number(r.returned_qty) > 0 ? 'text-emerald-600' : 'text-slate-300'}`}>
                      {Number(r.returned_qty).toFixed(3)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-700 font-mono">₹{r.consumption_value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="border-t-2 border-slate-200 bg-amber-50 font-sans">
              <tr>
                <td colSpan={7} className="px-4 py-3 text-right font-extrabold text-slate-800">Total Consumption Value:</td>
                <td className="px-4 py-3 text-right font-extrabold text-amber-700 text-base">₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
