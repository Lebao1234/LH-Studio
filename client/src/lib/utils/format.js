import { format, formatDistanceToNow, isValid, parseISO } from "date-fns"
import { vi } from "date-fns/locale"

/** Groups an integer decimal string with dots: "50000000" → "50.000.000". Exact (no floats). */
export function groupDigits(value) {
  if (value === null || value === undefined || value === "") return "0"
  const s = String(value)
  const negative = s.startsWith("-")
  const digits = s.replace(/^-/, "").replace(/\D/g, "") || "0"
  const grouped = digits.replace(/^0+(?=\d)/, "").replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  return negative ? `-${grouped}` : grouped
}

/** "50000000" → "50.000.000 ₫" */
export const formatVND = (value) => `${groupDigits(value)} ₫`

/** Compact VND for chart axes / tiles: 50000000 → "50 tr". Approximate by design. */
export function formatVNDCompact(value) {
  const n = Number(value || 0)
  const abs = Math.abs(n)
  if (abs >= 1e9) return `${(n / 1e9).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} tỷ`
  if (abs >= 1e6) return `${(n / 1e6).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} tr`
  if (abs >= 1e3) return `${(n / 1e3).toLocaleString("vi-VN", { maximumFractionDigits: 0 })}k`
  return n.toLocaleString("vi-VN")
}

/** Exact BigInt helpers for amount strings from the API. */
export const big = (v) => {
  try {
    return BigInt(v ?? 0)
  } catch {
    return 0n
  }
}

export function formatNumber(value) {
  if (value === null || value === undefined) return "—"
  return groupDigits(value)
}

/** 12400 → "12,4K" for metrics. */
export function formatCompactNumber(value) {
  const n = Number(value || 0)
  return new Intl.NumberFormat("vi-VN", { notation: "compact", maximumFractionDigits: 1 }).format(n)
}

const toDate = (value) => {
  if (!value) return null
  const d = value instanceof Date ? value : parseISO(String(value))
  return isValid(d) ? d : null
}

export function formatDate(value, pattern = "dd/MM/yyyy") {
  const d = toDate(value)
  return d ? format(d, pattern, { locale: vi }) : "—"
}

export const formatDateTime = (value) => formatDate(value, "HH:mm dd/MM/yyyy")

export function formatRelative(value) {
  const d = toDate(value)
  return d ? formatDistanceToNow(d, { addSuffix: true, locale: vi }) : "—"
}

/** ISO → value for <input type="date">. */
export function toDateInput(value) {
  const d = toDate(value)
  return d ? format(d, "yyyy-MM-dd") : ""
}

/** ISO → value for <input type="datetime-local">. */
export function toDateTimeInput(value) {
  const d = toDate(value)
  return d ? format(d, "yyyy-MM-dd'T'HH:mm") : ""
}

/** Input value → ISO string (local time) or null when empty. */
export function fromDateInput(value) {
  if (!value) return null
  const d = new Date(value)
  return isValid(d) ? d.toISOString() : null
}

export function initials(name = "") {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(-2)
      .map((p) => p[0])
      .join("")
      .toUpperCase() || "?"
  )
}

export const percent = (part, total) => (total > 0 ? Math.round((part / total) * 100) : 0)
