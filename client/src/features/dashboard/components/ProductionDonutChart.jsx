import { useState } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { PieChartIcon } from "lucide-react"

export function ProductionDonutChart({ tasks = [], className }) {
  const [metricType, setMetricType] = useState("status")

  const completed = tasks.filter((t) => t.status === "done").length || 42
  const inProgress = tasks.filter((t) => t.status === "in_progress").length || 28
  const review = tasks.filter((t) => t.status === "review").length || 14
  const todo = tasks.filter((t) => t.status === "todo").length || 9

  const statusData = [
    { name: "Hoàn thành", value: completed, color: "#10b981", percent: "45%" }, // Emerald
    { name: "Đang sản xuất", value: inProgress, color: "#3b82f6", percent: "30%" }, // Blue
    { name: "Chờ duyệt", value: review, color: "#f59e0b", percent: "15%" }, // Amber
    { name: "Lên kịch bản", value: todo, color: "#8b5cf6", percent: "10%" }, // Purple
  ]

  const platformData = [
    { name: "YouTube", value: 36, color: "#ef4444", percent: "40%" },
    { name: "TikTok", value: 27, color: "#06b6d4", percent: "30%" },
    { name: "Facebook", value: 18, color: "#3b82f6", percent: "20%" },
    { name: "Khác", value: 9, color: "#a855f7", percent: "10%" },
  ]

  const activeData = metricType === "status" ? statusData : platformData
  const total = activeData.reduce((acc, curr) => acc + curr.value, 0)

  return (
    <div className={`rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs flex flex-col justify-between ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
            <PieChartIcon className="size-4" />
          </div>
          <div>
            <h3 className="font-heading text-base font-bold text-foreground">
              Biểu đồ tròn — Tỷ trọng phân bổ
            </h3>
            <p className="text-xs text-muted-foreground">
              Tỷ lệ tiến độ & phân loại nội dung sản xuất
            </p>
          </div>
        </div>

        <select
          value={metricType}
          onChange={(e) => setMetricType(e.target.value)}
          className="h-8 rounded-xl border border-border bg-background px-2.5 text-xs font-semibold text-foreground outline-none focus:ring-1 focus:ring-primary shadow-xs"
        >
          <option value="status">Theo trạng thái</option>
          <option value="platform">Theo nền tảng</option>
        </select>
      </div>

      {/* Donut Chart with central total */}
      <div className="relative h-56 w-full flex items-center justify-center my-auto">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                fontSize: 12,
                color: "var(--popover-foreground)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              }}
              formatter={(val) => [`${val} mục`, "Số lượng"]}
            />
            <Pie
              data={activeData}
              cx="50%"
              cy="50%"
              innerRadius={62}
              outerRadius={88}
              paddingAngle={4}
              dataKey="value"
              strokeWidth={0}
            >
              {activeData.map((entry, index) => (
                <Cell key={`donut-cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-black tracking-tight text-foreground">
            {total}
          </span>
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Tổng nội dung
          </span>
        </div>
      </div>

      {/* Legend with percentages */}
      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border/50 text-xs">
        {activeData.map((item) => (
          <div key={item.name} className="flex items-center justify-between px-2 py-1 rounded-lg bg-muted/40">
            <div className="flex items-center gap-2 truncate">
              <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-foreground font-medium truncate">{item.name}</span>
            </div>
            <span className="font-bold text-muted-foreground ml-2">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

