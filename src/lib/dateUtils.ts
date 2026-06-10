/** Shared date formatters (previously duplicated across pages). */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "YYYY-MM-DD" -> "Mon D" (e.g. "Jan 5"). Empty string on missing/invalid. */
export function formatMonthDay(d?: string | null): string {
  if (!d) return ''
  try {
    const [, m, dy] = d.split('-')
    return `${MONTHS[+m - 1]} ${parseInt(dy)}`
  } catch {
    return ''
  }
}

/** "YYYY-MM-DD" -> "Mon D, YYYY". Falls back to the raw input on parse error. */
export function formatMonthDayYear(isoDate?: string | null): string {
  if (!isoDate) return ''
  try {
    const [y, m, d] = isoDate.split('-')
    return `${MONTHS[+m - 1]} ${parseInt(d)}, ${y}`
  } catch {
    return isoDate
  }
}

/** Epoch ms or date string -> "Mon D, YYYY" via toLocaleDateString. */
export function formatTimestamp(ts?: string | number | null): string {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
