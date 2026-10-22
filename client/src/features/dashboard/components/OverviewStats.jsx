import { ErrorState } from "@/components/shared/ErrorState"
import { StatStrip } from "@/components/shared/StatStrip"
import { formatNumber } from "@/lib/utils/format"

export function OverviewStats({ query }) {
  if (query.isError) return <ErrorState error={query.error} onRetry={() => query.refetch()} className="py-6" />

  const d = query.data ?? {}
  const overdue = d.overdueTasks ?? 0

  return (
    <StatStrip
      loading={query.isPending}
      items={[
        {
          key: "projects",
          to: "/projects?status=in_progress",
          label: "Dự án đang sản xuất",
          value: formatNumber(d.activeProjects ?? 0),
          hint: `Trên tổng ${formatNumber(d.totalProjects ?? 0)} dự án`,
          tone: "info",
        },
        {
          key: "episodes",
          label: "Tập phim",
          value: formatNumber(d.totalEpisodes ?? 0),
          hint: `${formatNumber(d.completedEpisodes ?? 0)} tập đã hoàn thành`,
        },
        {
          key: "open",
          to: "/tasks",
          label: "Công việc đang mở",
          value: formatNumber(d.pendingTasks ?? 0),
          hint: overdue > 0 ? <span className="text-warning">{formatNumber(overdue)} việc quá hạn</span> : "Không có việc quá hạn",
          tone: overdue > 0 ? "warning" : "default",
        },
        {
          key: "done",
          label: "Công việc đã xong",
          value: formatNumber(d.completedTasks ?? 0),
          tone: "success",
        },
        {
          key: "mine",
          to: "/tasks?mine=true",
          label: "Việc của tôi",
          value: formatNumber(d.myOpenTasks ?? 0),
          hint: "Đang được giao cho bạn",
        },
        {
          key: "posts",
          to: "/calendar",
          label: "Bài đăng 7 ngày tới",
          value: formatNumber(d.upcomingPosts ?? 0),
          hint: "Đã lên lịch",
        },
      ]}
    />
  )
}
