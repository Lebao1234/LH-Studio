import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

const ACCENTS = {
  default: "text-foreground",
  success: "text-success",
  income: "text-income",
  expense: "text-expense",
  warning: "text-warning",
  danger: "text-destructive",
  info: "text-info",
}

const ICON_BG = {
  default: "bg-foreground/8 text-foreground/80",
  success: "bg-success/12 text-success",
  income: "bg-income/12 text-income",
  expense: "bg-expense/12 text-expense",
  warning: "bg-warning/12 text-warning",
  danger: "bg-destructive/12 text-destructive",
  info: "bg-info/12 text-info",
}

export function StatCard({ label, value, hint, icon: Icon, accent = "default", loading, className }) {
  return (
    <Card size="sm" className={cn("gap-2 px-4", className)}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {Icon && (
          <span className={cn("flex size-7 items-center justify-center rounded-lg", ICON_BG[accent])}>
            <Icon className="size-3.5" />
          </span>
        )}
      </div>
      {loading ? (
        <Skeleton className="h-7 w-28" />
      ) : (
        <p className={cn("tabular truncate text-xl font-semibold tracking-tight", ACCENTS[accent])} title={typeof value === "string" ? value : undefined}>
          {value}
        </p>
      )}
      {hint && <p className="truncate text-xs text-muted-foreground">{hint}</p>}
    </Card>
  )
}
