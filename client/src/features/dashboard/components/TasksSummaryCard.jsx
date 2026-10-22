import { ListTodoIcon } from "lucide-react"
import { Link } from "react-router"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/EmptyState"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { PRIORITY, TASK_STATUS } from "@/lib/constants/labels"
import { formatNumber } from "@/lib/utils/format"
import { cn } from "@/lib/utils"
import { toStatusRows } from "./chart-theme"
import { StatusBarChart } from "./StatusBarChart"
import { WidgetCard, WidgetLink } from "./WidgetCard"

function Metric({ label, value, tone, to }) {
  const inner = (
    <>
      <p className="truncate text-[11px] text-muted-foreground">{label}</p>
      <p className={cn("tabular text-lg leading-tight font-semibold", tone === "warning" && "text-warning", tone === "success" && "text-success")}>
        {formatNumber(value)}
      </p>
    </>
  )
  const cls = "min-w-0 rounded-lg bg-foreground/4 px-2.5 py-2 ring-1 ring-foreground/8"
  return to ? (
    <Link to={to} className={cn(cls, "outline-none transition-colors hover:bg-foreground/8 focus-visible:ring-2 focus-visible:ring-ring/50")}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  )
}

export function TasksSummaryCard({ query, className }) {
  const d = query.data
  const statusRows = toStatusRows(d?.byStatus, TASK_STATUS)
  const total = statusRows.reduce((a, r) => a + r.count, 0)
  const priorities = Object.keys(PRIORITY)
    .slice()
    .reverse()
    .map((key) => ({ key, count: Number(d?.byPriority?.[key] ?? 0) }))

  return (
    <WidgetCard
      title="Công việc"
      description="Theo trạng thái và độ ưu tiên (việc đang mở)"
      action={<WidgetLink to="/tasks">Công việc</WidgetLink>}
      query={query}
      isEmpty={total === 0}
      empty={<EmptyState icon={ListTodoIcon} title="Chưa có công việc" className="border-0 py-6" />}
      skeleton={
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-13" />
            ))}
          </div>
          <Skeleton className="h-36" />
        </div>
      }
      className={className}
    >
      <div className="grid gap-3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Metric label="Quá hạn" value={d?.overdue ?? 0} tone={d?.overdue > 0 ? "warning" : undefined} to="/tasks" />
          <Metric label="Xong 7 ngày qua" value={d?.completedLast7Days ?? 0} tone="success" />
          <Metric label="Của tôi đang mở" value={d?.mine?.open ?? 0} to="/tasks?mine=true" />
          <Metric label="Của tôi quá hạn" value={d?.mine?.overdue ?? 0} tone={d?.mine?.overdue > 0 ? "warning" : undefined} to="/tasks?mine=true" />
        </div>
        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <StatusBarChart rows={statusRows} ariaLabel="Công việc theo trạng thái" labelWidth={84} />
          <div className="min-w-36">
            <h3 className="mb-1.5 text-xs font-medium text-muted-foreground">Ưu tiên (đang mở)</h3>
            <ul className="grid gap-1.5">
              {priorities.map((p) => (
                <li key={p.key} className="flex items-center justify-between gap-3">
                  <StatusBadge map={PRIORITY} value={p.key} dot />
                  <span className="tabular text-sm font-medium">{formatNumber(p.count)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </WidgetCard>
  )
}
