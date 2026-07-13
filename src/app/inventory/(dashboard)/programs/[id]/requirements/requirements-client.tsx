'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { addRequirementItem, deleteRequirementItem } from '@/lib/actions/inventory/programs'

export default function RequirementsClient({ program, requirements: initialReqs, materials }: any) {
  const [reqs, setReqs] = useState(initialReqs)
  const [isPending, startTransition] = useTransition()
  const [toast, setToast] = useState<any>(null)
  const [addModal, setAddModal] = useState(false)
  const [newItem, setNewItem] = useState({ material_id: '', required_qty: '', rate_at_time: '', unit: 'Kg' })

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3500)
  }

  const refresh = async () => {
    const { getProgramRequirements } = await import('@/lib/actions/inventory/programs')
    const fresh = await getProgramRequirements(program.id)
    setReqs(fresh)
  }

  const handleAdd = () => {
    if (!newItem.material_id || !newItem.required_qty) { showToast('Material and quantity are required.', 'error'); return }
    startTransition(async () => {
      const res = await addRequirementItem({
        program_id: program.id, material_id: newItem.material_id,
        required_qty: Number(newItem.required_qty), unit: newItem.unit, rate_at_time: Number(newItem.rate_at_time),
      })
      if (res.success) { showToast(res.message, 'success'); setAddModal(false); await refresh() }
      else showToast(res.message, 'error')
    })
  }

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this requirement?')) return
    startTransition(async () => {
      const res = await deleteRequirementItem(id)
      showToast(res.message, res.success ? 'success' : 'error')
      if (res.success) setReqs((rs: any[]) => rs.filter((r: any) => r.id !== id))
    })
  }

  const totalCost = reqs.reduce((a: number, r: any) => a + Number(r.estimated_cost), 0)
  const perPersonCost = program.participants_count > 0 ? totalCost / program.participants_count : 0

  const handlePrint = () => window.print()

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {toast && (
        <div className={`fixed top-5 right-5 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-xl text-white shadow-2xl ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
          <span className="text-sm font-semibold">{toast.msg}</span>
          <button onClick={() => setToast(null)} className="text-white/80 text-lg">×</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 print:mb-8">
        <div>
          <Link href={`/inventory/programs/${program.id}`} className="text-slate-400 text-sm hover:text-slate-600 print:hidden">← Back</Link>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">Requirements Sheet</h1>
          <p className="text-lg font-bold text-indigo-700">{program.name}</p>
          <p className="text-sm text-slate-500">{program.location} • {program.participants_count} attendees • {new Date(program.start_date).toLocaleDateString('en-IN')}</p>
        </div>
        <div className="flex gap-2 print:hidden">
          <button onClick={() => setAddModal(true)} className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-sm">
            + Add Item
          </button>
          <button onClick={handlePrint} className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-sm">
            🖨️ Print / PDF
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-indigo-50 rounded-2xl p-4 text-center border border-indigo-100">
          <p className="text-xs text-indigo-600 font-semibold mb-1">Total Items</p>
          <p className="text-2xl font-extrabold text-indigo-700">{reqs.length}</p>
        </div>
        <div className="bg-amber-50 rounded-2xl p-4 text-center border border-amber-100">
          <p className="text-xs text-amber-700 font-semibold mb-1">Est. Total Cost</p>
          <p className="text-2xl font-extrabold text-amber-700 font-sans">₹{totalCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
        </div>
        <div className="bg-emerald-50 rounded-2xl p-4 text-center border border-emerald-100">
          <p className="text-xs text-emerald-700 font-semibold mb-1">Cost Per Person</p>
          <p className="text-2xl font-extrabold text-emerald-700 font-sans">₹{perPersonCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 print:hidden">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Item Breakdown</p>
        </div>
        {/* Print Header */}
        <div className="hidden print:block px-6 py-4 border-b border-slate-200">
          <div className="text-center mb-4">
            <h2 className="text-xl font-extrabold">Vidhya Bharati Sewadham</h2>
            <h3 className="text-lg font-bold mt-1">Material Checklist & Estimated Sheet</h3>
            <p className="text-sm mt-1">{program.name} | {program.location} | Attendees: {program.participants_count}</p>
            <p className="text-sm">{new Date(program.start_date).toLocaleDateString('en-IN')} — {new Date(program.end_date).toLocaleDateString('en-IN')}</p>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider w-10">#</th>
              <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Material</th>
              <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Unit</th>
              <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Required Qty</th>
              <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Rate</th>
              <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Estimated Cost</th>
              <th className="text-center px-4 py-3 print:hidden text-xs font-bold text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {reqs.length === 0 ? (
              <tr><td colSpan={7} className="px-5 py-16 text-center text-slate-400">No requirements logged.</td></tr>
            ) : (
              reqs.map((r: any, i: number) => (
                <tr key={r.id} className="hover:bg-amber-50/30 transition-colors">
                  <td className="px-5 py-3 text-slate-400 text-xs">{i + 1}</td>
                  <td className="px-5 py-3">
                    <p className="font-semibold text-slate-800">{r.inv_materials?.name}</p>
                    <p className="text-xs text-slate-400">{r.inv_materials?.inv_material_groups?.name}</p>
                  </td>
                  <td className="px-4 py-3 text-center"><span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold font-mono">{r.unit}</span></td>
                  <td className="px-4 py-3 text-right font-bold text-slate-800 font-mono">{Number(r.required_qty).toFixed(3)}</td>
                  <td className="px-4 py-3 text-right text-slate-600 font-mono">₹{Number(r.rate_at_time).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-right font-bold text-amber-700 font-mono">₹{Number(r.estimated_cost).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                  <td className="px-4 py-3 text-center print:hidden">
                    <button onClick={() => handleDelete(r.id)} className="p-1 rounded hover:bg-red-100 text-red-400 hover:text-red-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot className="border-t-2 border-slate-200 bg-amber-50 font-sans">
            <tr>
              <td colSpan={5} className="px-5 py-3 text-right font-extrabold text-slate-800">Total Est. Cost:</td>
              <td className="px-4 py-3 text-right font-extrabold text-amber-700 text-base">₹{totalCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
              <td className="print:hidden" />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Add Modal */}
      {addModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">Add Material</h3>
              <button onClick={() => setAddModal(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 text-lg">×</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Material <span className="text-red-500">*</span></label>
                <select value={newItem.material_id} onChange={e => { const m = materials.find((x: any) => x.id === e.target.value); setNewItem(n => ({ ...n, material_id: e.target.value, unit: m?.unit || 'Kg', rate_at_time: String(m?.current_rate || '') })) }} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm outline-none bg-white">
                  <option value="">Select Material</option>
                  {materials.map((m: any) => <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Required Qty <span className="text-red-500">*</span></label>
                  <input type="number" step="0.001" min="0" value={newItem.required_qty} onChange={e => setNewItem(n => ({ ...n, required_qty: e.target.value }))} placeholder="0.000" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Est. Rate (₹)</label>
                  <input type="number" step="0.01" min="0" value={newItem.rate_at_time} onChange={e => setNewItem(n => ({ ...n, rate_at_time: e.target.value }))} placeholder="0.00" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm outline-none" />
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={handleAdd} disabled={isPending} className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-sm disabled:opacity-60">{isPending ? 'Adding...' : 'Add Item'}</button>
                <button onClick={() => setAddModal(false)} className="px-4 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl text-sm">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print\\:block, .print\\:block * { visibility: visible; }
          table, table * { visibility: visible; }
          #__next { visibility: visible; }
          @page { size: A4; margin: 1.5cm; }
        }
      `}</style>
    </div>
  )
}
