import { useState } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { GaugeIcon } from "lucide-react"

export function ProductionEfficiencyDonut({ tasks = [] }) {
  const [period, setPeriod] = useState("current")

  const completed = tasks.filter((t) => t.status === "done").length || 112
  const inProgress = tasks.filter((t) => t.status === "in_progress").length || 54
  const pending = tasks.filter((t) => t.status === "todo" || t.status === "review").length || 20
  const total = completed + inProgress + pending

  const data = [
    { name: "Hoàn thành", value: completed, color: "#2563eb" }, // Royal blue
    { name: "Đang sản xuất", value: inProgress, color: "#38bdf8" }, // Sky blue
    { name: "Chờ duyệt", value: pending, color: "#93c5fd" }, // Light blue
  ]

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs flex flex-col justify-between h-full">
      {/* Header with selector */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <GaugeIcon className="size-4 text-blue-600 dark:text-blue-400" />
          <h3 className="font-heading text-sm font-bold text-foreground">
            Project Efficiency
          </h3>
        </div>

        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="h-7 rounded-lg border border-border bg-background px-2 text-xs font-semibold text-foreground outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="current">Tháng này</option>
          <option value="last">Tháng trước</option>
          <option value="quarter">Quý này</option>
        </select>
      </div>

      {/* Donut Chart with central text matching reference */}
      <div className="relative h-44 w-full flex items-center justify-center my-auto">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                fontSize: 12,
                color: "var(--popover-foreground)",
              }}
              formatter={(val) => [`${val} mục`, "Số lượng"]}
            />
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={74}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Central Label matching reference */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-black tracking-tight text-foreground">
            {total}
          </span>
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Videos
          </span>
        </div>
      </div>

      {/* Legend below */}
      <div className="flex items-center justify-center gap-3 pt-2 border-t border-border/50 text-[11px] text-muted-foreground">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
            <span>{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

