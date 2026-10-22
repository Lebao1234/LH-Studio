import { EyeIcon, HeartIcon } from "lucide-react"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { formatCompactNumber, formatDateTime, formatNumber } from "@/lib/utils/format"

/** Linked project / episode, or an "Độc lập" pill. */
export function PostLinkCell({ post }) {
  if (!post.projectId) return <StatusBadge tone="muted">Độc lập</StatusBadge>
  return (
    <div className="min-w-0">
      <p className="truncate text-sm" title={post.project?.title}>
        {post.project ? `${post.project.code} · ${post.project.title}` : "Dự án"}
      </p>
      {post.episode && (
        <p className="truncate text-xs text-muted-foreground">
          Tập {post.episode.episodeNumber}: {post.episode.title}
        </p>
      )}
    </div>
  )
}

/** Published time, otherwise scheduled time. */
export function PostTimeCell({ post }) {
  if (post.publishedAt && post.status === "published") {
    return (
      <div className="text-xs">
        <p className="tabular">{formatDateTime(post.publishedAt)}</p>
        <p className="text-muted-foreground">Đã đăng</p>
      </div>
    )
  }
  if (post.scheduledAt) {
    return (
      <div className="text-xs">
        <p className="tabular">{formatDateTime(post.scheduledAt)}</p>
        <p className="text-muted-foreground">Lịch đăng</p>
      </div>
    )
  }
  return <span className="text-xs text-muted-foreground">Chưa có lịch</span>
}

/** Views / likes from the latest cumulative snapshot. */
export function PostMetricCell({ metric }) {
  if (!metric) return <span className="text-xs text-muted-foreground">—</span>
  return (
    <div className="tabular flex items-center gap-3 text-xs">
      <span className="flex items-center gap-1" title={`${formatNumber(metric.views)} lượt xem`}>
        <EyeIcon className="size-3.5 text-muted-foreground" aria-hidden />
        <span className="sr-only">Lượt xem</span>
        {formatCompactNumber(metric.views)}
      </span>
      <span className="flex items-center gap-1" title={`${formatNumber(metric.likes)} lượt thích`}>
        <HeartIcon className="size-3.5 text-muted-foreground" aria-hidden />
        <span className="sr-only">Lượt thích</span>
        {formatCompactNumber(metric.likes)}
      </span>
    </div>
  )
}
