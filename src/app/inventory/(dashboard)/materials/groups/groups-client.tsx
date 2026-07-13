'use client'

import { useState, useTransition, useCallback } from 'react'
import { saveGroup, toggleGroupStatus, deleteGroup } from '@/lib/actions/inventory/materials'

interface Group {
  id: string; name: string; description: string; sort_order: number; is_active: boolean; created_at: string
}

const TOAST_COLORS = { success: 'bg-green-500', error: 'bg-red-500' }

function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) {
  return (
    <div className={`fixed top-5 right-5 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-xl text-white shadow-2xl ${TOAST_COLORS[type]} animate-in slide-in-from-right-5`}>
      <span className="text-sm font-semibold">{msg}</span>
      <button onClick={onClose} className="text-white/80 hover:text-white text-lg leading-none">×</button>
    </div>
  )
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-700 text-lg">×</button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

export default function GroupsClient({ initialGroups }: { initialGroups: Group[] }) {
  const [groups, setGroups] = useState(initialGroups)
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Group | null>(null)
  const [form, setForm] = useState({ name: '', description: '', sort_order: '99' })
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [isPending, startTransition] = useTransition()
  const [deleting, setDeleting] = useState<string | null>(null)

  const showToast = useCallback((msg: string, type: 'success' | 'error') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }, [])

  const openAdd = () => {
    setEditing(null)
    setForm({ name: '', description: '', sort_order: '99' })
    setModal('add')
  }

  const openEdit = (g: Group) => {
    setEditing(g)
    setForm({ name: g.name, description: g.description || '', sort_order: String(g.sort_order) })
    setModal('edit')
  }

  const handleSave = () => {
    if (!form.name.trim()) { showToast('Group name is required.', 'error'); return }
    startTransition(async () => {
      const res = await saveGroup({ id: editing?.id, name: form.name, description: form.description, sort_order: Number(form.sort_order) })
      if (res.success) {
        showToast(res.message, 'success')
        setModal(null)
        const { getMaterialGroups } = await import('@/lib/actions/inventory/materials')
        const fresh = await getMaterialGroups()
        setGroups(fresh)
      } else {
        showToast(res.message, 'error')
      }
    })
  }

  const handleToggle = (g: Group) => {
    startTransition(async () => {
      const res = await toggleGroupStatus(g.id, !g.is_active)
      showToast(res.message, res.success ? 'success' : 'error')
      if (res.success) setGroups(gs => gs.map(x => x.id === g.id ? { ...x, is_active: !g.is_active } : x))
    })
  }

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this group?')) return
    setDeleting(id)
    startTransition(async () => {
      const res = await deleteGroup(id)
      showToast(res.message, res.success ? 'success' : 'error')
      if (res.success) setGroups(gs => gs.filter(x => x.id !== id))
      setDeleting(null)
    })
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Material Groups</h1>
          <p className="text-sm text-slate-500 mt-1">Organize materials into logical categories</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Group
        </button>
      </div>

      {/* Stats */}
      <div className="flex gap-4 mb-6">
        <div className="bg-white rounded-xl px-4 py-3 border border-slate-100 shadow-sm">
          <p className="text-xs text-slate-500">Total Groups</p>
          <p className="text-xl font-extrabold text-slate-900">{groups.length}</p>
        </div>
        <div className="bg-white rounded-xl px-4 py-3 border border-slate-100 shadow-sm">
          <p className="text-xs text-slate-500">Active</p>
          <p className="text-xl font-extrabold text-emerald-600">{groups.filter(g => g.is_active).length}</p>
        </div>
        <div className="bg-white rounded-xl px-4 py-3 border border-slate-100 shadow-sm">
          <p className="text-xs text-slate-500">Inactive</p>
          <p className="text-xl font-extrabold text-red-500">{groups.filter(g => !g.is_active).length}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider w-10">#</th>
              <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Group Name</th>
              <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">Description</th>
              <th className="text-center px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Order</th>
              <th className="text-center px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="text-right px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {groups.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-16 text-center text-slate-400">
                  No groups registered yet. Click &quot;Add Group&quot; to begin.
                </td>
              </tr>
            ) : (
              groups.map((g, i) => (
                <tr key={g.id} className="hover:bg-amber-50/40 transition-colors">
                  <td className="px-5 py-3.5 text-slate-400 font-mono text-xs">{i + 1}</td>
                  <td className="px-5 py-3.5">
                    <span className="font-semibold text-slate-800">{g.name}</span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 hidden md:table-cell">{g.description || '—'}</td>
                  <td className="px-5 py-3.5 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-600 font-bold text-sm">{g.sort_order}</span>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <button onClick={() => handleToggle(g)} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-colors ${g.is_active ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${g.is_active ? 'bg-emerald-500' : 'bg-red-400'}`} />
                      {g.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(g)} className="p-1.5 rounded-lg hover:bg-indigo-100 text-indigo-500 hover:text-indigo-700 transition-colors" title="Edit">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button
                        onClick={() => handleDelete(g.id)}
                        disabled={deleting === g.id}
                        className="p-1.5 rounded-lg hover:bg-red-100 text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
                        title="Delete"
                      >
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
        <Modal title={modal === 'add' ? 'Add Group' : 'Edit Group'} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Group Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Food Inventory"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
              <input
                type="text"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Optional description"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Sort Order</label>
              <input
                type="number"
                value={form.sort_order}
                onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))}
                min="1"
                max="999"
                className="w-32 px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm outline-none transition-all"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleSave} disabled={isPending} className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-colors disabled:opacity-60 text-sm">
                {isPending ? 'Saving...' : 'Save'}
              </button>
              <button onClick={() => setModal(null)} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
