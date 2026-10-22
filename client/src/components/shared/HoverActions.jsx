import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

/**
 * Row/card actions that appear on hover or keyboard focus of the nearest `group/item`
 * ancestor (see `.hover-actions` in index.css). Always visible on touch screens.
 * Clicks never bubble to the row/card underneath.
 */
export function HoverActions({ className, children, ...props }) {
  return (
    <div
      className={cn("hover-actions flex items-center gap-0.5", className)}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      {...props}
    >
      {children}
    </div>
  )
}

const TONES = {
  default: "text-muted-foreground hover:bg-muted hover:text-foreground",
  destructive: "text-muted-foreground hover:bg-destructive/12 hover:text-destructive",
  // For actions sitting on top of a cover image.
  overlay: "bg-black/45 text-white/85 backdrop-blur-sm hover:bg-black/70 hover:text-white",
  "overlay-destructive": "bg-black/45 text-white/85 backdrop-blur-sm hover:bg-destructive hover:text-white",
}

/** Icon-only action with a tooltip; the label doubles as the accessible name. */
export function ActionButton({ icon: Icon, label, onClick, tone = "default", pressed, className, iconClassName }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label={label}
            aria-pressed={pressed}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onClick?.(e)
            }}
            className={cn(
              "flex size-7 items-center justify-center rounded-md outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
              TONES[tone],
              className,
            )}
          />
        }
      >
        <Icon className={cn("size-3.5", iconClassName)} aria-hidden />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
