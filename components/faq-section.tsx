'use client'

import { useState } from 'react'

const FAQS = [
  {
    q: 'How do I start a trip on the water?',
    a: 'Open the trip from your dashboard or Trips page, then tap "Start Trip." This launches Trip Mode — a live tool where you can log catches, take photos, check weather, and track your time on the water.',
  },
  {
    q: 'How do I log a fish catch during a trip?',
    a: 'In Trip Mode, tap the Fish Log tab. Select the species, choose your lure or bait from your presets, add size/weight if you want, and tap Save. The more you fill in your species and lure presets in Settings, the faster this goes.',
  },
  {
    q: 'How do I collect payment from a client?',
    a: 'Open the completed trip and tap "Collect Payment." You\'ll see the remaining balance and can mark it as paid with the payment method used. This updates your financial analytics automatically.',
  },
  {
    q: 'Where do I set up my trip packages and pricing?',
    a: 'Go to Settings → Trip Packages You Offer. Add each package with a name, start/end time, and default price. When you schedule a trip, selecting a package will auto-fill the price and time.',
  },
  {
    q: 'Can I add multiple guides or staff to my account?',
    a: 'Yes. Go to Settings → Your Guides and add each guide by name. When scheduling a trip, you can assign it to a specific guide from your staff list.',
  },
  {
    q: 'How do I add a new client?',
    a: 'You can add clients two ways — from the Clients page directly, or automatically when scheduling a trip by typing a new name in the client field. Their details will be saved for future bookings.',
  },
  {
    q: 'What is Trip Mode and what can I do in it?',
    a: 'Trip Mode is your live guide tool while you\'re on the water. It has five tabs: a timer, weather forecast, fish log, photo capture, and notes. Everything you log is saved to the trip record automatically.',
  },
  {
    q: 'How do I check river flows and water conditions?',
    a: 'Go to the Conditions page and open the Flows tab. Search for your local USGS river gauge and save it. It will show real-time flow (CFS) and gage height every time you open the app.',
  },
  {
    q: 'How do I see my revenue and financial stats?',
    a: 'Open the Analytics page and tap the Financials tab. You\'ll see total revenue, collection rate, best month, outstanding balances, and year-over-year comparisons. You can also filter by year.',
  },
  {
    q: 'Can I restart the app tour if I want to see it again?',
    a: 'Yes — scroll to the bottom of this Settings page and tap "Restart App Tour" under App Tour. It will walk you through every feature from the beginning.',
  },
  {
    q: 'What happens to my data if I delete my account?',
    a: 'Deleting your account permanently removes all your trips, clients, catches, photos, and financial data. This cannot be undone. Make sure to export anything you need before deleting.',
  },
  {
    q: 'How do I update my weather location?',
    a: 'Go to Settings → Weather Location. Type your city or town and select it from the dropdown. The app will use this for your weather forecast and conditions page. You can also change your location directly from the Conditions page.',
  },
]

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div className="divide-y divide-slate-100">
      {FAQS.map((faq, i) => (
        <div key={i}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between py-3.5 text-left gap-3 group"
          >
            <span className="text-sm font-medium text-slate-800 group-hover:text-sky-600 transition-colors">
              {faq.q}
            </span>
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className={`shrink-0 transition-transform duration-200 ${open === i ? 'rotate-180' : ''}`}
            >
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          {open === i && (
            <p className="text-sm text-slate-500 leading-relaxed pb-4 pr-6">
              {faq.a}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
