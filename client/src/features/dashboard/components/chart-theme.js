// Shared Recharts styling for the dark theme. Colours are CSS variables only.

/** StatusBadge tone → chart fill. */
export const TONE_COLORS = {
  success: "var(--success)",
  info: "var(--info)",
  warning: "var(--warning)",
  danger: "var(--destructive)",
  expense: "var(--expense)",
  violet: "var(--chart-4)",
  neutral: "var(--chart-3)",
  muted: "var(--muted-foreground)",
}

export const toneColor = (tone) => TONE_COLORS[tone] ?? TONE_COLORS.neutral

export const axisProps = {
  stroke: "var(--border)",
  tick: { fill: "var(--muted-foreground)", fontSize: 11 },
  tickLine: false,
  axisLine: false,
}

export const gridProps = {
  stroke: "var(--border)",
  strokeDasharray: "3 3",
}

export const tooltipProps = {
  cursor: { fill: "var(--muted)", opacity: 0.35 },
  contentStyle: {
    background: "var(--popover)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    fontSize: 12,
    color: "var(--popover-foreground)",
    boxShadow: "none",
    padding: "6px 10px",
  },
  labelStyle: { color: "var(--muted-foreground)", marginBottom: 2 },
  itemStyle: { color: "var(--popover-foreground)", padding: 0 },
}

/** Turns a `{ status: count }` map into ordered chart rows using a labels map. */
export function toStatusRows(counts = {}, labelMap) {
  return Object.entries(labelMap).map(([key, meta]) => ({
    key,
    label: meta.label,
    count: Number(counts?.[key] ?? 0),
    fill: toneColor(meta.tone),
  }))
}
