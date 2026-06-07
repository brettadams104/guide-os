'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientRecord } from '@/lib/actions/clients'
import Link from 'next/link'
import { PhoneInput } from '@/components/phone-input'

export default function NewClientPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const form = new FormData(e.currentTarget)
    try {
      await createClientRecord({
        name: form.get('name') as string,
        email: (form.get('email') as string) || null,
        phone: (form.get('phone') as string) || null,
        address: (form.get('address') as string) || null,
        notes: (form.get('notes') as string) || null,
      })
      router.push('/clients')
    } catch (err) {
      setError((err as Error).message)
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/clients" className="text-slate-400 hover:text-slate-600 text-sm">← Clients</Link>
        <h1 className="text-2xl font-bold text-slate-900">New Client</h1>
      </div>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
          <input name="name" type="text" required className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone <span className="text-slate-400 font-normal">(optional)</span></label>
          <PhoneInput />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Email <span className="text-slate-400 font-normal">(optional)</span></label>
          <input name="email" type="email" className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Address <span className="text-slate-400 font-normal">(optional)</span></label>
          <input name="address" type="text" className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes <span className="text-slate-400 font-normal">(optional)</span></label>
          <textarea name="notes" rows={3} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none" placeholder="Preferences, reminders, etc." />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button type="submit" disabled={loading} className="w-full bg-sky-500 hover:bg-sky-400 text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50 text-sm">
          {loading ? 'Saving...' : 'Add Client'}
        </button>
      </form>
    </div>
  )
}
