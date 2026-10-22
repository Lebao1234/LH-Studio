import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { formatCompactNumber, formatDate, formatDateTime, formatNumber } from "@/lib/utils/format"

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <div className="rounded-lg bg-popover px-2.5 py-1.5 text-xs shadow-md ring-1 ring-foreground/10">
      <p className="text-muted-foreground">{formatDateTime(p.recordedAt)}</p>
      <p className="tabular font-medium">{formatNumber(p.viewsRaw)} lượt xem</p>
    </div>
  )
}

/** Cumulative views over time. `metrics` = snapshots, any order. */
export function MetricsChart({ metrics }) {
  const data = [...metrics]
    .sort((a, b) => new Date(a.recordedAt) - new Date(b.recordedAt))
    .map((m) => ({ recordedAt: m.recordedAt, views: Number(m.views ?? 0), viewsRaw: m.views }))

  if (data.length < 2) return null

  return (
    <div className="h-36 w-full" role="img" aria-label="Biểu đồ lượt xem tích lũy theo thời gian">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="recordedAt"
            tickFormatter={(v) => formatDate(v, "dd/MM")}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            minTickGap={16}
          />
          <YAxis
            width={40}
            tickFormatter={formatCompactNumber}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--border)" }} />
          <Line type="monotone" dataKey="views" stroke="var(--primary)" strokeWidth={2} dot={{ r: 2.5, fill: "var(--primary)" }} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
