'use client'

import { useState } from 'react'
import { deleteAccount } from '@/lib/actions/delete-account'

export function DeleteAccountButton() {
  const [open,    setOpen]    = useState(false)
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function handleDelete() {
    if (confirm !== 'DELETE') return
    setLoading(true)
    setError(null)
    try {
      await deleteAccount()
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-red-500 hover:text-red-600 font-medium transition-colors"
      >
        Delete Account
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">

            {/* Header */}
            <div className="bg-red-50 border-b border-red-100 px-6 py-5 flex items-start gap-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                </svg>
              </div>
              <div>
                <h2 className="font-black text-slate-900 text-lg leading-tight">Delete Your Account</h2>
                <p className="text-slate-500 text-sm mt-1 leading-snug">This is permanent and cannot be undone.</p>
              </div>
            </div>

            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-slate-600 leading-relaxed">
                Deleting your account will permanently remove:
              </p>
              <ul className="space-y-1.5 text-sm text-slate-600">
                {['All your trips and catch logs', 'All client records', 'All photos and notes', 'Your analytics and financial history'].map(item => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="text-red-400 font-bold">×</span> {item}
                  </li>
                ))}
              </ul>

              <div className="pt-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Type <span className="font-black text-red-500">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="DELETE"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 font-mono"
                  autoComplete="off"
                />
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => { setOpen(false); setConfirm(''); setError(null) }}
                className="flex-1 border border-slate-200 text-slate-600 font-semibold py-2.5 rounded-xl text-sm hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={confirm !== 'DELETE' || loading}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? 'Deleting…' : 'Delete Account'}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  )
}
