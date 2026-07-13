'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createProgram } from '@/lib/actions/inventory/programs'

const PROGRAM_TYPES = ['District Committee Meet', 'State Committee Meet', 'Training Workshop', 'Residential Camp', 'Volunteer Meet', 'Service Camp', 'Other']

export default function NewProgramPage({ templates, materials }: { templates: any[]; materials: any[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '', program_type: '', template_id: '', location: '',
    start_date: '', end_date: '', participants_count: '', remarks: '',
  })

  const f = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }))

  const selectedTemplate = templates.find((t: any) => t.id === form.template_id)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.name.trim()) { setError('Program name is required.'); return }
    if (!form.start_date) { setError('Start date is required.'); return }
    if (!form.end_date) { setError('End date is required.'); return }
    if (!form.participants_count || Number(form.participants_count) < 1) { setError('Attendees count must be at least 1.'); return }

    startTransition(async () => {
      const res = await createProgram({
        name: form.name, program_type: form.program_type, template_id: form.template_id || undefined,
        location: form.location, start_date: form.start_date, end_date: form.end_date,
        participants_count: Number(form.participants_count), remarks: form.remarks,
      })
      if (res.success && res.id) {
        router.push(`/inventory/programs/${res.id}`)
      } else {
        setError(res.message)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900">Create New Program</h1>
        <p className="text-sm text-slate-500 mt-1">Enter program scheduling details and select a checklist template</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
        <div className="grid sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Program Name <span className="text-red-500">*</span></label>
            <input type="text" value={form.name} onChange={e => f('name')(e.target.value)} placeholder="e.g. State Committee Meet — Jhalawar" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm outline-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Program Type</label>
            <select value={form.program_type} onChange={e => f('program_type')(e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm outline-none bg-white">
              <option value="">Select Type</option>
              {PROGRAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Location</label>
            <input type="text" value={form.location} onChange={e => f('location')(e.target.value)} placeholder="e.g. Jhalawar" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm outline-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Start Date <span className="text-red-500">*</span></label>
            <input type="date" value={form.start_date} onChange={e => { f('start_date')(e.target.value); if (!form.end_date) f('end_date')(e.target.value) }} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm outline-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">End Date <span className="text-red-500">*</span></label>
            <input type="date" value={form.end_date} min={form.start_date} onChange={e => f('end_date')(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm outline-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Attendees Count <span className="text-red-500">*</span></label>
            <input type="number" min="1" value={form.participants_count} onChange={e => f('participants_count')(e.target.value)} placeholder="50" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm outline-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Material Template Checklist</label>
            <select value={form.template_id} onChange={e => f('template_id')(e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm outline-none bg-white">
              <option value="">— No Template (Add custom requirements later) —</option>
              {templates.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            {selectedTemplate && (
              <p className="text-xs text-amber-600 mt-1.5">✓ Checklist selected. System will auto-generate initial requirement qty on Save.</p>
            )}
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Remarks / Logistics Details</label>
            <textarea value={form.remarks} onChange={e => f('remarks')(e.target.value)} placeholder="Optional logs or special instructions..." rows={3} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm outline-none resize-none" />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={isPending} className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-colors disabled:opacity-60 text-sm">
            {isPending ? 'Saving...' : 'Create Program →'}
          </button>
          <button type="button" onClick={() => router.back()} className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </form>
  )
}
