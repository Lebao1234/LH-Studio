import { PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ErrorState } from "@/components/shared/ErrorState"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { PRIORITY, TASK_STATUS } from "@/lib/constants/labels"
import { cn } from "@/lib/utils"
import { isTaskOverdue, KANBAN_STATUSES } from "../lib/task-utils"
import { TaskAssignees, TaskContext, TaskDue } from "./TaskMeta"
import { TaskStatusSelect } from "./TaskStatusSelect"

function KanbanCard({ task, onOpen, canWrite, showProject }) {
  const overdue = isTaskOverdue(task)
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(task)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onOpen(task))}
      className={cn(
        "grid cursor-pointer gap-2 rounded-lg bg-card p-3 ring-1 ring-foreground/10 transition-colors outline-none hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring/50",
        overdue && "ring-destructive/40",
      )}
    >
      <div className="min-w-0">
        <p className="line-clamp-2 text-sm font-medium">{task.title}</p>
        <TaskContext task={task} showProject={showProject} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge map={PRIORITY} value={task.priority} />
        <TaskDue task={task} />
        {overdue && <StatusBadge tone="danger">Quá hạn</StatusBadge>}
      </div>
      <div className="flex items-center justify-between gap-2">
        <TaskAssignees task={task} />
        {canWrite && <TaskStatusSelect task={task} className="w-32" />}
      </div>
    </div>
  )
}

/** Status columns for the current result set; status changes via the select on each card. */
export function TaskKanban({ rows = [], isLoading, error, onRetry, onOpen, onCreate, canWrite, showProject = true }) {
  if (error) return <ErrorState error={error} onRetry={onRetry} />

  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
      <div className="grid min-w-[56rem] grid-cols-4 gap-3">
        {KANBAN_STATUSES.map((status) => {
          const items = rows.filter((t) => t.status === status)
          return (
            <section key={status} aria-label={TASK_STATUS[status].label} className="flex min-w-0 flex-col gap-2 rounded-xl bg-muted/40 p-2">
              <header className="flex items-center justify-between gap-2 px-1">
                <div className="flex items-center gap-2">
                  <StatusBadge map={TASK_STATUS} value={status} dot />
                  <span className="text-xs text-muted-foreground tabular">{isLoading ? "…" : items.length}</span>
                </div>
                {canWrite && onCreate && (
                  <Button variant="ghost" size="icon-xs" aria-label={`Thêm việc vào cột ${TASK_STATUS[status].label}`} onClick={() => onCreate(status)}>
                    <PlusIcon />
                  </Button>
                )}
              </header>
              {isLoading ? (
                Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)
              ) : items.length ? (
                items.map((t) => <KanbanCard key={t._id} task={t} onOpen={onOpen} canWrite={canWrite} showProject={showProject} />)
              ) : (
                <p className="px-1 py-6 text-center text-xs text-muted-foreground">Trống</p>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}
