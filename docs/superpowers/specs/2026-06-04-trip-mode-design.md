# Trip Mode — Design Spec
**Date:** 2026-06-04
**Status:** Approved

---

## Overview

Trip Mode is a full-screen, focused interface that activates when a guide taps "Start Trip" on a scheduled trip. It replaces the normal app shell entirely and is purpose-built for one-handed use on the water. When done, it generates a trip summary and optionally sends a recap to the client.

---

## Entry & Exit

**Start Trip** button appears on scheduled trip detail pages. Tapping it records the start time and navigates to the Trip Mode screen at `/trips/[id]/live`.

**Pause** button in the top bar returns the guide to the normal app. The trip continues — a "Resume Trip" banner appears on the trip detail page. Tapping it returns to `/trips/[id]/live`.

**Finish Trip** button ends the session, records the end time, and navigates to the trip summary screen.

---

## Trip Mode Layout

Full-screen with no sidebar or bottom nav. Two elements always visible:

**Top bar:**
- Trip name and date (left)
- Live timer showing time on the water (center)
- Pause button (right)

**Bottom tab bar (4 tabs):**
- 🌤 Weather
- 🎣 Fish Log
- 📷 Photos
- 📝 Notes

---

## Weather Tab

- On first load, attempt GPS auto-detect via browser Geolocation API
- If GPS denied or unavailable, show a text input to type a location
- Displays hourly weather for the current day from Open-Meteo API
- Each hour shows: time, temperature, weather condition icon, wind speed, barometric pressure
- Current hour is highlighted
- Moon phase and sunrise/sunset shown at the top
- Data refreshes every 30 minutes automatically

---

## Fish Log Tab

- Running total of fish caught shown prominently at top
- Quick-entry: species name input + count input + "Log" button
- Species input has autocomplete from previously caught species (from trip_catches history)
- Press Enter on species to focus count, press Enter on count to submit
- Each entry shows: species, count, timestamp
- Entries can be deleted with swipe/tap
- All entries stored in `trip_live_catches` table in real time

---

## Photos Tab

- Two buttons: **Take Photo** (opens camera) and **From Camera Roll** (opens gallery)
- Photos display in a grid as they're added
- Taken photos save to device camera roll automatically (browser behavior on iOS/Android)
- Photos stored in Supabase Storage under `trip-photos` bucket
- Tap any photo to view full size
- Long-press or tap ✕ to delete

---

## Notes Tab

- Single freeform textarea
- Auto-saves every 10 seconds (no manual save needed)
- Good for: conditions observations, client notes, memorable moments

---

## Finish Trip

Tapping Finish Trip shows a confirmation then navigates to the **Trip Summary** screen at `/trips/[id]/summary`.

**Summary screen shows:**
- Time on water (start to finish)
- Total fish caught with species breakdown
- Conditions snapshot (weather, moon phase, pressure)
- Photos taken during the trip (scrollable gallery)
- Notes from the trip

**Two actions:**
1. **Save to Trip** — merges all live catches, photos, and notes into the main trip record and marks trip as completed. Returns to trip detail.
2. **Send Recap to Client** — opens native email app via `mailto:` with client's email pre-filled, subject "Your Trip Recap — [date]", and the full summary in the email body (plain text, formatted). Guide sends from their personal email.

---

## Data Model

```sql
-- Live catch entries during the trip (merged into trip_catches on Finish)
create table public.trip_live_catches (
  id uuid default gen_random_uuid() primary key,
  trip_id uuid references public.trips(id) on delete cascade not null,
  species text not null,
  count integer not null default 1,
  logged_at timestamptz not null default now()
);

-- Trip session tracking
alter table public.trips add column started_at timestamptz;
alter table public.trips add column ended_at timestamptz;
alter table public.trips add column live_notes text;
```

---

## Tech Stack Notes

- GPS: browser `navigator.geolocation` API
- Camera: `<input type="file" accept="image/*" capture="environment">` for camera, without `capture` for gallery
- Photos save to camera roll: standard iOS/Android browser behavior when capturing
- Weather: Open-Meteo hourly API (already integrated in the app)
- Auto-save notes: `useEffect` with `setInterval` calling a Supabase update every 10s
- Timer: `setInterval` in client component updating every second

---

## Out of Scope for v1

- Push notifications during trip
- Offline mode (requires service worker)
- GPS tracking/route recording
- Live sharing with client
- Video capture
