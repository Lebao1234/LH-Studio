import { AlertCircleIcon } from "lucide-react"
import { UserAvatarGroup } from "@/components/shared/UserAvatar"
import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/utils/format"
import { isTaskOverdue } from "../lib/task-utils"

/** Due date with an overdue hint. */
export function TaskDue({ task, className }) {
  const overdue = isTaskOverdue(task)
  if (!task.dueDate) return <span className={cn("text-xs text-muted-foreground", className)}>—</span>
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs tabular", overdue ? "font-medium text-destructive" : "text-muted-foreground", className)}>
      {overdue && <AlertCircleIcon className="size-3.5" aria-hidden />}
      {formatDate(task.dueDate)}
      {overdue && <span className="sr-only">(quá hạn)</span>}
    </span>
  )
}

/** Avatars of assignees, lead first (the API already orders them). */
export function TaskAssignees({ task, max = 3 }) {
  return <UserAvatarGroup users={(task.assignments ?? []).map((a) => a.user)} max={max} />
}

export function TaskContext({ task, showProject = true }) {
  const parts = []
  if (showProject && task.project) parts.push(task.project.code)
  if (task.episode) parts.push(`Tập ${task.episode.episodeNumber}`)
  if (!parts.length) return null
  return <p className="truncate text-xs text-muted-foreground">{parts.join(" · ")}</p>
}
