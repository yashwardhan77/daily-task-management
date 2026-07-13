'use client'

import { useState, useTransition } from 'react'
import { saveTemplate, deleteTemplate, cloneTemplate, saveTemplateItems, getTemplateWithItems } from '@/lib/actions/inventory/programs'

function Toast({ msg, type, onClose }: any) {
  return (
    <div className={`fixed top-5 right-5 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-xl text-white shadow-2xl ${type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
      <span className="text-sm font-semibold">{msg}</span>
      <button onClick={onClose} className="text-white/80 text-lg leading-none">×</button>
    </div>
  )
}

export default function TemplatesClient({ initialTemplates, materials, groups }: any) {
  const [templates, setTemplates] = useState(initialTemplates)
  const [toast, setToast] = useState<any>(null)
  const [isPending, startTransition] = useTransition()
  const [modal, setModal] = useState<'new' | 'edit' | 'items' | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [form, setForm] = useState({ name: '', description: '' })
  const [templateItems, setTemplateItems] = useState<any[]>([])
  const [newItem, setNewItem] = useState({ material_id: '', qty_per_person: '', unit: 'Kg' })
  const [filterGroup, setFilterGroup] = useState('')

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3500)
  }

  const refreshTemplates = async () => {
    const { getTemplates } = await import('@/lib/actions/inventory/programs')
    const fresh = await getTemplates()
    setTemplates(fresh)
  }

  const openNew = () => { setForm({ name: '', description: '' }); setModal('new') }

  const handleSave = () => {
    if (!form.name.trim()) { showToast('Template name is required.', 'error'); return }
    startTransition(async () => {
      const res = await saveTemplate({ id: selectedTemplate?.id, name: form.name, description: form.description })
      if (res.success) { showToast(res.message, 'success'); setModal(null); await refreshTemplates() }
      else showToast(res.message, 'error')
    })
  }

  const openItems = async (t: any) => {
    setSelectedTemplate(t)
    const { items } = await getTemplateWithItems(t.id)
    setTemplateItems(items.map((i: any) => ({ ...i, material_name: i.inv_materials?.name, unit: i.unit })))
    setNewItem({ material_id: '', qty_per_person: '', unit: materials[0]?.unit || 'Kg' })
    setModal('items')
  }

  const addItem = () => {
    if (!newItem.material_id || !newItem.qty_per_person) { showToast('Material and quantity per person are required.', 'error'); return }
    const mat = materials.find((m: any) => m.id === newItem.material_id)
    if (templateItems.find((i: any) => i.material_id === newItem.material_id)) {
      showToast('This material has already been added to the template.', 'error'); return
    }
    setTemplateItems(prev => [...prev, {
      material_id: newItem.material_id, qty_per_person: Number(newItem.qty_per_person),
      unit: newItem.unit, material_name: mat?.name, _new: true
    }])
    setNewItem({ material_id: '', qty_per_person: '', unit: 'Kg' })
  }

  const removeItem = (idx: number) => setTemplateItems(prev => prev.filter((_, i) => i !== idx))

  const saveItems = () => {
    startTransition(async () => {
      const res = await saveTemplateItems(selectedTemplate.id, templateItems)
      if (res.success) { showToast(res.message, 'success'); setModal(null) }
      else showToast(res.message, 'error')
    })
  }

  const handleClone = (id: string) => {
    startTransition(async () => {
      const res = await cloneTemplate(id)
      showToast(res.message, res.success ? 'success' : 'error')
      if (res.success) await refreshTemplates()
    })
  }

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return
    startTransition(async () => {
      const res = await deleteTemplate(id)
      showToast(res.message, res.success ? 'success' : 'error')
      if (res.success) setTemplates((ts: any[]) => ts.filter((t: any) => t.id !== id))
    })
  }

  const filteredMaterials = filterGroup ? materials.filter((m: any) => m.group_id === filterGroup) : materials

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Templates</h1>
          <p className="text-sm text-slate-500 mt-1">Configure item checklists for program types</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl transition-colors shadow-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          New Template
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <p className="text-slate-500">No templates found. Click &quot;New Template&quot; to get started!</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {templates.map((t: any) => (
            <div key={t.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              <div className="p-5 border-b border-slate-50">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-900">{t.name}</h3>
                    {t.description && <p className="text-xs text-slate-400 mt-1">{t.description}</p>}
                  </div>
                  <span className="flex-shrink-0 text-xs bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full font-semibold">
                    {t.inv_template_items?.[0]?.count ?? '?'} Items
                  </span>
                </div>
              </div>
              <div className="p-4 flex flex-wrap gap-2">
                <button onClick={() => openItems(t)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  Manage Items
                </button>
                <button onClick={() => handleClone(t.id)} className="px-3 py-2 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors">
                  Clone
                </button>
                <button onClick={() => handleDelete(t.id)} className="px-3 py-2 bg-red-50 text-red-500 hover:bg-red-100 rounded-xl text-xs font-bold transition-colors">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Template Modal */}
      {modal === 'new' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">Create Template</h3>
              <button onClick={() => setModal(null)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 text-lg">×</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Template Name <span className="text-red-500">*</span></label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. District Committee Meet Template" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
                <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional details" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm outline-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleSave} disabled={isPending} className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl disabled:opacity-60 text-sm">{isPending ? 'Creating...' : 'Create'}</button>
                <button onClick={() => setModal(null)} className="px-4 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl text-sm">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Items Modal */}
      {modal === 'items' && selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
              <div>
                <h3 className="font-bold text-slate-900">{selectedTemplate.name}</h3>
                <p className="text-xs text-slate-500">Add materials and default quantity per attendee</p>
              </div>
              <button onClick={() => setModal(null)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 text-lg">×</button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {/* Existing items */}
              {templateItems.length > 0 && (
                <div className="bg-slate-50 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-slate-200"><th className="text-left px-4 py-2 text-xs font-bold text-slate-500">Material</th><th className="text-right px-4 py-2 text-xs font-bold text-slate-500">Qty Per Attendee</th><th className="text-center px-4 py-2 text-xs font-bold text-slate-500">Unit</th><th className="px-4 py-2 w-8"></th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {templateItems.map((item: any, i: number) => (
                        <tr key={i}>
                          <td className="px-4 py-2 font-medium text-slate-700">{item.material_name || item.inv_materials?.name}</td>
                          <td className="px-4 py-2 text-right font-bold text-slate-800">{item.qty_per_person}</td>
                          <td className="px-4 py-2 text-center text-xs bg-slate-100 text-slate-600 font-mono font-semibold">{item.unit}</td>
                          <td className="px-4 py-2 text-center"><button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Add new item */}
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                <p className="text-xs font-bold text-amber-800 mb-3">Add Material to Template</p>
                <div className="flex gap-2 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <label className="text-xs text-slate-500 mb-1 block">Group Filter</label>
                    <select value={filterGroup} onChange={e => setFilterGroup(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500 mb-2 bg-white">
                      <option value="">All Groups</option>
                      {groups.filter((g: any) => g.is_active).map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                    <select value={newItem.material_id} onChange={e => { const mat = materials.find((m: any) => m.id === e.target.value); setNewItem(n => ({ ...n, material_id: e.target.value, unit: mat?.unit || 'Kg' })) }} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500 bg-white">
                      <option value="">Select Material</option>
                      {filteredMaterials.map((m: any) => <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}
                    </select>
                  </div>
                  <div className="w-28">
                    <label className="text-xs text-slate-500 mb-1 block">Qty/Attendee</label>
                    <input type="number" step="0.001" min="0.001" value={newItem.qty_per_person} onChange={e => setNewItem(n => ({ ...n, qty_per_person: e.target.value }))} placeholder="0.250" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500" />
                    <p className="text-xs text-slate-400 mt-1">{newItem.unit}</p>
                  </div>
                  <div className="self-end">
                    <button onClick={addItem} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-lg transition-colors">+ Add</button>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex gap-3 flex-shrink-0">
              <button onClick={saveItems} disabled={isPending} className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl disabled:opacity-60 text-sm">{isPending ? 'Saving...' : `Save ${templateItems.length} Items`}</button>
              <button onClick={() => setModal(null)} className="px-4 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl text-sm">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
