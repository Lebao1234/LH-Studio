import { CalendarClockIcon } from "lucide-react"
import { Link } from "react-router"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { EmptyState } from "@/components/shared/EmptyState"
import { PLATFORMS } from "@/lib/constants/labels"
import { formatDate, formatDateTime, formatRelative } from "@/lib/utils/format"
import { ListSkeleton, WidgetCard, WidgetLink } from "./WidgetCard"

function PostRow({ post }) {
  return (
    <li>
      <Link
        to="/calendar"
        className="flex items-center gap-3 rounded-lg px-2 py-2 outline-none transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <div className="flex w-11 shrink-0 flex-col items-center rounded-lg bg-foreground/6 py-1 ring-1 ring-foreground/8">
          <span className="text-[10px] text-muted-foreground uppercase">{formatDate(post.scheduledAt, "EEE")}</span>
          <span className="tabular text-sm leading-tight font-semibold">{formatDate(post.scheduledAt, "dd/MM")}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{post.title}</p>
          <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
            <span className="tabular shrink-0" title={formatDateTime(post.scheduledAt)}>
              {formatDate(post.scheduledAt, "HH:mm")}
            </span>
            {post.channel?.platform && <StatusBadge map={PLATFORMS} value={post.channel.platform} />}
            <span className="truncate">{post.channel?.name ?? "—"}</span>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {post.project?.code ? (
            <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground" title={post.project.title}>
              {post.project.code}
            </span>
          ) : null}
          <span className="text-[11px] text-muted-foreground">{formatRelative(post.scheduledAt)}</span>
        </div>
      </Link>
    </li>
  )
}

export function UpcomingPosts({ query, className }) {
  const items = query.data ?? []
  return (
    <WidgetCard
      title="Lịch đăng sắp tới"
      description="Bài đã lên lịch trong 14 ngày tới"
      action={<WidgetLink to="/calendar">Lịch đăng</WidgetLink>}
      query={query}
      isEmpty={!items.length}
      empty={
        <EmptyState icon={CalendarClockIcon} title="Chưa có bài nào được lên lịch" description="Các bài ở trạng thái “Đã lên lịch” sẽ hiển thị tại đây." className="border-0 py-6" />
      }
      skeleton={<ListSkeleton rows={4} />}
      className={className}
      contentClassName="px-1.5"
    >
      <ul className="grid gap-0.5">
        {items.map((post) => (
          <PostRow key={post.id ?? post._id} post={post} />
        ))}
      </ul>
    </WidgetCard>
  )
}
