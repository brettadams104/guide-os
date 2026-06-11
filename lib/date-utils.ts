/**
 * Safe date helpers that work correctly regardless of the server's timezone (Vercel runs UTC).
 *
 * Key rule: never call new Date().toISOString() for "today" on the server — that gives
 * the UTC date which can be tomorrow relative to any US timezone after ~7pm ET / 4pm PT.
 * Use safeToday() instead which subtracts 12h to stay safely on the local calendar day.
 */

/** Returns today's date string (YYYY-MM-DD) safe for server-side API calls. */
export function safeToday(): string {
  return new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString().split('T')[0]
}

/** Returns a date string N days after safeToday(). */
export function safeDateOffset(days: number): string {
  return new Date(Date.now() - 12 * 60 * 60 * 1000 + days * 86400000).toISOString().split('T')[0]
}

/**
 * Format a YYYY-MM-DD date string for display.
 * Parses the numbers directly — never uses new Date() — so it's timezone-safe on server and client.
 */
export function fmtDate(
  dateStr: string,
  opts: { weekday?: boolean; year?: boolean } = {}
): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const days   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  // Use UTC constructor so DST never shifts the day
  const dow    = new Date(Date.UTC(y, m - 1, d)).getUTCDay()

  const parts: string[] = []
  if (opts.weekday) parts.push(days[dow])
  parts.push(months[m - 1])
  parts.push(String(d))
  if (opts.year) parts.push(String(y))
  return parts.join(' ')
}

/** Short date: "Jun 10" */
export function fmtDateShort(dateStr: string): string {
  const [, m, d] = dateStr.split('-').map(Number)
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${months[m - 1]} ${d}`
}

/** Weekday short + short date: "Fri, Jun 12" */
export function fmtDateWeekday(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const days   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const dow    = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
  return `${days[dow]}, ${months[m - 1]} ${d}`
}

/** Month name from YYYY-MM string: "June 2026" */
export function fmtMonthLong(monthStr: string): string {
  const [y, m] = monthStr.split('-').map(Number)
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December']
  return `${months[m - 1]} ${y}`
}

/** Short month from YYYY-MM string: "Jun" */
export function fmtMonthShort(monthStr: string): string {
  const m = parseInt(monthStr.split('-')[1] ?? '1', 10)
  return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m - 1] ?? ''
}

/** Short month + 2-digit year: "Jun '26" */
export function fmtMonthYear(monthStr: string): string {
  const [y, m] = monthStr.split('-').map(Number)
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${months[m - 1]} '${String(y).slice(2)}`
}

/**
 * Format an ISO time string "2026-06-10T05:32" (from Open-Meteo) to "5:32 AM".
 * Works on server — no timezone conversion needed because the API already returns local time
 * when timezone=auto is passed.
 */
export function fmtApiTime(iso: string): string {
  const t = iso?.split('T')[1] ?? ''
  const [hStr, mStr] = t.split(':')
  const h = parseInt(hStr ?? '0', 10)
  const m = mStr ?? '00'
  const ampm = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${m} ${ampm}`
}
