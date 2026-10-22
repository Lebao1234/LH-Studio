import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { BarChart3Icon } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useProductionTrend } from "../hooks/use-dashboard"

export function WeeklyProductionBarChart({ className }) {
  const week = useProductionTrend("week")
  const data = week.data?.series ?? []

  return (
    <div className={`rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs flex flex-col justify-between ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60">
            <BarChart3Icon className="size-4" />
          </div>
          <div>
            <h3 className="font-heading text-base font-bold text-foreground">
              Biểu đồ cột — Sản lượng từng ngày
            </h3>
            <p className="text-xs text-muted-foreground">
              Công việc đến hạn so với công việc hoàn thành mỗi ngày trong tuần
            </p>
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="h-64 sm:h-72 w-full mt-2">
        {week.isLoading ? <Skeleton className="size-full rounded-xl" /> : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={6}>
            <XAxis
              dataKey="label"
              stroke="var(--border)"
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              dy={6}
            />
            <YAxis
              allowDecimals={false}
              stroke="var(--border)"
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                fontSize: 12,
                color: "var(--popover-foreground)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              }}
              formatter={(val, name) => [
                `${val} việc`,
                name === "tasksCompleted" ? "Hoàn thành" : "Đến hạn",
              ]}
            />
            {/* Target bar */}
            <Bar
              dataKey="tasksDue"
              fill="#cbd5e1"
              radius={[5, 5, 0, 0]}
              maxBarSize={22}
            />
            {/* Completed bar */}
            <Bar
              dataKey="tasksCompleted"
              fill="#3b82f6"
              radius={[5, 5, 0, 0]}
              maxBarSize={22}
            />
          </BarChart>
        </ResponsiveContainer>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-5 pt-3 border-t border-border/50 text-xs">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-sm bg-[#cbd5e1]" />
          <span className="text-muted-foreground font-medium">Đến hạn</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-sm bg-[#3b82f6]" />
          <span className="text-muted-foreground font-medium">Hoàn thành</span>
        </div>
      </div>
    </div>
  )
}

