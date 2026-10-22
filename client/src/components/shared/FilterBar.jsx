import { cn } from "@/lib/utils"

/** Horizontal, wrapping container for search + filter controls. */
export function FilterBar({ children, className }) {
  return <div className={cn("flex flex-wrap items-center gap-2 [&>*]:min-w-0", className)}>{children}</div>
}
