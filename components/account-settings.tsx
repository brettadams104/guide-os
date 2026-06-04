'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function AccountSettings({ currentEmail }: { currentEmail: string }) {
  const [emailSection, setEmailSection] = useState(false)
  const [passwordSection, setPasswordSection] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [emailSaving, setEmailSaving] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [emailMsg, setEmailMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function handleEmailChange() {
    if (!newEmail.trim()) return
    setEmailSaving(true)
    setEmailMsg(null)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() })
    setEmailSaving(false)
    if (error) {
      setEmailMsg({ type: 'error', text: error.message })
    } else {
      setEmailMsg({ type: 'success', text: `Confirmation sent to ${newEmail}. Check your inbox and click the link to confirm the change.` })
      setNewEmail('')
      setEmailSection(false)
    }
  }

  async function handlePasswordChange() {
    if (!newPassword) return
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Passwords do not match.' })
      return
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 6 characters.' })
      return
    }
    setPasswordSaving(true)
    setPasswordMsg(null)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setPasswordSaving(false)
    if (error) {
      setPasswordMsg({ type: 'error', text: error.message })
    } else {
      setPasswordMsg({ type: 'success', text: 'Password updated successfully.' })
      setNewPassword('')
      setConfirmPassword('')
      setPasswordSection(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
      <h2 className="font-semibold text-slate-900">Account</h2>

      {/* Current email display */}
      <div className="flex items-center justify-between py-2 border-b border-slate-100">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide">Email</p>
          <p className="text-sm font-medium text-slate-900 mt-0.5">{currentEmail}</p>
        </div>
        <button
          onClick={() => { setEmailSection(o => !o); setEmailMsg(null) }}
          className="text-xs text-sky-500 hover:text-sky-600 font-medium"
        >
          {emailSection ? 'Cancel' : 'Change'}
        </button>
      </div>

      {emailSection && (
        <div className="space-y-3">
          <input
            type="email"
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            placeholder="New email address"
            className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          {emailMsg && (
            <p className={`text-xs ${emailMsg.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>{emailMsg.text}</p>
          )}
          <button
            onClick={handleEmailChange}
            disabled={emailSaving || !newEmail}
            className="w-full bg-sky-500 hover:bg-sky-400 text-white font-semibold py-2.5 rounded-xl text-sm disabled:opacity-50 transition-colors"
          >
            {emailSaving ? 'Sending confirmation...' : 'Send Confirmation Email'}
          </button>
          <p className="text-xs text-slate-400">A confirmation link will be sent to your new email. Your email won't change until you click it.</p>
        </div>
      )}

      {/* Password */}
      <div className="flex items-center justify-between py-2 border-b border-slate-100">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide">Password</p>
          <p className="text-sm font-medium text-slate-900 mt-0.5">••••••••</p>
        </div>
        <button
          onClick={() => { setPasswordSection(o => !o); setPasswordMsg(null) }}
          className="text-xs text-sky-500 hover:text-sky-600 font-medium"
        >
          {passwordSection ? 'Cancel' : 'Change'}
        </button>
      </div>

      {passwordSection && (
        <div className="space-y-3">
          <input
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="New password"
            className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          {passwordMsg && (
            <p className={`text-xs ${passwordMsg.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>{passwordMsg.text}</p>
          )}
          <button
            onClick={handlePasswordChange}
            disabled={passwordSaving || !newPassword || !confirmPassword}
            className="w-full bg-sky-500 hover:bg-sky-400 text-white font-semibold py-2.5 rounded-xl text-sm disabled:opacity-50 transition-colors"
          >
            {passwordSaving ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      )}
    </div>
  )
}
