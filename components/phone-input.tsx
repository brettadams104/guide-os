'use client'

import { useState } from 'react'

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 10)
  if (digits.length <= 3) return digits.length ? `(${digits}` : ''
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

interface Props {
  name?: string
  defaultValue?: string
  placeholder?: string
  className?: string
  required?: boolean
}

export function PhoneInput({ name = 'phone', defaultValue = '', placeholder = '(555) 000-0000', className, required }: Props) {
  const [value, setValue] = useState(defaultValue ? formatPhone(defaultValue) : '')

  return (
    <input
      type="tel"
      name={name}
      value={value}
      required={required}
      placeholder={placeholder}
      onChange={e => setValue(formatPhone(e.target.value))}
      inputMode="numeric"
      className={className ?? 'w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent'}
    />
  )
}
