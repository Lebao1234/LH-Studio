import { useState } from "react"
import { Link } from "react-router"
import { CalendarIcon, FilmIcon, LinkIcon, PencilIcon, StarIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"
import { ActionButton, HoverActions } from "@/components/shared/HoverActions"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { PROJECT_STATUS } from "@/lib/constants/labels"
import { cn } from "@/lib/utils"
import { formatDate, percent } from "@/lib/utils/format"
import { isProjectOverdue, overdueDays } from "../lib/project-utils"
import { ProjectCover } from "./ProjectCover"

function readStar(id) {
  try {
    return localStorage.getItem(`lh_starred_${id}`) === "true"
  } catch {
    return false
  }
}

/** Progress from real counts only: tasks first, then episodes. Null when nothing to measure. */
function progressOf(project) {
  const tasks = project.tasks ?? {}
  const episodes = project.episodes ?? {}
  if (tasks.total > 0) return { done: tasks.done ?? 0, total: tasks.total, unit: "công việc" }
  if (episodes.total > 0) return { done: episodes.completed ?? 0, total: episodes.total, unit: "tập" }
  return null
}

function DueLabel({ project }) {
  if (!project.dueDate) return <span className="text-muted-foreground">Chưa đặt hạn</span>
  if (isProjectOverdue(project)) {
    return <span className="font-medium text-destructive">Quá hạn {overdueDays(project)} ngày</span>
  }
  return <span className="text-muted-foreground">Hạn {formatDate(project.dueDate)}</span>
}

/**
 * Project tile. Edit / delete / copy link / star appear on hover or focus;
 * `onEdit` and `onDelete` are only passed when the user is allowed to use them.
 */
export function ProjectCard({ project, onEdit, onDelete }) {
  const [starred, setStarred] = useState(() => readStar(project._id))
  const href = `/projects/${project._id}`
  const progress = progressOf(project)
  const value = progress ? percent(progress.done, progress.total) : 0

  const toggleStar = () => {
    const next = !starred
    setStarred(next)
    try {
      localStorage.setItem(`lh_starred_${project._id}`, String(next))
    } catch {
      // storage unavailable: the star still toggles for this session
    }
    toast.success(next ? "Đã đánh dấu dự án." : "Đã bỏ đánh dấu dự án.")
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${href}`)
      toast.success("Đã sao chép liên kết dự án.")
    } catch {
      toast.error("Trình duyệt chặn sao chép. Hãy mở dự án và sao chép từ thanh địa chỉ.")
    }
  }

  return (
    <article className="group/item relative flex flex-col overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10 transition-shadow hover:ring-foreground/20 has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring">
      <div className="relative aspect-[16/9]">
        <ProjectCover project={project} className="size-full" />

        {starred && (
          <span className="absolute top-2 left-2 z-20 flex size-7 items-center justify-center rounded-md bg-black/45 text-amber-300 backdrop-blur-sm" title="Đã đánh dấu">
            <StarIcon className="size-3.5 fill-current" aria-hidden />
            <span className="sr-only">Đã đánh dấu</span>
          </span>
        )}

        <HoverActions className="absolute top-2 right-2 z-20 gap-1" aria-label={`Thao tác cho ${project.title}`}>
          <ActionButton
            icon={StarIcon}
            label={starred ? "Bỏ đánh dấu" : "Đánh dấu"}
            pressed={starred}
            tone="overlay"
            iconClassName={starred ? "fill-amber-300 text-amber-300" : undefined}
            onClick={toggleStar}
          />
          <ActionButton icon={LinkIcon} label="Sao chép liên kết" tone="overlay" onClick={copyLink} />
          {onEdit && <ActionButton icon={PencilIcon} label="Sửa dự án" tone="overlay" onClick={() => onEdit(project)} />}
          {onDelete && <ActionButton icon={Trash2Icon} label="Xóa dự án" tone="overlay-destructive" onClick={() => onDelete(project)} />}
        </HoverActions>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate font-mono text-xs text-muted-foreground">{project.code}</span>
          <StatusBadge map={PROJECT_STATUS} value={project.status} />
        </div>

        <h3 className="font-heading text-base leading-snug font-semibold">
          {/* Stretched link: the whole card opens the project; actions sit above it (z-20). */}
          <Link to={href} className="line-clamp-2 outline-none after:absolute after:inset-0 after:z-10">
            {project.title}
          </Link>
        </h3>

        <div className="mt-auto grid gap-1.5">
          {progress ? (
            <>
              <div className="flex items-baseline justify-between text-xs">
                <span className="text-muted-foreground">
                  {progress.done}/{progress.total} {progress.unit} xong
                </span>
                <span className="tabular font-medium">{value}%</span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-foreground/8" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} aria-label={`Tiến độ ${progress.unit}`}>
                <div className={cn("h-full rounded-full", isProjectOverdue(project) ? "bg-destructive" : "bg-primary")} style={{ width: `${value}%` }} />
              </div>
            </>
          ) : (
            <span className="text-xs text-muted-foreground">Chưa có công việc hay tập phim</span>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-foreground/8 pt-3 text-xs">
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <CalendarIcon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
            <DueLabel project={project} />
          </span>
          <span className="inline-flex shrink-0 items-center gap-1.5 text-muted-foreground">
            <FilmIcon className="size-3.5" aria-hidden />
            <span className="tabular">{project.episodes?.total ?? 0} tập</span>
          </span>
        </div>
      </div>
    </article>
  )
}
