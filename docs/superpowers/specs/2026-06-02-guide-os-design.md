# GuideOS — Design Spec
**Date:** 2026-06-02
**Status:** Approved

---

## Overview

GuideOS is a modern business management platform built exclusively for fishing guides. It replaces paper logbooks, group chats, and spreadsheets with a clean, intelligent system that tracks clients, logs trips, auto-collects environmental data, and surfaces insights about when and where guides fish best.

**Target user:** Solo or small-team fishing guides with an existing client base who want to run a more professional operation without paying $50-$350/month for bloated booking software they don't need.

**Price:** $15-20/month flat, no booking fees, no commissions.

---

## Design Philosophy

GuideOS should feel like a premium professional tool — not a simple utility. Competitors look like forms and spreadsheets. GuideOS looks like a modern SaaS dashboard.

**Visual identity:**
- Dark navy sidebar on desktop (`#0f1f35`) with white/light text
- Clean white content area with subtle card shadows
- Teal/cyan accent color (`#0ea5e9`) for interactive elements and highlights
- Sharp, modern typography — not rounded or playful
- Data-forward — numbers and stats are displayed prominently
- Environmental data (weather, moon, pressure) gets visual treatment, not just text

**Responsive strategy:**
- **Desktop:** Persistent left sidebar navigation, full-width dashboard with multi-column grid layouts, data tables, rich analytics charts
- **Mobile:** Bottom tab bar navigation, single-column stacked layout, optimized for quick trip logging in the field
- These are two genuinely different layouts, not the same layout squished

---

## Users

- **Guide (owner):** Full access to everything. Creates their own account.
- **Assistant guide (future v2):** Limited access — can log trips but not see financials.

No client-facing portal in v1. Guides manage everything internally.

---

## Desktop Layout

**Shell:**
- Fixed left sidebar (240px) — dark navy, logo at top, nav links with icons, user avatar at bottom
- Main content area fills remaining width
- Top bar inside content area shows page title + primary action button

**Nav links (sidebar):**
- Dashboard
- Clients
- Trips
- Calendar
- Analytics
- Settings

---

## Mobile Layout

**Shell:**
- Full-screen content, no sidebar
- Fixed bottom tab bar with 5 icons: Dashboard, Clients, Trips, Calendar, Analytics
- Header bar shows page title + action button

---

## Pages

### Dashboard
**Desktop:** 4-stat cards across top (Total Clients, Trips This Month, Revenue This Month, Outstanding Balance). Below: upcoming trips list on left, recent activity feed on right. Weather widget showing today's conditions.

**Mobile:** Stats scroll horizontally. Upcoming trips stacked below. Quick-log button prominent.

---

### Clients
A searchable, filterable list of all clients. Each client card shows name, phone, last trip date, total trips, and outstanding balance.

**Client detail page:**
- Header: name, photo placeholder, contact info (phone, email, address), notes
- Trip history tab: every trip this client has been on, sorted newest first
- Financials tab: total spent, deposits paid, balances owed
- Notes tab: freeform notes about the client, preferences, reminders ("allergic to shellfish", "always wants the back of the boat")

---

### Trips
List of all logged trips. Filterable by date, client, species, location.

**Log a Trip flow:**
1. Select client (or add new)
2. Set date — system auto-fetches weather, moon phase, barometric pressure for that date/location
3. Enter location (body of water, GPS optional)
4. Species caught + count per species
5. Guide notes
6. Upload photos
7. Payment: trip price, deposit already paid, balance collected today, payment method

**Trip detail page:**
- Environmental data displayed visually: weather icon + temp, moon phase graphic, pressure reading with trend arrow (rising/falling/steady)
- Fish log with species breakdown
- Photo gallery
- Payment summary
- Guide notes

---

### Calendar
**Desktop:** Full month view with trip blocks color-coded by client. Click a day to see that day's trip or add a new one.
**Mobile:** Week view with tap-to-open day agenda.

---

### Analytics
The most differentiated page — no competitor offers this.

**Sections:**
- **Best conditions** — bar charts showing average fish count by moon phase, by barometric pressure trend, by season/month
- **Top species** — pie/donut chart of species breakdown across all trips
- **Revenue trends** — monthly revenue line chart, year-over-year if enough data
- **Top clients** — ranked by trips taken and total spent
- **Best locations** — which bodies of water produce the most fish

All charts are interactive. Filter by date range, species, or location.

---

### Settings
- Profile (name, photo, business name, location)
- Notification preferences
- Billing (subscription management)
- Export data (CSV)

---

## Auto-Environmental Data

When a guide logs a trip and sets the date + location, GuideOS automatically fetches and stores:
- **Temperature** (high/low for the day)
- **Weather condition** (sunny, overcast, rain, etc.)
- **Wind speed and direction**
- **Barometric pressure** + trend (rising, falling, steady)
- **Moon phase** (new, waxing crescent, first quarter, waxing gibbous, full, waning gibbous, last quarter, waning crescent)
- **Sunrise/Sunset times**

Data source: Open-Meteo API (free, no key required for basic weather) + astronomical calculation library for moon phase.

This data is stored permanently with each trip and feeds the Analytics page.

---

## Payments (v1 — tracking only, no in-app collection)

Each trip has:
- **Trip price**
- **Deposit amount** (collected at booking)
- **Balance due** (auto-calculated)
- **Amount collected day-of**
- **Payment method** (cash, card, Venmo, Zelle, check)
- **Paid in full flag**

Financial dashboard shows:
- Monthly revenue
- Outstanding balances by client
- Year-to-date totals

**v2:** Stripe integration for in-app deposit collection and payment processing.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Database + Auth | Supabase (new project) |
| File Storage | Supabase Storage (trip photos) |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |
| Weather API | Open-Meteo (free, no key) |
| Moon phase | astronomia npm package |
| Deployment | Vercel |
| Repo | GitHub — `guide-os` |

---

## Data Model

```
guides           — id, name, email, business_name, location, avatar_url, created_at
clients          — id, guide_id, name, email, phone, address, notes, created_at
trips            — id, guide_id, client_id, trip_date, location, notes, price, deposit_paid, amount_collected, payment_method, created_at
trip_catches     — id, trip_id, species, count
trip_photos      — id, trip_id, url, created_at
trip_conditions  — id, trip_id, temp_high, temp_low, weather, wind_speed, wind_dir, pressure, pressure_trend, moon_phase, sunrise, sunset
```

---

## Out of Scope for v1

- In-app payment collection (Stripe)
- Online booking / client-facing portal
- Multi-guide team accounts
- SMS/email reminders to clients
- Mobile app (PWA only)
- Marketplace / guide discovery
