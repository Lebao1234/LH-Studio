import { z } from "zod"
import { fromDateInput, toDateTimeInput } from "@/lib/utils/format"

export const NONE = "none"
const CLOCK_SKEW_MS = 5 * 60_000
const isHttp = (v) => /^https?:\/\//i.test(v)

export const splitLines = (text) =>
  String(text ?? "")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)

export const postSchema = z
  .object({
    channelId: z.string().min(1, "Vui lòng chọn kênh."),
    projectId: z.string(),
    episodeId: z.string(),
    title: z.string().trim().min(1, "Vui lòng nhập tiêu đề.").max(300, "Tối đa 300 ký tự."),
    content: z.string().max(20_000, "Tối đa 20.000 ký tự."),
    mediaUrlsText: z.string(),
    status: z.enum(["draft", "scheduled", "published", "failed", "cancelled"]),
    scheduledAt: z.string(),
    publishedAt: z.string(),
    externalUrl: z
      .string()
      .trim()
      .max(2048, "Tối đa 2048 ký tự.")
      .refine((v) => v === "" || isHttp(v), "URL phải bắt đầu bằng http(s)://"),
    externalPostId: z.string().trim().max(200, "Tối đa 200 ký tự."),
  })
  .superRefine((v, ctx) => {
    const urls = splitLines(v.mediaUrlsText)
    if (urls.length > 20) ctx.addIssue({ code: "custom", path: ["mediaUrlsText"], message: "Tối đa 20 media URL." })
    const bad = urls.find((u) => !isHttp(u) || u.length > 2048)
    if (bad) ctx.addIssue({ code: "custom", path: ["mediaUrlsText"], message: `URL không hợp lệ: ${bad.slice(0, 60)}` })

    if (v.status === "scheduled" && !fromDateInput(v.scheduledAt)) {
      ctx.addIssue({ code: "custom", path: ["scheduledAt"], message: "Bài viết đã lên lịch cần thời gian đăng." })
    }
    if (v.status === "published" && v.publishedAt) {
      const t = new Date(v.publishedAt).getTime()
      if (t > Date.now() + CLOCK_SKEW_MS) ctx.addIssue({ code: "custom", path: ["publishedAt"], message: "Thời gian đăng không thể ở tương lai." })
    }
  })

/** API post (or partial defaults such as `{ status, scheduledAt }`) → form values. */
export function toFormValues(post = {}) {
  return {
    channelId: post.channelId ? String(post.channelId) : "",
    projectId: post.projectId ? String(post.projectId) : NONE,
    episodeId: post.episodeId ? String(post.episodeId) : NONE,
    title: post.title ?? "",
    content: post.content ?? "",
    mediaUrlsText: (post.mediaUrls ?? []).join("\n"),
    status: post.status ?? "draft",
    scheduledAt: toDateTimeInput(post.scheduledAt),
    publishedAt: toDateTimeInput(post.publishedAt),
    externalUrl: post.externalUrl ?? "",
    externalPostId: post.externalPostId ?? "",
  }
}

/** Form values → full API body (null clears optional links/dates). */
export function toBody(v) {
  const projectId = v.projectId && v.projectId !== NONE ? v.projectId : null
  return {
    channelId: v.channelId,
    projectId,
    episodeId: projectId && v.episodeId && v.episodeId !== NONE ? v.episodeId : null,
    title: v.title.trim(),
    content: v.content,
    mediaUrls: splitLines(v.mediaUrlsText),
    status: v.status,
    scheduledAt: fromDateInput(v.scheduledAt),
    publishedAt: fromDateInput(v.publishedAt),
    externalUrl: v.externalUrl.trim(),
    externalPostId: v.externalPostId.trim(),
  }
}

const isBlank = (val) => val === null || val === "" || (Array.isArray(val) && val.length === 0)

/** Create: omit blank optionals. */
export const createBody = (v) => Object.fromEntries(Object.entries(toBody(v)).filter(([, val]) => !isBlank(val)))

/**
 * Update: only the fields that changed. Re-sending an unchanged past `scheduledAt`
 * would trip SCHEDULE_IN_PAST, and re-sending links re-checks project access.
 */
export function updateBody(v, initial) {
  const next = toBody(v)
  const prev = toBody(initial)
  return Object.fromEntries(Object.entries(next).filter(([k, val]) => JSON.stringify(val) !== JSON.stringify(prev[k])))
}

/** Client-side mirror of SCHEDULE_IN_PAST (only checked when the time or status changes). */
export function scheduleInPast(v, initial) {
  if (v.status !== "scheduled") return false
  const changed = !initial || v.scheduledAt !== initial.scheduledAt || initial.status !== "scheduled"
  return changed && new Date(v.scheduledAt).getTime() < Date.now() - CLOCK_SKEW_MS
}

export const metricSchema = z.object({
  recordedAt: z.string(),
  views: z.string().regex(/^\d{1,18}$/, "Nhập số nguyên không âm."),
  likes: z.string().regex(/^\d{1,18}$/, "Nhập số nguyên không âm."),
  comments: z.string().regex(/^\d{0,18}$/, "Nhập số nguyên không âm."),
  shares: z.string().regex(/^\d{0,18}$/, "Nhập số nguyên không âm."),
  watchTimeHours: z.string().regex(/^\d{0,12}([.,]\d{0,2})?$/, "Nhập số giờ hợp lệ."),
})
