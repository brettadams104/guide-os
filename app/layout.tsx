import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'GuideStride',
  description: 'Business management for fishing guides',
  icons: { icon: '/favicon.svg' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  )
}
