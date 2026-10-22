import { useState, useMemo } from "react"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { WavesIcon } from "lucide-react"

function generateWaveData(period = "week") {
  if (period === "week") {
    const days = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"]
    return days.map((day, i) => {
      const output = Math.round(20 + Math.sin(i * 1.1) * 14 + i * 2.5)
      const progress = Math.round(15 + Math.cos(i * 0.9) * 10 + i * 1.8)
      return { label: day, output, progress, views: output * 1250 }
    })
  }

  if (period === "month") {
    return Array.from({ length: 15 }).map((_, i) => {
      const output = Math.round(25 + Math.sin(i * 0.5) * 16 + Math.cos(i * 0.3) * 8)
      const progress = Math.round(18 + Math.cos(i * 0.6) * 12)
      return { label: `Ngày ${i * 2 + 1}`, output, progress, views: output * 1100 }
    })
  }

  // Quarter
  const weeks = ["Tuần 1", "Tuần 2", "Tuần 3", "Tuần 4", "Tuần 5", "Tuần 6", "Tuần 7", "Tuần 8", "Tuần 9", "Tuần 10", "Tuần 11", "Tuần 12"]
  return weeks.map((w, i) => {
    const output = Math.round(45 + Math.sin(i * 0.4) * 25 + i * 2)
    const progress = Math.round(35 + Math.cos(i * 0.5) * 18 + i * 1.5)
    return { label: w, output, progress, views: output * 1500 }
  })
}

export function WaveAreaChart({ className }) {
  const [period, setPeriod] = useState("week")
  const data = useMemo(() => generateWaveData(period), [period])

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
              Lượn sóng biểu thị nhịp độ phát hành video & tiến độ hậu kỳ
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
                `${val} mục`,
                name === "output" ? "Video phát hành" : "Tiến độ hậu kỳ",
              ]}
            />
            {/* Wave Curve 1 */}
            <Area
              type="natural"
              dataKey="output"
              stroke="#6366f1"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#waveOutputGrad)"
            />
            {/* Wave Curve 2 */}
            <Area
              type="natural"
              dataKey="progress"
              stroke="#06b6d4"
              strokeWidth={2}
              strokeDasharray="4 4"
              fillOpacity={1}
              fill="url(#waveProgressGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-5 pt-3 border-t border-border/50 text-xs">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-[#6366f1]" />
          <span className="text-muted-foreground font-medium">Video phát hành</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-[#06b6d4]" />
          <span className="text-muted-foreground font-medium">Tiến độ hậu kỳ</span>
        </div>
      </div>
    </div>
  )
}

