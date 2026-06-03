'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { updateClientRecord, deleteClientRecord } from '@/lib/actions/clients'
import Link from 'next/link'

export default function EditClientPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const form = new FormData(e.currentTarget)
    try {
      await updateClientRecord(params.id, {
        name: form.get('name') as string,
        email: (form.get('email') as string) || null,
        phone: (form.get('phone') as string) || null,
        address: (form.get('address') as string) || null,
        notes: (form.get('notes') as string) || null,
      })
      router.push(`/clients/${params.id}`)
    } catch (err) { setError((err as Error).message); setLoading(false) }
  }

  async function handleDelete() {
    setDeleting(true)
    await deleteClientRecord(params.id)
    router.push('/clients')
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/clients/${params.id}`} className="text-slate-400 hover:text-slate-600 text-sm">← Client</Link>
        <h1 className="text-2xl font-bold text-slate-900">Edit Client</h1>
      </div>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
        {[
          { name: 'name', label: 'Full Name', type: 'text', required: true },
          { name: 'phone', label: 'Phone', type: 'tel', required: false },
          { name: 'email', label: 'Email', type: 'email', required: false },
          { name: 'address', label: 'Address', type: 'text', required: false },
        ].map(f => (
          <div key={f.name}>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{f.label}</label>
            <input name={f.name} type={f.type} required={f.required} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>
        ))}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
          <textarea name="notes" rows={3} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none" />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button type="submit" disabled={loading} className="w-full bg-sky-500 hover:bg-sky-400 text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50 text-sm">
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </form>

      <div className="bg-white rounded-2xl border border-red-100 p-6 space-y-3">
        <p className="text-sm font-medium text-red-600">Delete Client</p>
        <p className="text-xs text-slate-500">Permanently deletes the client and all trip history.</p>
        {confirming ? (
          <div className="flex gap-2">
            <button onClick={handleDelete} disabled={deleting} className="flex-1 bg-red-500 text-white rounded-xl py-2 text-sm font-semibold hover:bg-red-600 disabled:opacity-50">
              {deleting ? 'Deleting...' : 'Yes, Delete'}
            </button>
            <button onClick={() => setConfirming(false)} className="flex-1 border border-slate-200 rounded-xl py-2 text-sm font-medium hover:bg-slate-50">Cancel</button>
          </div>
        ) : (
          <button onClick={() => setConfirming(true)} className="w-full border border-red-200 text-red-500 rounded-xl py-2 text-sm font-semibold hover:bg-red-50">Delete Client</button>
        )}
      </div>
    </div>
  )
}
