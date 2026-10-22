import { POST_STATUS } from "@/lib/constants/labels"
import { cn } from "@/lib/utils"
import { STATUS_STYLE } from "./post-status-styles"

export function StatusLegend({ className }) {
  return (
    <ul className={cn("flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground", className)} aria-label="Chú thích trạng thái">
      {Object.entries(STATUS_STYLE).map(([status, s]) => {
        const Icon = s.icon
        return (
          <li key={status} className="flex items-center gap-1">
            <span className={cn("flex size-4 items-center justify-center rounded border", s.chip)} aria-hidden>
              <Icon className="size-2.5" />
            </span>
            {POST_STATUS[status]?.label}
          </li>
        )
      })}
    </ul>
  )
}
