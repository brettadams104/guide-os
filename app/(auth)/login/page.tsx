'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LogoMark } from '@/components/logo'

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 10)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

export default function LoginPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')

  const [email,           setEmail]           = useState('')
  const [password,        setPassword]        = useState('')
  const [name,            setName]            = useState('')
  const [phone,           setPhone]           = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [error,    setError]    = useState<string | null>(null)
  const [loading,  setLoading]  = useState(false)
  const [signedUp, setSignedUp] = useState(false)
  const router = useRouter()

  function switchMode(next: 'signin' | 'signup') {
    setMode(next)
    setError(null)
    setConfirmPassword('')
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) }
    else { router.push('/dashboard'); router.refresh() }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 10) {
      setError('Please enter a valid 10-digit phone number')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name: name.trim(), phone: phone.trim() } },
    })
    if (error) { setError(error.message); setLoading(false) }
    else { setSignedUp(true); setLoading(false) }
  }

  const inputClass = 'w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm'
  const labelClass = 'block text-sm font-medium text-slate-300 mb-1.5'

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f1f35] p-4">
      <div className="w-full max-w-sm space-y-7">

        <div className="text-center flex flex-col items-center gap-3">
          <LogoMark size={56} variant="on-dark" />
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">GuideStride</h1>
            <p className="text-slate-400 text-sm mt-1">
              {mode === 'signin' ? 'Sign in to your account' : 'Create your account'}
            </p>
          </div>
        </div>

        <div className="flex bg-white/5 border border-white/10 rounded-xl p-1">
          {(['signin', 'signup'] as const).map(m => (
            <button key={m} type="button" onClick={() => switchMode(m)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode === m ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'}`}>
              {m === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        {signedUp ? (
          <div className="bg-green-500/20 border border-green-500/30 rounded-2xl p-6 text-center space-y-2">
            <p className="text-green-300 font-semibold">Account created!</p>
            <p className="text-slate-400 text-sm">Check your email to confirm your account, then sign in.</p>
            <button onClick={() => { setSignedUp(false); switchMode('signin') }} className="text-sky-400 text-sm hover:text-sky-300 underline mt-1">
              Go to Sign In
            </button>
          </div>
        ) : mode === 'signin' ? (
          <form onSubmit={handleSignIn} className="space-y-4 bg-white/5 border border-white/10 rounded-2xl p-6">
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className={inputClass} placeholder="you@example.com" />
            </div>
            <div>
              <label className={labelClass}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className={inputClass} placeholder="••••••••" />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button type="submit" disabled={loading} className="w-full bg-sky-500 hover:bg-sky-400 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 text-sm">
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignUp} className="space-y-4 bg-white/5 border border-white/10 rounded-2xl p-6">
            <div>
              <label className={labelClass}>Your Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required className={inputClass} placeholder="John Smith" />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className={inputClass} placeholder="you@example.com" />
            </div>
            <div>
              <label className={labelClass}>Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(formatPhone(e.target.value))}
                required
                className={inputClass}
                placeholder="(555) 555-5555"
              />
            </div>
            <div>
              <label className={labelClass}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className={inputClass} placeholder="At least 6 characters" />
            </div>
            <div>
              <label className={labelClass}>Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className={inputClass} placeholder="••••••••" />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button type="submit" disabled={loading} className="w-full bg-sky-500 hover:bg-sky-400 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 text-sm">
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>
        )}

      </div>
    </div>
  )
}
