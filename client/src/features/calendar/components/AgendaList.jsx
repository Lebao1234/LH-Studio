import { PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { PlatformBadge } from "@/features/channels/components/PlatformBadge"
import { POST_STATUS } from "@/lib/constants/labels"
import { formatDate } from "@/lib/utils/format"
import { cn } from "@/lib/utils"
import { styleOf } from "./post-status-styles"

function AgendaItem({ post, showDate, onOpenPost }) {
  const s = styleOf(post.status)
  return (
    <li>
      <button
        type="button"
        onClick={() => onOpenPost(post)}
        className="flex w-full min-w-0 items-start gap-2.5 rounded-lg px-2 py-1.5 text-left hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <span className={cn("mt-1 size-2 shrink-0 rounded-full", s.dot)} aria-hidden />
        <span className="tabular w-12 shrink-0 text-xs text-muted-foreground">
          {showDate && <span className="block text-foreground">{formatDate(post.date, "dd/MM")}</span>}
          {formatDate(post.date, "HH:mm")}
        </span>
        <span className="min-w-0 flex-1">
          <span className={cn("block truncate text-sm", post.status === "cancelled" && "line-through")}>{post.title}</span>
          <span className="mt-0.5 flex min-w-0 flex-wrap items-center gap-1">
            {post.channel && <PlatformBadge platform={post.channel.platform} />}
            <span className="truncate text-xs text-muted-foreground">{post.channel?.name}</span>
            <StatusBadge map={POST_STATUS} value={post.status} className="ml-auto" />
          </span>
        </span>
      </button>
    </li>
  )
}

/** Titled list of calendar posts (selected day or upcoming). */
export function AgendaList({ title, posts, isLoading, showDate, onOpenPost, emptyText, onCreate, className }) {
  return (
    <section className={cn("rounded-xl bg-card p-3 ring-1 ring-foreground/10", className)} aria-label={title}>
      <div className="mb-1.5 flex items-center justify-between gap-2 px-1">
        <h2 className="text-sm font-medium">{title}</h2>
        {onCreate && (
          <Button variant="ghost" size="xs" onClick={onCreate}>
            <PlusIcon /> Thêm bài
          </Button>
        )}
      </div>
      {isLoading ? (
        <div className="grid gap-2 px-1">
          <Skeleton className="h-9" />
          <Skeleton className="h-9" />
        </div>
      ) : posts.length ? (
        <ul className="grid gap-0.5">
          {posts.map((p) => (
            <AgendaItem key={p.id ?? p._id} post={p} showDate={showDate} onOpenPost={onOpenPost} />
          ))}
        </ul>
      ) : (
        <p className="px-1 py-3 text-xs text-muted-foreground">{emptyText}</p>
      )}
    </section>
  )
}
