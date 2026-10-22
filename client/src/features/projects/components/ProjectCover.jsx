import { useState } from "react"
import { cn } from "@/lib/utils"
import { projectCategoryName } from "../lib/project-utils"

/**
 * The project's cover image, or a clapperboard slate (stripe bar + category, the
 * way a crew chalks the production name) when there is none or it fails to load. The slate is the studio's
 * signature surface: it is the first thing a crew writes on for every take.
 */
export function ProjectCover({ project, size = "card", className }) {
  const [failed, setFailed] = useState(false)
  const showImage = project.coverUrl && !failed
  const large = size === "hero"

  if (showImage) {
    return (
      <div className={cn("relative overflow-hidden bg-muted", className)}>
        <img
          src={project.coverUrl}
          alt=""
          loading={large ? "eager" : "lazy"}
          onError={() => setFailed(true)}
          className="size-full object-cover transition-transform duration-500 ease-out group-hover/item:scale-[1.03] motion-reduce:transition-none"
        />
      </div>
    )
  }

  const category = projectCategoryName(project)
  return (
    <div
      aria-hidden
      className={cn(
        "relative flex flex-col overflow-hidden bg-[oklch(0.22_0.02_262)] text-[oklch(0.95_0.006_258)]",
        className,
      )}
    >
      {/* clapper bar */}
      <div
        className={cn("shrink-0 bg-[oklch(0.95_0.006_258)]", large ? "h-4" : "h-3")}
        style={{
          backgroundImage:
            "repeating-linear-gradient(-55deg, oklch(0.22 0.02 262) 0 9px, transparent 9px 18px)",
        }}
      />
      <div className={cn("flex flex-1 flex-col justify-end gap-1", large ? "p-4" : "p-4")}>
        <span className={cn("font-heading font-semibold text-white", large ? "text-lg leading-tight" : "text-2xl leading-tight")}>
          {category ?? "Dự án"}
        </span>
        <span className="text-xs text-white/55">Chưa có ảnh bìa</span>
      </div>
    </div>
  )
}
