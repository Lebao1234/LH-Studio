import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { axisProps, tooltipProps } from "./chart-theme"

/**
 * Horizontal bar chart for an enum distribution.
 * rows: [{ key, label, count, fill }] (see toStatusRows)
 */
export function StatusBarChart({ rows, ariaLabel, unit = "", labelWidth = 96 }) {
  const height = Math.max(rows.length * 28 + 8, 80)
  return (
    <div role="img" aria-label={`${ariaLabel}: ${rows.map((r) => `${r.label} ${r.count}`).join(", ")}`}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 28, bottom: 0, left: 0 }} barCategoryGap={6}>
          <XAxis type="number" hide allowDecimals={false} domain={[0, (max) => Math.max(max, 1)]} />
          <YAxis type="category" dataKey="label" width={labelWidth} {...axisProps} interval={0} />
          <Tooltip {...tooltipProps} formatter={(v) => [`${v}${unit}`, "Số lượng"]} />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={16} isAnimationActive={false} background={{ fill: "var(--muted)", opacity: 0.35, radius: 4 }}>
            {rows.map((r) => (
              <Cell key={r.key} fill={r.fill} />
            ))}
            <LabelList dataKey="count" position="right" fill="var(--muted-foreground)" fontSize={11} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
