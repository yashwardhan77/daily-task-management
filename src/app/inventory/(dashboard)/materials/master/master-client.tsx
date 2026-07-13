'use client'

import { useState, useTransition, useMemo } from 'react'
import { saveMaterial, toggleMaterialStatus, deleteMaterial } from '@/lib/actions/inventory/materials'

const UNITS = ['Kg', 'Gram', 'Ltr', 'Ml', 'Packet', 'Piece', 'Box', 'Bundle', 'Number']

function Toast({ msg, type, onClose }: any) {
  return (
    <div className={`fixed top-5 right-5 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-xl text-white shadow-2xl ${type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
      <span className="text-sm font-semibold">{msg}</span>
      <button onClick={onClose} className="text-white/80 hover:text-white text-lg leading-none">×</button>
    </div>
  )
}

const emptyForm = { name: '', group_id: '', unit: 'Kg', current_rate: '', min_rate: '', max_rate: '', description: '', min_stock_level: '0' }

export default function MasterClient({ initialGroups, initialMaterials }: { initialGroups: any[]; initialMaterials: any[] }) {
  const [materials, setMaterials] = useState(initialMaterials)
  const [groups] = useState(initialGroups.filter((g: any) => g.is_active))
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState(emptyForm)
  const [filterGroup, setFilterGroup] = useState('')
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState<any>(null)
  const [isPending, startTransition] = useTransition()

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const openAdd = () => {
    setEditing(null)
    setForm(emptyForm)
    setModal(true)
  }

  const openEdit = (m: any) => {
    setEditing(m)
    setForm({
      name: m.name, group_id: m.group_id, unit: m.unit,
      current_rate: String(m.current_rate || ''), min_rate: String(m.min_rate || ''),
      max_rate: String(m.max_rate || ''), description: m.description || '',
      min_stock_level: String(m.min_stock_level || '0'),
    })
    setModal(true)
  }

  const handleSave = () => {
    startTransition(async () => {
      const res = await saveMaterial({
        id: editing?.id,
        name: form.name, group_id: form.group_id, unit: form.unit,
        current_rate: Number(form.current_rate),
        min_rate: form.min_rate ? Number(form.min_rate) : undefined,
        max_rate: form.max_rate ? Number(form.max_rate) : undefined,
        description: form.description,
        min_stock_level: Number(form.min_stock_level),
      })
      if (res.success) {
        showToast(res.message, 'success')
        setModal(false)
        const { getMaterials } = await import('@/lib/actions/inventory/materials')
        const fresh = await getMaterials()
        setMaterials(fresh)
      } else {
        showToast(res.message, 'error')
      }
    })
  }

  const handleToggle = (m: any) => {
    startTransition(async () => {
      const res = await toggleMaterialStatus(m.id, !m.is_active)
      showToast(res.message, res.success ? 'success' : 'error')
      if (res.success) setMaterials(ms => ms.map(x => x.id === m.id ? { ...x, is_active: !m.is_active } : x))
    })
  }

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this material?')) return
    startTransition(async () => {
      const res = await deleteMaterial(id)
      showToast(res.message, res.success ? 'success' : 'error')
      if (res.success) setMaterials(ms => ms.filter(m => m.id !== id))
    })
  }

  const filtered = useMemo(() => {
    return materials.filter(m => {
      if (filterGroup && m.group_id !== filterGroup) return false
      if (search && !m.name.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [materials, filterGroup, search])

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Material Master</h1>
          <p className="text-sm text-slate-500 mt-1">{materials.length} Materials Registered</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl transition-colors shadow-sm w-fit">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Material
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative">
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none w-52"
          />
        </div>
        <select
          value={filterGroup}
          onChange={e => setFilterGroup(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none bg-white"
        >
          <option value="">All Groups</option>
          {groups.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        {(search || filterGroup) && (
          <button onClick={() => { setSearch(''); setFilterGroup('') }} className="px-3 py-2 text-xs text-slate-500 hover:text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50">
            Reset
          </button>
        )}
        <span className="ml-auto text-sm text-slate-500 self-center">{filtered.length} results</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider w-10">#</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Material Name</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Group</th>
              <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Unit</th>
              <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Current Rate</th>
              <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Rate Range</th>
              <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-16 text-center text-slate-400">No materials found.</td></tr>
            ) : (
              filtered.map((m: any, i: number) => (
                <tr key={m.id} className="hover:bg-amber-50/40 transition-colors">
                  <td className="px-4 py-3 text-slate-400 text-xs font-mono">{i + 1}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800">{m.name}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold">
                      {m.inv_material_groups?.name || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-xs font-bold">{m.unit}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-slate-800">₹{Number(m.current_rate).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-right text-xs text-slate-400">
                    {m.min_rate && m.max_rate ? `₹${m.min_rate}–₹${m.max_rate}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => handleToggle(m)} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-colors ${m.is_active ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${m.is_active ? 'bg-emerald-500' : 'bg-red-400'}`} />
                      {m.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(m)} className="p-1.5 rounded-lg hover:bg-indigo-100 text-indigo-500 hover:text-indigo-700">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={() => handleDelete(m.id)} className="p-1.5 rounded-lg hover:bg-red-100 text-red-400 hover:text-red-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white">
              <h3 className="font-bold text-slate-900">{editing ? 'Edit Material' : 'Add Material'}</h3>
              <button onClick={() => setModal(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 text-lg">×</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Material Name <span className="text-red-500">*</span></label>
                  <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Wheat" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Group <span className="text-red-500">*</span></label>
                  <select value={form.group_id} onChange={e => setForm(f => ({ ...f, group_id: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm outline-none">
                    <option value="">Select Group</option>
                    {groups.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Unit <span className="text-red-500">*</span></label>
                  <select value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm outline-none">
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Current Rate (₹)</label>
                  <input type="number" step="0.01" min="0" value={form.current_rate} onChange={e => setForm(f => ({ ...f, current_rate: e.target.value }))} placeholder="0.00" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Min Stock Alert Level</label>
                  <input type="number" step="0.01" min="0" value={form.min_stock_level} onChange={e => setForm(f => ({ ...f, min_stock_level: e.target.value }))} placeholder="0" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Min Allowed Rate (₹)</label>
                  <input type="number" step="0.01" min="0" value={form.min_rate} onChange={e => setForm(f => ({ ...f, min_rate: e.target.value }))} placeholder="0" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Max Allowed Rate (₹)</label>
                  <input type="number" step="0.01" min="0" value={form.max_rate} onChange={e => setForm(f => ({ ...f, max_rate: e.target.value }))} placeholder="0" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
                  <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description details" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm outline-none" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleSave} disabled={isPending} className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-colors disabled:opacity-60 text-sm">
                  {isPending ? 'Saving...' : 'Save'}
                </button>
                <button onClick={() => setModal(false)} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
