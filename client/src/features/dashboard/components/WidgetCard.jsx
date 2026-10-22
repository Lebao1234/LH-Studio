import { Link } from "react-router"
import { ArrowRightIcon } from "lucide-react"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/EmptyState"
import { ErrorState } from "@/components/shared/ErrorState"
import { cn } from "@/lib/utils"

/** Link styled as a compact card action ("Xem tất cả →"). */
export function WidgetLink({ to, children = "Xem tất cả" }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1 rounded-md text-xs text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      {children}
      <ArrowRightIcon className="size-3" />
    </Link>
  )
}

/**
 * Dashboard widget shell: handles loading / error / empty so each widget only renders data.
 * `skeleton` overrides the default skeleton block.
 */
export function WidgetCard({
  title,
  description,
  action,
  query,
  isEmpty,
  empty,
  skeleton,
  className,
  contentClassName,
  children,
}) {
  let body
  if (query?.isPending) {
    body = skeleton ?? <Skeleton className="h-48 w-full" />
  } else if (query?.isError) {
    body = <ErrorState error={query.error} onRetry={() => query.refetch()} className="py-6" />
  } else if (isEmpty) {
    body = empty ?? <EmptyState className="border-0 py-6" />
  } else {
    body = children
  }

  return (
    <Card size="sm" className={cn("min-w-0", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription className="text-xs">{description}</CardDescription>}
        {action && <CardAction>{action}</CardAction>}
      </CardHeader>
      <CardContent className={cn("min-w-0", contentClassName)}>{body}</CardContent>
    </Card>
  )
}

export function ListSkeleton({ rows = 5 }) {
  return (
    <div className="grid gap-3" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="size-7 rounded-lg" />
          <div className="grid flex-1 gap-1.5">
            <Skeleton className="h-3.5 w-3/5" />
            <Skeleton className="h-3 w-2/5" />
          </div>
        </div>
      ))}
    </div>
  )
}
