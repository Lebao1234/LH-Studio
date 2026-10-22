import { FilmIcon, PlayCircleIcon, CheckCircle2Icon, TrendingUpIcon, TrendingDownIcon, CalendarClockIcon } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { formatVNDCompact } from "@/lib/utils/format"

/** % change vs the previous period; null when there is nothing to compare against. */
function deltaOf(current, previous) {
  const cur = Number(current ?? 0)
  const prev = Number(previous ?? 0)
  if (!prev) return cur > 0 ? { label: "Mới", up: true } : null
  const pct = ((cur - prev) / Math.abs(prev)) * 100
  return { label: `${pct >= 0 ? "+" : ""}${pct.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%`, up: pct >= 0 }
}

export function WeeklyMetricCards({ overview, week, financial, canSeeFinance }) {
  const o = overview?.data
  const w = week?.data
  const f = financial?.data
  const prevMonthNet = f?.cashflow?.length > 1 ? f.cashflow[f.cashflow.length - 2].net : null

  const cards = [
    {
      title: "Dự án đang sản xuất",
      loading: overview?.isLoading,
      value: o?.activeProjects ?? 0,
      unit: "dự án",
      delta: null,
      note: `trên tổng ${o?.totalProjects ?? 0} dự án`,
      icon: FilmIcon,
      colorClass: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 border-indigo-200/60 dark:border-indigo-800/60",
    },
    {
      title: "Video xuất bản tuần này",
      loading: week?.isLoading,
      value: w?.totals.published ?? 0,
      unit: "bài đăng",
      delta: w ? deltaOf(w.totals.published, w.previous.published) : null,
      note: `tuần trước: ${w?.previous.published ?? 0}`,
      icon: PlayCircleIcon,
      colorClass: "bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400 border-sky-200/60 dark:border-sky-800/60",
    },
    {
      title: "Nhiệm vụ hoàn thành tuần này",
      loading: week?.isLoading || overview?.isLoading,
      value: w?.totals.tasksCompleted ?? 0,
      unit: "việc",
      delta: w ? deltaOf(w.totals.tasksCompleted, w.previous.tasksCompleted) : null,
      note: `${o?.pendingTasks ?? 0} đang mở · ${o?.overdueTasks ?? 0} quá hạn`,
      icon: CheckCircle2Icon,
      colorClass: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-900/60",
    },
    canSeeFinance
      ? {
          title: "Dòng tiền ròng tháng này",
          loading: financial?.isLoading,
          value: formatVNDCompact(f?.month?.netCash),
          unit: "₫",
          delta: f ? deltaOf(f.month.netCash, prevMonthNet) : null,
          note: "so với tháng trước",
          icon: TrendingUpIcon,
          colorClass: "bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400 border-violet-200/60 dark:border-violet-800/60",
        }
      : {
          title: "Bài đăng sắp tới",
          loading: overview?.isLoading,
          value: o?.upcomingPosts ?? 0,
          unit: "bài",
          delta: null,
          note: "trong 7 ngày tới",
          icon: CalendarClockIcon,
          colorClass: "bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400 border-violet-200/60 dark:border-violet-800/60",
        },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon
        const DeltaIcon = card.delta?.up === false ? TrendingDownIcon : TrendingUpIcon
        return (
          <div
            key={card.title}
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
              {card.loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                    {card.value}
                  </span>
                  {card.unit && (
                    <span className="text-xs font-medium text-muted-foreground">
                      {card.unit}
                    </span>
                  )}
                </>
              )}
            </div>

            <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between gap-2 text-xs">
              {card.delta ? (
                <span
                  className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-full border ${
                    card.delta.up
                      ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200/60 dark:border-emerald-800/60"
                      : "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border-rose-200/60 dark:border-rose-800/60"
                  }`}
                >
                  <DeltaIcon className="size-3" />
                  {card.delta.label}
                </span>
              ) : (
                <span />
              )}
              <span className="text-muted-foreground text-[11px] truncate">
                {card.note}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
