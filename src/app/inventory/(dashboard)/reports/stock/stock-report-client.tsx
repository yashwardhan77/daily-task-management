'use client'

import { useState, useMemo, useTransition } from 'react'
import { getStockReport } from '@/lib/actions/inventory/reports'

export default function StockReportClient({ initialReport, groups }: any) {
  const [report, setReport] = useState(initialReport)
  const [filterGroup, setFilterGroup] = useState('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')
  const [showLowOnly, setShowLowOnly] = useState(false)
  const [search, setSearch] = useState('')
  const [isPending, startTransition] = useTransition()

  const applyFilters = () => {
    startTransition(async () => {
      const fresh = await getStockReport({ groupId: filterGroup || undefined, fromDate: filterFrom || undefined, toDate: filterTo || undefined })
      setReport(fresh)
    })
  }

  const filtered = useMemo(() => {
    let data = report
    if (showLowOnly) data = data.filter((r: any) => r.is_low)
    if (search) data = data.filter((r: any) => r.name.toLowerCase().includes(search.toLowerCase()))
    return data
  }, [report, showLowOnly, search])

  const totalStockValue = useMemo(() => filtered.reduce((a: number, r: any) => a + r.stock_value, 0), [filtered])
  const lowStockCount = useMemo(() => report.filter((r: any) => r.is_low).length, [report])

  const handlePrint = () => window.print()

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Stock Report</h1>
          <p className="text-sm text-slate-500 mt-1">Current inventory levels, values, and alert limits</p>
        </div>
        <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl print:hidden">
          🖨️ Print Report
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center">
          <p className="text-xs text-slate-500">Materials Count</p>
          <p className="text-xl font-extrabold text-slate-900">{filtered.length}</p>
        </div>
        <div className="bg-amber-50 rounded-2xl border border-amber-100 shadow-sm p-4 text-center">
          <p className="text-xs text-amber-700 font-semibold">Total Stock Value</p>
          <p className="text-xl font-extrabold text-amber-700">₹{totalStockValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
        </div>
        <div className={`rounded-2xl border shadow-sm p-4 text-center ${lowStockCount > 0 ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
          <p className={`text-xs font-semibold ${lowStockCount > 0 ? 'text-red-600' : 'text-emerald-700'}`}>Low Stock Alerts</p>
          <p className={`text-xl font-extrabold ${lowStockCount > 0 ? 'text-red-600' : 'text-emerald-700'}`}>{lowStockCount}</p>
        </div>
        <div className="bg-indigo-50 rounded-2xl border border-indigo-100 shadow-sm p-4 text-center">
          <p className="text-xs text-indigo-700 font-semibold">Filtered Items</p>
          <p className="text-xl font-extrabold text-indigo-700">{filtered.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-5 print:hidden">
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input type="text" placeholder="Search by name..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none w-44" />
          </div>
          <select value={filterGroup} onChange={e => setFilterGroup(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none bg-white">
            <option value="">All Groups</option>
            {groups.filter((g: any) => g.is_active).map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none" placeholder="From Date" />
          <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none" placeholder="To Date" />
          <button onClick={applyFilters} disabled={isPending} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl disabled:opacity-60">{isPending ? '...' : 'Search'}</button>
          <label className="flex items-center gap-2 cursor-pointer self-center">
            <input type="checkbox" checked={showLowOnly} onChange={e => setShowLowOnly(e.target.checked)} className="w-4 h-4 accent-amber-500" />
            <span className="text-sm font-semibold text-red-650">Show Low Stock Only</span>
          </label>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider w-8">#</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Material</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Group</th>
                <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Unit</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Current Stock</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Rate</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Stock Value</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Purchased (Period)</th>
                <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-16 text-center text-slate-400">No stock report records found.</td></tr>
              ) : (
                filtered.map((r: any, i: number) => (
                  <tr key={r.id} className={`hover:bg-slate-50/80 transition-colors ${r.is_low ? 'bg-red-50/50' : ''}`}>
                    <td className="px-4 py-3 text-slate-400 text-xs">{i + 1}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{r.name}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full font-semibold">{r.group}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold font-mono">{r.unit}</span>
                    </td>
                    <td className={`px-4 py-3 text-right font-bold font-mono ${r.is_low ? 'text-red-600' : 'text-slate-800'}`}>
                      {r.current_stock.toFixed(3)}
                      {r.is_low && <span className="ml-1 text-[10px] bg-red-100 text-red-600 px-1 py-0.5 rounded">Low</span>}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600 text-xs font-mono">₹{Number(r.current_rate).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-right font-bold text-amber-700 font-mono">₹{r.stock_value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                    <td className="px-4 py-3 text-right text-slate-600 font-sans">
                      {r.purchased_qty > 0 ? (
                        <div>
                          <p className="font-semibold">{r.purchased_qty.toFixed(2)} {r.unit}</p>
                          <p className="text-xs text-slate-400">₹{r.purchase_amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex w-2 h-2 rounded-full ${r.current_stock === 0 ? 'bg-red-500' : r.is_low ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="border-t-2 border-slate-200 bg-amber-50 font-sans">
              <tr>
                <td colSpan={6} className="px-4 py-3 text-right font-extrabold text-slate-800">Total Stock Value:</td>
                <td className="px-4 py-3 text-right font-extrabold text-amber-700 text-base">₹{totalStockValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
