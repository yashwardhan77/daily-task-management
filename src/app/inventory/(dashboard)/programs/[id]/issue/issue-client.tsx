'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { issueMaterial } from '@/lib/actions/inventory/stock'

const today = new Date().toISOString().split('T')[0]

export default function IssueClient({ program, materials, groups, stockMap, initialIssues }: any) {
  const [issues, setIssues] = useState(initialIssues)
  const [isPending, startTransition] = useTransition()
  const [toast, setToast] = useState<any>(null)
  const [filterGroup, setFilterGroup] = useState('')
  const [form, setForm] = useState({ material_id: '', issued_qty: '', issue_date: today, remarks: '' })

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 4000)
  }

  const filteredMaterials = filterGroup ? materials.filter((m: any) => m.group_id === filterGroup) : materials
  const selectedMat = materials.find((m: any) => m.id === form.material_id)
  const availableStock = selectedMat ? Math.max(0, stockMap[selectedMat.id] || 0) : 0
  const isOverStock = selectedMat && form.issued_qty && Number(form.issued_qty) > availableStock

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.material_id) { showToast('Material selection is required.', 'error'); return }
    if (!form.issued_qty || Number(form.issued_qty) <= 0) { showToast('Quantity must be greater than 0.', 'error'); return }
    if (isOverStock) { showToast(`Insufficient stock! Available: ${availableStock.toFixed(3)} ${selectedMat?.unit}`, 'error'); return }

    startTransition(async () => {
      const res = await issueMaterial({
        program_id: program.id, material_id: form.material_id,
        issued_qty: Number(form.issued_qty), issue_date: form.issue_date, remarks: form.remarks,
      })
      if (res.success) {
        showToast(res.message, 'success')
        setForm(f => ({ ...f, material_id: '', issued_qty: '', remarks: '' }))
        const { getMaterialIssues } = await import('@/lib/actions/inventory/stock')
        const fresh = await getMaterialIssues({ programId: program.id })
        setIssues(fresh)
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
        <h1 className="text-2xl font-extrabold text-slate-900 mt-1">Issue Materials</h1>
        <p className="text-lg text-indigo-700 font-bold">{program.name}</p>
        <p className="text-sm text-slate-500">{program.participants_count} attendees • {new Date(program.start_date).toLocaleDateString('en-IN')}</p>
      </div>

      <div className="grid lg:grid-cols-[380px,1fr] gap-6">
        {/* Issue Form */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="font-bold text-slate-800 mb-5">Issue Item</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Issue Date</label>
              <input type="date" value={form.issue_date} onChange={e => setForm(f => ({ ...f, issue_date: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm outline-none font-sans" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Group Filter</label>
              <select value={filterGroup} onChange={e => { setFilterGroup(e.target.value); setForm(f => ({ ...f, material_id: '', issued_qty: '' })) }} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm outline-none bg-white">
                <option value="">All Groups</option>
                {groups.filter((g: any) => g.is_active).map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Material <span className="text-red-500">*</span></label>
              <select value={form.material_id} onChange={e => setForm(f => ({ ...f, material_id: e.target.value, issued_qty: '' }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm outline-none bg-white">
                <option value="">— Select Material —</option>
                {filteredMaterials.map((m: any) => {
                  const stock = Math.max(0, stockMap[m.id] || 0)
                  return <option key={m.id} value={m.id}>{m.name} — Available: {stock.toFixed(2)} {m.unit}</option>
                })}
              </select>
              {selectedMat && (
                <div className={`mt-2 text-xs font-bold px-3 py-1.5 rounded-lg ${availableStock > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                  Available Stock: {availableStock.toFixed(3)} {selectedMat.unit}
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Issued Quantity <span className="text-red-500">*</span></label>
              <input type="number" step="0.001" min="0.001" max={availableStock || undefined} value={form.issued_qty} onChange={e => setForm(f => ({ ...f, issued_qty: e.target.value }))} placeholder="0.000" className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:border-transparent text-sm outline-none ${isOverStock ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 focus:ring-amber-500'}`} />
              {isOverStock && <p className="text-xs text-red-500 mt-1 font-semibold">⚠ Requested quantity exceeds available stock!</p>}
              {selectedMat && <p className="text-xs text-slate-400 mt-0.5">{selectedMat.unit}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Remarks</label>
              <input type="text" value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} placeholder="Optional details" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm outline-none" />
            </div>
            <button type="submit" disabled={isPending || !!isOverStock} className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-colors disabled:opacity-60 text-sm">
              {isPending ? 'Issuing...' : '✓ Issue Material'}
            </button>
          </form>
        </div>

        {/* Issues List */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900">Issued Materials Log — {program.name}</h2>
          </div>
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Material</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Issued Qty</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {issues.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-16 text-center text-slate-400">No materials issued yet.</td></tr>
                ) : (
                  issues.map((i: any) => (
                    <tr key={i.id} className="hover:bg-amber-50/30">
                      <td className="px-4 py-3 text-xs text-slate-500 font-mono">{new Date(i.issue_date).toLocaleDateString('en-IN')}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{i.inv_materials?.name}</td>
                      <td className="px-4 py-3 text-right font-bold text-amber-700 font-mono">{Number(i.issued_qty).toFixed(3)} <span className="text-xs text-slate-400 font-semibold">{i.inv_materials?.unit}</span></td>
                      <td className="px-4 py-3 text-xs text-slate-400">{i.remarks || '—'}</td>
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
