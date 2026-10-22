import { useState } from "react"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { WavesIcon } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useProductionTrend } from "../hooks/use-dashboard"

export function WaveAreaChart({ className }) {
  const [period, setPeriod] = useState("week")
  const trend = useProductionTrend(period)
  const data = trend.data?.series ?? []

  return (
    <div className={`rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs flex flex-col justify-between ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
            <WavesIcon className="size-4" />
          </div>
          <div>
            <h3 className="font-heading text-base font-bold text-foreground">
              Biểu đồ sóng — Xu hướng sản xuất video
            </h3>
            <p className="text-xs text-muted-foreground">
              Số bài đăng đã xuất bản và công việc hoàn thành theo thời gian
            </p>
          </div>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center gap-1 p-1 bg-muted/60 rounded-xl w-fit border border-border/50 text-xs self-start sm:self-auto">
          {[
            { id: "week", label: "Tuần này" },
            { id: "month", label: "Tháng này" },
            { id: "quarter", label: "Quý này" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPeriod(item.id)}
              className={`px-3 py-1.5 font-medium rounded-lg transition-all ${
                period === item.id
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Recharts Area Wave Chart */}
      <div className="h-64 sm:h-72 w-full mt-2">
        {trend.isLoading ? <Skeleton className="size-full rounded-xl" /> : (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="waveOutputGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="waveProgressGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.01} />
              </linearGradient>
            </defs>
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
                val,
                name === "published" ? "Video phát hành" : "Công việc hoàn thành",
              ]}
            />
            {/* Wave Curve 1 */}
            <Area
              type="natural"
              dataKey="published"
              stroke="#6366f1"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#waveOutputGrad)"
            />
            {/* Wave Curve 2 */}
            <Area
              type="natural"
              dataKey="tasksCompleted"
              stroke="#06b6d4"
              strokeWidth={2}
              strokeDasharray="4 4"
              fillOpacity={1}
              fill="url(#waveProgressGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-5 pt-3 border-t border-border/50 text-xs">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-[#6366f1]" />
          <span className="text-muted-foreground font-medium">Video phát hành</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-[#06b6d4]" />
          <span className="text-muted-foreground font-medium">Công việc hoàn thành</span>
        </div>
      </div>
    </div>
  )
}

