import {
  addDays,
  addHours,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isValid,
  parse,
  parseISO,
  setHours,
  startOfDay,
  startOfHour,
  startOfMonth,
  startOfWeek,
} from "date-fns"

export const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"]
export const WEEKDAY_NAMES = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"]
const WEEK = { weekStartsOn: 1 }

export const monthKey = (d) => format(d, "yyyy-MM")
export const dayKey = (d) => format(d, "yyyy-MM-dd")

/** "2026-10" → first day of that month; anything invalid → current month. */
export function parseMonth(value) {
  const d = value ? parse(value, "yyyy-MM", new Date()) : null
  return d && isValid(d) ? startOfMonth(d) : startOfMonth(new Date())
}

/** Mon–Sun grid covering the month (28–42 days). `end` is exclusive. */
export function monthGrid(month) {
  const start = startOfWeek(startOfMonth(month), WEEK)
  const last = endOfWeek(endOfMonth(month), WEEK)
  return { start, end: addDays(startOfDay(last), 1), days: eachDayOfInterval({ start, end: last }) }
}

const toDate = (v) => (v instanceof Date ? v : parseISO(String(v)))

/** Groups calendar items by local day of `date` (publishedAt ?? scheduledAt), sorted by time. */
export function groupByDay(items = []) {
  const map = new Map()
  for (const item of items) {
    if (!item.date) continue
    const d = toDate(item.date)
    if (!isValid(d)) continue
    const key = dayKey(d)
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(item)
  }
  for (const list of map.values()) list.sort((a, b) => toDate(a.date) - toDate(b.date))
  return map
}

/**
 * Prefill for a post created by clicking a day: 09:00 that day as "scheduled";
 * today after 09:00 → next full hour; past days → recorded as already published (manual).
 */
export function prefillForDay(day, channelId) {
  const now = new Date()
  const base = { ...(channelId && { channelId }) }
  const nine = setHours(startOfDay(day), 9)
  if (startOfDay(day) < startOfDay(now)) return { ...base, status: "published", publishedAt: nine.toISOString() }
  const at = nine > now ? nine : addHours(startOfHour(now), 1)
  return { ...base, status: "scheduled", scheduledAt: at.toISOString() }
}
