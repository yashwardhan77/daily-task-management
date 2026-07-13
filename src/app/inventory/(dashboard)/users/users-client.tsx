'use client'

import { useState, useTransition } from 'react'
import { saveInvUser, toggleInvUserStatus } from '@/lib/actions/inventory/auth'

const emptyForm = { name: '', username: '', password_plain: '', role: 'inventory_manager' }

function Toast({ msg, type, onClose }: any) {
  return (
    <div className={`fixed top-5 right-5 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-xl text-white shadow-2xl ${type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
      <span className="text-sm font-semibold">{msg}</span>
      <button onClick={onClose} className="text-white/80 text-lg">×</button>
    </div>
  )
}

export default function UsersClient({ initialUsers }: any) {
  const [users, setUsers] = useState(initialUsers)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState(emptyForm)
  const [toast, setToast] = useState<any>(null)
  const [isPending, startTransition] = useTransition()
  const [showPass, setShowPass] = useState(false)

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3500)
  }

  const openAdd = () => { setEditing(null); setForm(emptyForm); setModal(true) }
  const openEdit = (u: any) => { setEditing(u); setForm({ name: u.name, username: u.username, password_plain: '', role: u.role }); setModal(true) }

  const handleSave = () => {
    if (!form.name.trim() || !form.username.trim()) { showToast('Name and username are required.', 'error'); return }
    if (!editing && !form.password_plain) { showToast('Password is required for new users.', 'error'); return }
    startTransition(async () => {
      const res = await saveInvUser({ id: editing?.id, name: form.name, username: form.username, password_plain: form.password_plain, role: form.role })
      if (res.success) {
        showToast(res.message, 'success')
        setModal(false)
        const { getInvUsers } = await import('@/lib/actions/inventory/auth')
        const fresh = await getInvUsers()
        setUsers(fresh.data)
      } else {
        showToast(res.message, 'error')
      }
    })
  }

  const handleToggle = (u: any) => {
    startTransition(async () => {
      const res = await toggleInvUserStatus(u.id, !u.is_active)
      showToast(res.message, res.success ? 'success' : 'error')
      if (res.success) setUsers((us: any[]) => us.map((x: any) => x.id === u.id ? { ...x, is_active: !u.is_active } : x))
    })
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">User Management</h1>
          <p className="text-sm text-slate-500 mt-1">Configure inventory system operators and viewers</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl transition-colors shadow-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Operator
        </button>
      </div>

      {/* Admin note */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-5 py-4 mb-6 flex items-start gap-3">
        <svg className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <div className="text-sm text-indigo-700">
          <p className="font-bold mb-1">Super Admin Account</p>
          <p>The main system Super Admin (admin / adminpassword123) is always active by default. Use this panel to add or edit secondary Store Manager operators.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">#</th>
              <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</th>
              <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Username</th>
              <th className="text-center px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
              <th className="text-center px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="text-right px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Registered</th>
              <th className="text-right px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {users.length === 0 ? (
              <tr><td colSpan={7} className="px-5 py-16 text-center text-slate-400">No operators registered yet.</td></tr>
            ) : (
              users.map((u: any, i: number) => (
                <tr key={u.id} className="hover:bg-amber-50/30 transition-colors">
                  <td className="px-5 py-3.5 text-slate-400 text-xs">{i + 1}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-indigo-600 font-bold text-sm">{u.name.charAt(0)}</span>
                      </div>
                      <span className="font-semibold text-slate-800">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-slate-600 text-xs">{u.username}</td>
                  <td className="px-5 py-3.5 text-center">
                    <span className="text-xs bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full font-semibold">
                      {u.role === 'inventory_manager' ? 'Store Manager' : 'Viewer'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <button onClick={() => handleToggle(u)} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-colors ${u.is_active ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-emerald-500' : 'bg-red-400'}`} />
                      {u.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-5 py-3.5 text-right text-xs text-slate-400">{new Date(u.created_at).toLocaleDateString('en-IN')}</td>
                  <td className="px-5 py-3.5 text-right">
                    <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg hover:bg-indigo-100 text-indigo-500 hover:text-indigo-700">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">{editing ? 'Edit Operator' : 'Add Operator'}</h3>
              <button onClick={() => setModal(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 text-lg">×</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name <span className="text-red-500">*</span></label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Store Manager" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Username <span className="text-red-500">*</span></label>
                <input type="text" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value.toLowerCase() }))} placeholder="e.g. store2" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm outline-none font-mono" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password {!editing && <span className="text-red-500">*</span>}{editing && <span className="text-xs text-slate-400">(leave blank to keep unchanged)</span>}</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} value={form.password_plain} onChange={e => setForm(f => ({ ...f, password_plain: e.target.value }))} placeholder={editing ? 'New password (optional)' : 'Password'} className="w-full pr-10 px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm outline-none" />
                  <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showPass ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" : "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"} /></svg>
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Role</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm outline-none bg-white">
                  <option value="inventory_manager">Store Manager</option>
                  <option value="viewer">Viewer (Read Only)</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleSave} disabled={isPending} className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-sm disabled:opacity-60">
                  {isPending ? 'Saving...' : 'Save'}
                </button>
                <button onClick={() => setModal(false)} className="px-4 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl text-sm">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
