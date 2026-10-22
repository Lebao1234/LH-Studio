import { BanIcon, CheckIcon, ClockIcon, PencilLineIcon, TriangleAlertIcon } from "lucide-react"

// Calendar chip styling per post status. Icons keep statuses distinguishable without colour.
export const STATUS_STYLE = {
  draft: { chip: "border-dashed border-foreground/25 bg-muted/60 text-muted-foreground", dot: "bg-muted-foreground", icon: PencilLineIcon },
  scheduled: { chip: "border-info/35 bg-info/15 text-info", dot: "bg-info", icon: ClockIcon },
  published: { chip: "border-success/35 bg-success/15 text-success", dot: "bg-success", icon: CheckIcon },
  failed: { chip: "border-destructive/35 bg-destructive/15 text-destructive", dot: "bg-destructive", icon: TriangleAlertIcon },
  cancelled: { chip: "border-transparent bg-muted/40 text-muted-foreground line-through", dot: "bg-muted-foreground/40", icon: BanIcon },
}

export const styleOf = (status) => STATUS_STYLE[status] ?? STATUS_STYLE.draft
