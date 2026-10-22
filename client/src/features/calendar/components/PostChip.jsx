import { POST_STATUS, PLATFORMS } from "@/lib/constants/labels"
import { formatDate } from "@/lib/utils/format"
import { cn } from "@/lib/utils"
import { styleOf } from "./post-status-styles"

/** Compact, status-coloured post chip for a calendar day cell. */
export function PostChip({ post, onClick, className }) {
  const s = styleOf(post.status)
  const Icon = s.icon
  const label = `${formatDate(post.date, "HH:mm")} · ${post.title} · ${post.channel?.name ?? ""} (${PLATFORMS[post.channel?.platform]?.label ?? ""}) · ${POST_STATUS[post.status]?.label ?? post.status}`
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation()
        onClick?.(post)
      }}
      className={cn(
        "flex h-5 w-full min-w-0 items-center gap-1 rounded border px-1 text-left text-[11px] leading-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        s.chip,
        className,
      )}
    >
      <Icon className="size-3 shrink-0" aria-hidden />
      <span className="tabular shrink-0 opacity-80">{formatDate(post.date, "HH:mm")}</span>
      <span className="truncate">{post.title}</span>
    </button>
  )
}
