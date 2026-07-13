'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { addConsumption } from '@/lib/actions/inventory/stock'

const today = new Date().toISOString().split('T')[0]

export default function ConsumptionClient({ program, materials, groups, initialEntries }: any) {
  const [entries, setEntries] = useState(initialEntries)
  const [isPending, startTransition] = useTransition()
  const [toast, setToast] = useState<any>(null)
  const [filterGroup, setFilterGroup] = useState('')
  const [form, setForm] = useState({ material_id: '', issued_qty: '', consumed_qty: '', entry_date: today, remarks: '' })

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 4000)
  }

  const filteredMaterials = filterGroup ? materials.filter((m: any) => m.group_id === filterGroup) : materials
  const selectedMat = materials.find((m: any) => m.id === form.material_id)
  const returned = form.issued_qty && form.consumed_qty
    ? Math.max(0, Number(form.issued_qty) - Number(form.consumed_qty))
    : 0
  const isInvalid = form.consumed_qty && form.issued_qty && Number(form.consumed_qty) > Number(form.issued_qty)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.material_id) { showToast('Material selection is required.', 'error'); return }
    if (!form.issued_qty || Number(form.issued_qty) <= 0) { showToast('Issued quantity must be greater than 0.', 'error'); return }
    if (Number(form.consumed_qty) < 0) { showToast('Consumed quantity cannot be negative.', 'error'); return }
    if (Number(form.consumed_qty) > Number(form.issued_qty)) { showToast('Consumed quantity cannot exceed issued quantity.', 'error'); return }

    startTransition(async () => {
      const res = await addConsumption({
        program_id: program.id, material_id: form.material_id,
        issued_qty: Number(form.issued_qty), consumed_qty: Number(form.consumed_qty),
        entry_date: form.entry_date, remarks: form.remarks,
      })
      if (res.success) {
        showToast(res.message, 'success')
        setForm(f => ({ ...f, material_id: '', issued_qty: '', consumed_qty: '', remarks: '' }))
        const { getConsumptionEntries } = await import('@/lib/actions/inventory/stock')
        const fresh = await getConsumptionEntries({ programId: program.id })
        setEntries(fresh)
      } else {
        showToast(res.message, 'error')
      }
    })
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {toast && (
        <div className={`fixed top-5 right-5 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-xl text-white shadow-2xl ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
          <span className="text-sm font-semibold">{toast.msg}</span>
          <button onClick={() => setToast(null)} className="text-white/80 text-lg">×</button>
        </div>
      )}

      <div className="mb-6">
        <Link href={`/inventory/programs/${program.id}`} className="text-slate-400 text-sm hover:text-slate-600">← Back</Link>
        <h1 className="text-2xl font-extrabold text-slate-900 mt-1">Log Material Consumption</h1>
        <p className="text-lg text-indigo-700 font-bold">{program.name}</p>
        <p className="text-sm text-slate-500">{program.participants_count} attendees</p>
      </div>

      <div className="grid lg:grid-cols-[400px,1fr] gap-6">
        {/* Form */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="font-bold text-slate-800 mb-5">Consumption Log</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Date</label>
              <input type="date" value={form.entry_date} onChange={e => setForm(f => ({ ...f, entry_date: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Group</label>
              <select value={filterGroup} onChange={e => { setFilterGroup(e.target.value); setForm(f => ({ ...f, material_id: '', issued_qty: '', consumed_qty: '' })) }} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm outline-none bg-white">
                <option value="">All Groups</option>
                {groups.filter((g: any) => g.is_active).map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Material <span className="text-red-500">*</span></label>
              <select value={form.material_id} onChange={e => setForm(f => ({ ...f, material_id: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm outline-none bg-white">
                <option value="">— Select Material —</option>
                {filteredMaterials.map((m: any) => <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Issued Quantity <span className="text-red-500">*</span></label>
                <input type="number" step="0.001" min="0.001" value={form.issued_qty} onChange={e => setForm(f => ({ ...f, issued_qty: e.target.value }))} placeholder="0.000" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm outline-none" />
                {selectedMat && <p className="text-xs text-slate-400 mt-0.5">{selectedMat.unit}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Consumed Qty <span className="text-red-500">*</span></label>
                <input type="number" step="0.001" min="0" value={form.consumed_qty} onChange={e => setForm(f => ({ ...f, consumed_qty: e.target.value }))} placeholder="0.000" className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:border-transparent text-sm outline-none ${isInvalid ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 focus:ring-amber-500'}`} />
                {isInvalid && <p className="text-xs text-red-500 mt-0.5 font-semibold">⚠ Cannot exceed issued quantity!</p>}
              </div>
            </div>
            {/* Returns preview */}
            {form.issued_qty && form.consumed_qty && !isInvalid && (
              <div className="bg-emerald-50 rounded-xl px-4 py-3 border border-emerald-100">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-emerald-700 font-semibold">Stock Returned</span>
                  <span className="font-extrabold text-emerald-700 font-mono">+{returned.toFixed(3)} {selectedMat?.unit || ''}</span>
                </div>
                <p className="text-xs text-emerald-600 mt-0.5">This remaining balance will be automatically returned to store ledger.</p>
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Remarks</label>
              <input type="text" value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} placeholder="Optional notes" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm outline-none" />
            </div>
            <button type="submit" disabled={isPending || !!isInvalid} className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors disabled:opacity-60 text-sm">
              {isPending ? 'Logging...' : '✓ Log Consumption'}
            </button>
          </form>
        </div>

        {/* Entries */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900">Consumption Audit Log</h2>
          </div>
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Material</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Issued</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Consumed</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-emerald-600">Returned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {entries.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-16 text-center text-slate-400">No consumption entries recorded.</td></tr>
                ) : (
                  entries.map((e: any) => (
                    <tr key={e.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 text-xs text-slate-500 font-mono">{new Date(e.entry_date).toLocaleDateString('en-IN')}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{e.inv_materials?.name}</td>
                      <td className="px-4 py-3 text-right text-slate-600 font-mono text-xs">{Number(e.issued_qty).toFixed(3)}</td>
                      <td className="px-4 py-3 text-right font-bold text-amber-700 font-mono">{Number(e.consumed_qty).toFixed(3)}</td>
                      <td className={`px-4 py-3 text-right font-bold font-mono ${Number(e.returned_qty) > 0 ? 'text-emerald-600' : 'text-slate-300'}`}>
                        {Number(e.returned_qty).toFixed(3)}
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
