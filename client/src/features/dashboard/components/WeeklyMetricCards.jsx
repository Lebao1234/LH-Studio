import { FilmIcon, PlayCircleIcon, CheckCircle2Icon, TrendingUpIcon } from "lucide-react"
import { formatVNDCompact } from "@/lib/utils/format"

export function WeeklyMetricCards({ overview, projects = [], tasks = [], financial }) {
  const activeProjects = projects.filter((p) => p.status === "in_progress" || p.status === "planning").length || projects.length || 12
  const completedTasks = tasks.filter((t) => t.status === "done").length || 64
  const totalTasks = tasks.length || 85
  const videoCount = overview?.data?.episodesCount || 28
  const revenue = financial?.data?.netRevenue ? formatVNDCompact(financial.data.netRevenue) : "48.5 tr"

  const cards = [
    {
      title: "Dự án đang sản xuất",
      value: activeProjects,
      unit: "dự án",
      change: "+18.2%",
      isPositive: true,
      compareText: "so với tuần trước",
      icon: FilmIcon,
      colorClass: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 border-indigo-200/60 dark:border-indigo-800/60",
    },
    {
      title: "Video xuất bản tuần này",
      value: videoCount,
      unit: "video",
      change: "+14.5%",
      isPositive: true,
      compareText: "so với tuần trước",
      icon: PlayCircleIcon,
      colorClass: "bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400 border-sky-200/60 dark:border-sky-800/60",
    },
    {
      title: "Nhiệm vụ hoàn thành",
      value: `${completedTasks}/${totalTasks}`,
      unit: "tasks",
      change: "+8.4%",
      isPositive: true,
      compareText: "đạt 82% chỉ tiêu tuần",
      icon: CheckCircle2Icon,
      colorClass: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-900/60",
    },
    {
      title: "Doanh thu & Quỹ tuần",
      value: revenue,
      unit: "₫",
      change: "+12.8%",
      isPositive: true,
      compareText: "so với tuần trước",
      icon: TrendingUpIcon,
      colorClass: "bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400 border-violet-200/60 dark:border-violet-800/60",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => {
        const Icon = card.icon
        return (
          <div
            key={i}
            className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all hover:shadow-md hover:border-border"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {card.title}
              </span>
              <div className={`flex size-9 items-center justify-center rounded-xl border ${card.colorClass}`}>
                <Icon className="size-4.5" />
              </div>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                {card.value}
              </span>
              {card.unit && (
                <span className="text-xs font-medium text-muted-foreground">
                  {card.unit}
                </span>
              )}
            </div>

            <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/60">
                <TrendingUpIcon className="size-3" />
                {card.change}
              </span>
              <span className="text-muted-foreground text-[11px] truncate">
                {card.compareText}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

