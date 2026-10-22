import { format } from "date-fns"
import { big } from "@/lib/utils/format"

// ─── Periods ────────────────────────────────────────────────────────────────

const pad = (n) => String(n).padStart(2, "0")

/** "2026-10" for a Date (local time). */
export const monthKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`

/** Parses "2026-10" → { year, month(1-12) }; falls back to the current month. */
export function parseMonth(key) {
  const m = /^(\d{4})-(\d{2})$/.exec(key || "")
  if (m && Number(m[2]) >= 1 && Number(m[2]) <= 12) return { year: Number(m[1]), month: Number(m[2]) }
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

export function shiftMonth(key, delta) {
  const { year, month } = parseMonth(key)
  return monthKey(new Date(year, month - 1 + delta, 1))
}

export const monthLabel = (key) => {
  const { year, month } = parseMonth(key)
  return `Tháng ${month}/${year}`
}

/** "yyyy-MM-dd" → Date at the given local time (unlike `new Date("yyyy-MM-dd")`, which is UTC). */
export function localDate(value, hours = 0, minutes = 0, seconds = 0, ms = 0) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "")
  if (!m) return null
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), hours, minutes, seconds, ms)
}

export const todayInput = () => format(new Date(), "yyyy-MM-dd")

/**
 * Derives the ISO `from`/`to` window from the URL filters.
 * Month mode: local month boundaries. Custom mode: local start/end of the chosen days.
 */
export function periodRange(filters) {
  if (filters.range === "custom") {
    const from = localDate(filters.start)
    const to = localDate(filters.end, 23, 59, 59, 999)
    return { from: from?.toISOString() ?? "", to: to?.toISOString() ?? "" }
  }
  const { year, month } = parseMonth(filters.month)
  const from = new Date(year, month - 1, 1)
  const to = new Date(year, month, 1, 0, 0, 0, -1)
  return { from: from.toISOString(), to: to.toISOString() }
}

export function periodLabel(filters) {
  if (filters.range === "custom") {
    const f = localDate(filters.start)
    const t = localDate(filters.end)
    if (!f && !t) return "Toàn bộ thời gian"
    return `${f ? format(f, "dd/MM/yyyy") : "…"} – ${t ? format(t, "dd/MM/yyyy") : "…"}`
  }
  return monthLabel(filters.month)
}

// ─── Money (exact BigInt math) ───────────────────────────────────────────────

/** Basis points → "59,25%". */
export const bpToPercent = (bp) => `${(Number(bp || 0) / 100).toLocaleString("vi-VN", { maximumFractionDigits: 2 })}%`

/** paid / total in basis points (0-10000), computed with BigInt. */
export function progressBp(paid, total) {
  const t = big(total)
  if (t <= 0n) return 0
  const bp = (big(paid) * 10000n) / t
  return Number(bp > 10000n ? 10000n : bp < 0n ? 0n : bp)
}

const OUTSTANDING = ["planned", "pending", "partially_paid"]

/** Expected date in the past while still outstanding. */
export function isOverdue(tx) {
  if (!tx?.expectedDate || !OUTSTANDING.includes(tx.status)) return false
  return new Date(tx.expectedDate).getTime() < Date.now()
}

export const isSettled = (tx) => ["paid", "cancelled"].includes(tx?.status)
export const isPayable = (tx) => OUTSTANDING.includes(tx?.status) && big(tx?.remainingAmount) > 0n
export const txId = (tx) => tx?._id ?? tx?.id

// ─── Errors ──────────────────────────────────────────────────────────────────

export const errorCode = (err) => err?.response?.data?.code

/** Friendlier copy for business error codes from the finance API. */
export const FINANCE_ERRORS = {
  CATEGORY_TYPE_MISMATCH: "Danh mục không khớp với loại giao dịch (thu/chi).",
  CATEGORY_INACTIVE: "Danh mục đã ngừng sử dụng. Hãy chọn danh mục khác.",
  INVALID_CATEGORY: "Danh mục không hợp lệ.",
  INVALID_PROJECT: "Dự án không thuộc studio.",
  TOTAL_BELOW_PAID: "Tổng tiền không thể nhỏ hơn số đã thanh toán.",
  STATUS_DERIVED:
    "Giao dịch đã có thanh toán nên trạng thái được tính tự động. Muốn hủy, hãy điều chỉnh (đảo) các khoản thanh toán trước.",
  TRANSACTION_SETTLED: "Giao dịch đã tất toán/hủy: chỉ được sửa nội dung và mô tả.",
  TRANSACTION_HAS_PAYMENTS:
    "Không thể xóa giao dịch đã có lịch sử thanh toán. Hãy điều chỉnh các khoản thanh toán rồi chuyển sang “Đã hủy”.",
  TRANSACTION_CANCELLED: "Giao dịch đã bị hủy, không thể ghi nhận thanh toán.",
  OVERPAYMENT: "Số tiền vượt quá số còn lại của giao dịch.",
  DUPLICATE_PAYMENT: "Khoản thanh toán này đã được ghi nhận trước đó (yêu cầu trùng lặp).",
  PAYMENT_IN_FUTURE: "Không ghi nhận thanh toán cho ngày trong tương lai.",
  ALREADY_REVERSED: "Khoản thanh toán này đã được điều chỉnh trước đó.",
  INVALID_REVERSAL: "Không thể đảo một bút toán điều chỉnh.",
  CONCURRENT_MODIFICATION: "Giao dịch vừa được cập nhật bởi người khác. Vui lòng tải lại.",
  LEDGER_INCONSISTENT: "Tổng thanh toán không nhất quán, vui lòng đối soát.",
  CATEGORY_CODE_TAKEN: "Mã danh mục đã tồn tại.",
}

/** Business-code message if known, otherwise the generic API message. */
export function financeErrorMessage(err, fallbackFn) {
  return FINANCE_ERRORS[errorCode(err)] ?? fallbackFn(err)
}

/** Idempotency key matching the API's /^[A-Za-z0-9_-]{8,100}$/. */
export function newIdempotencyKey() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID()
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")
}
