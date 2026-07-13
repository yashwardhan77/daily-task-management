'use client'

import { useState, useTransition, useMemo } from 'react'
import { addStockEntry, deleteStockEntry } from '@/lib/actions/inventory/stock'

function Toast({ msg, type, onClose }: any) {
  return (
    <div className={`fixed top-5 right-5 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-xl text-white shadow-2xl ${type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
      <span className="text-sm font-semibold">{msg}</span>
      <button onClick={onClose} className="text-white/80 text-lg">×</button>
    </div>
  )
}

const today = new Date().toISOString().split('T')[0]

export default function StockEntryClient({ materials, groups, initialEntries, stockMap }: any) {
  const [entries, setEntries] = useState(initialEntries)
  const [toast, setToast] = useState<any>(null)
  const [isPending, startTransition] = useTransition()
  const [filterGroup, setFilterGroup] = useState('')
  const [form, setForm] = useState({ entry_date: today, material_id: '', quantity: '', rate: '', supplier: '', remarks: '' })

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 4000)
  }

  const filteredMaterials = filterGroup ? materials.filter((m: any) => m.group_id === filterGroup) : materials

  const selectedMat = materials.find((m: any) => m.id === form.material_id)
  const amount = form.quantity && form.rate ? (Number(form.quantity) * Number(form.rate)).toFixed(2) : '0.00'
  const currentStock = selectedMat ? (stockMap[selectedMat.id] || 0) : 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.material_id) { showToast('Material selection is required.', 'error'); return }
    if (!form.quantity || Number(form.quantity) <= 0) { showToast('Quantity must be greater than 0.', 'error'); return }
    if (Number(form.rate) < 0) { showToast('Rate cannot be negative.', 'error'); return }

    startTransition(async () => {
      const res = await addStockEntry({
        entry_date: form.entry_date, material_id: form.material_id,
        quantity: Number(form.quantity), rate: Number(form.rate),
        supplier: form.supplier, remarks: form.remarks,
      })
      if (res.success) {
        showToast(res.message, 'success')
        setForm(f => ({ ...f, material_id: '', quantity: '', rate: '', supplier: '', remarks: '' }))
        const { getStockEntries } = await import('@/lib/actions/inventory/stock')
        const fresh = await getStockEntries()
        setEntries(fresh)
      } else {
        showToast(res.message, 'error')
      }
    })
  }

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return
    startTransition(async () => {
      const res = await deleteStockEntry(id)
      showToast(res.message, res.success ? 'success' : 'error')
      if (res.success) setEntries((es: any[]) => es.filter((e: any) => e.id !== id))
    })
  }

  const totalAmount = useMemo(() => entries.slice(0, 30).reduce((a: number, e: any) => a + Number(e.amount), 0), [entries])

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900">Stock Entry</h1>
        <p className="text-sm text-slate-500 mt-1">Log new material purchases or acquisitions</p>
      </div>

      <div className="grid lg:grid-cols-[400px,1fr] gap-6">
        {/* Entry Form */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="font-bold text-slate-800 mb-5 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center font-bold">+</span>
            New Receipt
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Date</label>
              <input type="date" value={form.entry_date} onChange={e => setForm(f => ({ ...f, entry_date: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Group Filter</label>
              <select value={filterGroup} onChange={e => { setFilterGroup(e.target.value); setForm(f => ({ ...f, material_id: '', quantity: '', rate: '' })) }} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm outline-none bg-white">
                <option value="">All Groups</option>
                {groups.filter((g: any) => g.is_active).map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Material <span className="text-red-500">*</span></label>
              <select value={form.material_id} onChange={e => { const m = materials.find((x: any) => x.id === e.target.value); setForm(f => ({ ...f, material_id: e.target.value, rate: String(m?.current_rate || '') })) }} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm outline-none bg-white">
                <option value="">— Select Material —</option>
                {filteredMaterials.map((m: any) => <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}
              </select>
              {selectedMat && (
                <div className="mt-2 flex items-center gap-3 text-xs">
                  <span className="text-slate-500">Current Stock: <strong className="text-slate-700">{Math.max(0, currentStock).toFixed(2)} {selectedMat.unit}</strong></span>
                  {selectedMat.min_rate && selectedMat.max_rate && (
                    <span className="text-amber-600 font-medium">Range: ₹{selectedMat.min_rate}–₹{selectedMat.max_rate}</span>
                  )}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Quantity <span className="text-red-500">*</span></label>
                <input type="number" step="0.001" min="0.001" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} placeholder="0.000" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm outline-none" />
                {selectedMat && <p className="text-xs text-slate-400 mt-0.5">{selectedMat.unit}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Rate (₹/{selectedMat?.unit || 'unit'})</label>
                <input type="number" step="0.01" min="0" value={form.rate} onChange={e => setForm(f => ({ ...f, rate: e.target.value }))} placeholder="0.00" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm outline-none" />
              </div>
            </div>
            {/* Amount preview */}
            <div className="bg-amber-50 rounded-xl px-4 py-3 border border-amber-100">
              <div className="flex justify-between items-center">
                <span className="text-sm text-amber-700 font-semibold">Total Amount</span>
                <span className="text-xl font-extrabold text-amber-700 font-mono">₹{Number(amount).toLocaleString('en-IN')}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Supplier Name</label>
              <input type="text" value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} placeholder="e.g. Laxmi Traders" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Remarks</label>
              <input type="text" value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} placeholder="Optional notes" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm outline-none" />
            </div>
            <button type="submit" disabled={isPending} className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-colors disabled:opacity-60 text-sm">
              {isPending ? 'Logging...' : '✓ Log Receipt'}
            </button>
          </form>
        </div>

        {/* Recent Entries */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900">Recent Receipts (Last 30)</h2>
            <span className="text-xs text-slate-400 font-semibold">Total: ₹{totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          </div>
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Material</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Quantity</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Rate</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Supplier</th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {entries.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-16 text-center text-slate-400">No stock entries logged.</td></tr>
                ) : (
                  entries.map((e: any) => (
                    <tr key={e.id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="px-4 py-3 text-slate-600 text-xs font-mono">{new Date(e.entry_date).toLocaleDateString('en-IN')}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800">{e.inv_materials?.name}</p>
                        <p className="text-xs text-slate-400">{e.inv_materials?.inv_material_groups?.name}</p>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-700">{Number(e.quantity).toFixed(2)} <span className="text-xs text-slate-400 font-semibold">{e.inv_materials?.unit}</span></td>
                      <td className="px-4 py-3 text-right text-slate-600 text-xs font-mono">₹{Number(e.rate).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-right font-bold text-amber-700 font-mono">₹{Number(e.amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{e.supplier || '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => handleDelete(e.id)} className="p-1 rounded hover:bg-red-100 text-red-400 hover:text-red-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
