import { PieChartIcon } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/EmptyState"
import { EPISODE_STATUS, PROJECT_STATUS } from "@/lib/constants/labels"
import { formatNumber } from "@/lib/utils/format"
import { toStatusRows } from "./chart-theme"
import { StatusBarChart } from "./StatusBarChart"
import { WidgetCard, WidgetLink } from "./WidgetCard"

const sum = (rows) => rows.reduce((acc, r) => acc + r.count, 0)

function Section({ title, rows, ariaLabel }) {
  return (
    <section className="min-w-0">
      <div className="mb-1.5 flex items-baseline justify-between">
        <h3 className="text-xs font-medium text-muted-foreground">{title}</h3>
        <span className="tabular text-xs text-muted-foreground">Tổng {formatNumber(sum(rows))}</span>
      </div>
      <StatusBarChart rows={rows} ariaLabel={ariaLabel} />
    </section>
  )
}

export function ProjectStatusCard({ query, className }) {
  const projects = toStatusRows(query.data?.projects, PROJECT_STATUS)
  const episodes = toStatusRows(query.data?.episodes, EPISODE_STATUS)
  const isEmpty = sum(projects) === 0 && sum(episodes) === 0

  return (
    <WidgetCard
      title="Tiến độ sản xuất"
      description="Dự án và tập theo trạng thái"
      action={<WidgetLink to="/projects">Dự án</WidgetLink>}
      query={query}
      isEmpty={isEmpty}
      empty={<EmptyState icon={PieChartIcon} title="Chưa có dự án nào" className="border-0 py-6" />}
      skeleton={
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-40" />
          <Skeleton className="h-44" />
        </div>
      }
      className={className}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Section title="Dự án" rows={projects} ariaLabel="Dự án theo trạng thái" />
        <Section title="Tập phim" rows={episodes} ariaLabel="Tập theo trạng thái" />
      </div>
    </WidgetCard>
  )
}
