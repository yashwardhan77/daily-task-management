'use client'

import { useState, useMemo, useTransition } from 'react'
import { getStockLedger } from '@/lib/actions/inventory/stock'

const TX_COLORS: Record<string, string> = {
  opening: 'bg-blue-100 text-blue-700',
  purchase: 'bg-emerald-100 text-emerald-700',
  issue: 'bg-amber-100 text-amber-700',
  return: 'bg-indigo-100 text-indigo-700',
  adjustment: 'bg-purple-100 text-purple-700',
}
const TX_LABELS: Record<string, string> = {
  opening: 'Opening', purchase: 'Purchase', issue: 'Issue', return: 'Return', adjustment: 'Adjustment',
}

export default function StockLedgerClient({ initialLedger, materials, groups }: any) {
  const [ledger, setLedger] = useState(initialLedger)
  const [filterMaterial, setFilterMaterial] = useState('')
  const [filterGroup, setFilterGroup] = useState('')
  const [filterType, setFilterType] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [isPending, startTransition] = useTransition()

  const filteredMaterials = filterGroup ? materials.filter((m: any) => m.group_id === filterGroup) : materials

  const applyFilters = () => {
    startTransition(async () => {
      const fresh = await getStockLedger({
        materialId: filterMaterial || undefined,
        transactionType: filterType || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      })
      setLedger(fresh)
    })
  }

  const resetFilters = () => {
    setFilterMaterial(''); setFilterGroup(''); setFilterType(''); setFromDate(''); setToDate('')
    startTransition(async () => {
      const fresh = await getStockLedger()
      setLedger(fresh)
    })
  }

  const totalIn = useMemo(() => ledger.reduce((a: number, r: any) => a + Number(r.qty_in), 0), [ledger])
  const totalOut = useMemo(() => ledger.reduce((a: number, r: any) => a + Number(r.qty_out), 0), [ledger])

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900">Stock Ledger</h1>
        <p className="text-sm text-slate-500 mt-1">Audit log of all incoming, outgoing, and adjusted stock entries</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="bg-emerald-50 rounded-2xl p-4 text-center border border-emerald-100">
          <p className="text-xs text-emerald-700 font-semibold">Total Incoming (In)</p>
          <p className="text-xl font-extrabold text-emerald-700 font-mono">+{totalIn.toFixed(2)}</p>
        </div>
        <div className="bg-red-50 rounded-2xl p-4 text-center border border-red-100">
          <p className="text-xs text-red-700 font-semibold">Total Outgoing (Out)</p>
          <p className="text-xl font-extrabold text-red-600 font-mono">-{totalOut.toFixed(2)}</p>
        </div>
        <div className="bg-indigo-50 rounded-2xl p-4 text-center border border-indigo-100">
          <p className="text-xs text-indigo-700 font-semibold">Transactions Logged</p>
          <p className="text-xl font-extrabold text-indigo-700 font-mono">{ledger.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-5">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Filters</p>
        <div className="flex flex-wrap gap-3">
          <select value={filterGroup} onChange={e => { setFilterGroup(e.target.value); setFilterMaterial('') }} className="px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500 bg-white">
            <option value="">All Groups</option>
            {groups.filter((g: any) => g.is_active).map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <select value={filterMaterial} onChange={e => setFilterMaterial(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500 bg-white">
            <option value="">All Materials</option>
            {filteredMaterials.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500 bg-white">
            <option value="">All Types</option>
            {Object.entries(TX_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500" placeholder="Start Date" />
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500" placeholder="End Date" />
          <button onClick={applyFilters} disabled={isPending} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-60">{isPending ? '...' : 'Search'}</button>
          <button onClick={resetFilters} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-semibold rounded-xl transition-colors">Reset</button>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead className="sticky top-0 bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Material</th>
                <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-emerald-600">Qty In</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-red-500">Qty Out</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Balance</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {ledger.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-16 text-center text-slate-400">No transactions logged.</td></tr>
              ) : (
                ledger.map((r: any) => (
                  <tr key={r.id} className={`hover:bg-slate-50/80 transition-colors ${Number(r.qty_in) > 0 ? 'border-l-2 border-emerald-400' : 'border-l-2 border-red-300'}`}>
                    <td className="px-4 py-3 text-slate-500 text-xs font-mono">{new Date(r.entry_date).toLocaleDateString('en-IN')}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800">{r.inv_materials?.name}</p>
                      <p className="text-xs text-slate-400">{r.inv_materials?.inv_material_groups?.name}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${TX_COLORS[r.transaction_type] || 'bg-slate-100 text-slate-600'}`}>
                        {TX_LABELS[r.transaction_type] || r.transaction_type}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-right font-bold font-mono ${Number(r.qty_in) > 0 ? 'text-emerald-600' : 'text-slate-300'}`}>
                      {Number(r.qty_in) > 0 ? `+${Number(r.qty_in).toFixed(3)}` : '—'}
                    </td>
                    <td className={`px-4 py-3 text-right font-bold font-mono ${Number(r.qty_out) > 0 ? 'text-red-500' : 'text-slate-300'}`}>
                      {Number(r.qty_out) > 0 ? `-${Number(r.qty_out).toFixed(3)}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-extrabold font-mono text-slate-900">{Number(r.balance).toFixed(3)} <span className="text-xs text-slate-400 font-semibold">{r.inv_materials?.unit}</span></td>
                    <td className="px-4 py-3 text-xs text-slate-400">{r.reference_note || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
