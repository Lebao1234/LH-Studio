import { cn } from "@/lib/utils"

const TONES = {
  success: "bg-success/15 text-success ring-success/25",
  info: "bg-info/15 text-info ring-info/25",
  warning: "bg-warning/15 text-warning ring-warning/25",
  danger: "bg-destructive/15 text-destructive ring-destructive/25",
  expense: "bg-expense/15 text-expense ring-expense/25",
  violet: "bg-chart-4/15 text-chart-4 ring-chart-4/25",
  neutral: "bg-foreground/8 text-foreground/85 ring-foreground/12",
  muted: "bg-muted text-muted-foreground ring-foreground/8",
}

/**
 * Renders an enum value with its label + tone from a labels map, e.g.
 * <StatusBadge map={TASK_STATUS} value="done" />
 */
export function StatusBadge({ map, value, tone, children, className, dot = false }) {
  const entry = map?.[value]
  const resolvedTone = tone ?? entry?.tone ?? "neutral"
  return (
    <span
      className={cn(
        "inline-flex h-5 shrink-0 items-center gap-1 rounded-full px-2 text-[11px] font-medium whitespace-nowrap ring-1 ring-inset",
        TONES[resolvedTone] ?? TONES.neutral,
        className,
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
      {children ?? entry?.label ?? value ?? "—"}
    </span>
  )
}
