import { Link } from "react-router"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

const TONES = {
  default: "text-foreground",
  info: "text-primary",
  success: "text-success",
  warning: "text-warning",
  danger: "text-destructive",
}

/**
 * One panel of figures separated by hairlines, instead of a row of identical cards.
 * items: [{ key, label, value, hint, tone, to }]
 */
export function StatStrip({ items, loading, className }) {
  return (
    <div
      className={cn(
        // gap-px over a tinted background draws the hairlines between cells
        "grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-foreground/8 ring-1 ring-foreground/10",
        items.length >= 6 ? "sm:grid-cols-3 xl:grid-cols-6" : "lg:grid-cols-4",
        className,
      )}
    >
      {items.map(({ key, label, value, hint, tone = "default", to }) => {
        const body = (
          <>
            <p className="text-xs text-muted-foreground">{label}</p>
            <div className="mt-1.5">
              {loading ? (
                <Skeleton className="h-7 w-16" />
              ) : (
                <span className={cn("tabular font-heading text-2xl leading-none font-semibold", TONES[tone])}>{value}</span>
              )}
            </div>
            {hint && !loading && <p className="mt-1.5 truncate text-xs text-muted-foreground">{hint}</p>}
          </>
        )
        const cls = "min-w-0 bg-card px-4 py-3.5"
        return to ? (
          <Link
            key={key}
            to={to}
            className={cn(cls, "block outline-none transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset")}
          >
            {body}
          </Link>
        ) : (
          <div key={key} className={cls}>
            {body}
          </div>
        )
      })}
    </div>
  )
}
