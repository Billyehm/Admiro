'use client'

import { FormEvent, useState } from 'react'
import { Edit3, FileText, Plus, Trash2, Type } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { AdminRequirement } from '@/lib/models'

type FormValues = { title: string; subtitle: string; guidance: string; submissionType: AdminRequirement['submissionType'] }
const blankForm: FormValues = { title: '', subtitle: '', guidance: '', submissionType: 'file' }
const modeLabel = { file: 'File upload', text: 'Text response', both: 'File upload + text' }

export default function RequirementsManager({ initialRequirements }: { initialRequirements: AdminRequirement[] }) {
  const router = useRouter()
  const [requirements, setRequirements] = useState(initialRequirements)
  const [form, setForm] = useState<FormValues>(blankForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function change<K extends keyof FormValues>(key: K, value: FormValues[K]) { setForm((current) => ({ ...current, [key]: value })) }
  function beginEdit(item: AdminRequirement) { setEditingId(item.id); setForm({ title: item.title, subtitle: item.subtitle, guidance: item.guidance || '', submissionType: item.submissionType }); setError('') }
  function cancel() { setEditingId(null); setForm(blankForm); setError('') }

  async function save(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError('')
    const endpoint = editingId ? `/api/admin/requirements/${editingId}` : '/api/admin/requirements'
    const response = await fetch(endpoint, { method: editingId ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const result = await response.json()
    if (!response.ok) { setError(result.error || 'Unable to save requirement.'); setSaving(false); return }
    const saved: AdminRequirement = { id: editingId || result.id, title: form.title.trim(), subtitle: form.subtitle.trim(), guidance: form.guidance.trim() || null, submissionType: form.submissionType, displayOrder: editingId ? requirements.find((item) => item.id === editingId)?.displayOrder || 0 : requirements.length, isActive: true }
    setRequirements((items) => editingId ? items.map((item) => item.id === editingId ? saved : item) : [...items, saved])
    cancel(); setSaving(false); router.refresh()
  }

  async function remove(item: AdminRequirement) {
    if (!window.confirm(`Delete “${item.title}”? This also removes its checklist entry for every student.`)) return
    setSaving(true); setError('')
    const response = await fetch(`/api/admin/requirements/${item.id}`, { method: 'DELETE' })
    const result = await response.json()
    if (!response.ok) { setError(result.error || 'Unable to delete requirement.'); setSaving(false); return }
    setRequirements((items) => items.filter((entry) => entry.id !== item.id)); setSaving(false); router.refresh()
  }

  return <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]"><section className="overflow-hidden rounded-3xl border border-[#dfe3da] bg-white"><div className="border-b border-[#dfe3da] px-5 py-5 sm:px-6"><h3 className="font-bold">Published requirements</h3><p className="mt-1 text-sm text-[#667069]">These are shown in every applicant’s checklist.</p></div><div className="divide-y divide-[#edf0e9]">{requirements.map((item, index) => <article key={item.id} className="flex gap-4 px-5 py-5 sm:px-6"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#eff4ea] text-sm font-bold text-[#31583b]">{index + 1}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold">{item.title}</h3><span className="rounded-full bg-[#f0f4ec] px-2.5 py-1 text-xs font-bold text-[#54725d]">{modeLabel[item.submissionType]}</span></div><p className="mt-1 text-sm text-[#667069]">{item.subtitle}</p>{item.guidance && <p className="mt-3 text-sm leading-6 text-[#526157]"><strong>Guidance:</strong> {item.guidance}</p>}</div><div className="flex h-fit gap-1"><button type="button" onClick={() => beginEdit(item)} className="grid size-9 place-items-center rounded-lg text-[#54725d] hover:bg-[#eff4ea]" aria-label={`Edit ${item.title}`}><Edit3 className="size-4" /></button><button type="button" onClick={() => remove(item)} disabled={saving} className="grid size-9 place-items-center rounded-lg text-rose-700 hover:bg-rose-50 disabled:opacity-50" aria-label={`Delete ${item.title}`}><Trash2 className="size-4" /></button></div></article>)}{!requirements.length && <div className="px-6 py-16 text-center text-sm text-[#667069]">No requirements yet. Add the first one using the form.</div>}</div></section><aside className="h-fit rounded-3xl border border-[#dfe3da] bg-white p-5 sm:p-6"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#eff4ea] text-[#17351f]">{editingId ? <Edit3 className="size-5" /> : <Plus className="size-5" />}</span><div><h3 className="font-bold">{editingId ? 'Edit requirement' : 'New requirement'}</h3><p className="text-sm text-[#667069]">Set what applicants need to provide.</p></div></div><form onSubmit={save} className="mt-6 space-y-4"><label className="block text-sm font-semibold">Title<input value={form.title} onChange={(event) => change('title', event.target.value)} className="mt-1 h-11 w-full rounded-xl border border-[#cfd6cc] px-3 font-normal outline-none focus:border-[#64806b]" placeholder="e.g. JAMB UTME result slip" required /></label><label className="block text-sm font-semibold">Subtitle<textarea value={form.subtitle} onChange={(event) => change('subtitle', event.target.value)} className="mt-1 min-h-20 w-full rounded-xl border border-[#cfd6cc] p-3 font-normal outline-none focus:border-[#64806b]" placeholder="A short description shown under the title" required /></label><label className="block text-sm font-semibold">Guidance text<textarea value={form.guidance} onChange={(event) => change('guidance', event.target.value)} className="mt-1 min-h-28 w-full rounded-xl border border-[#cfd6cc] p-3 font-normal outline-none focus:border-[#64806b]" placeholder="Instructions the student should follow" /></label><fieldset><legend className="text-sm font-semibold">Submission type</legend><div className="mt-2 grid gap-2">{(['file', 'text', 'both'] as const).map((mode) => <label key={mode} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition ${form.submissionType === mode ? 'border-[#64806b] bg-[#eff4ea]' : 'border-[#dfe3da]'}`}><input type="radio" checked={form.submissionType === mode} onChange={() => change('submissionType', mode)} className="accent-[#31583b]" /><span className="grid size-8 place-items-center rounded-lg bg-white text-[#54725d]">{mode === 'file' ? <FileText className="size-4" /> : <Type className="size-4" />}</span><span><strong>{modeLabel[mode]}</strong>{mode === 'both' && <small className="block text-[#667069]">Student provides both items</small>}</span></label>)}</div></fieldset>{error && <p className="text-sm text-rose-700">{error}</p>}<div className="flex gap-2"><button disabled={saving} className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#17351f] px-4 text-sm font-bold text-white disabled:opacity-60">{editingId ? <Edit3 className="size-4" /> : <Plus className="size-4" />}{saving ? 'Saving…' : editingId ? 'Save changes' : 'Add requirement'}</button>{editingId && <button type="button" onClick={cancel} className="h-11 rounded-xl border border-[#cfd6cc] px-4 text-sm font-bold">Cancel</button>}</div></form></aside></div>
}
