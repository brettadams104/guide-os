import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'GuideStride',
  description: 'Business management for fishing guides',
  icons: { icon: '/favicon.svg' },
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
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
