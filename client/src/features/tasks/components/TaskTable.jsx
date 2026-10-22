import { ListTodoIcon } from "lucide-react"
import { DataTable } from "@/components/shared/DataTable"
import { EmptyState } from "@/components/shared/EmptyState"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { PRIORITY, TASK_STATUS, TASK_TYPES } from "@/lib/constants/labels"
import { cn } from "@/lib/utils"
import { isTaskOverdue } from "../lib/task-utils"
import { TaskAssignees, TaskContext, TaskDue } from "./TaskMeta"
import { TaskRowActions } from "./TaskRowActions"
import { TaskStatusSelect } from "./TaskStatusSelect"

export function TaskTable({ rows, isLoading, error, onRetry, onOpen, onEdit, onDelete, canWrite, showProject = true, empty }) {
  const columns = [
    {
      key: "title",
      header: "Công việc",
      cell: (t) => (
        <div className="min-w-0 max-w-[28rem]">
          <p className={cn("truncate font-medium", t.status === "cancelled" && "text-muted-foreground line-through")}>
            {isTaskOverdue(t) && <span className="mr-1.5 inline-block size-1.5 rounded-full bg-destructive align-middle" aria-label="Quá hạn" />}
            {t.title}
          </p>
          <TaskContext task={t} showProject={showProject} />
        </div>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      className: "w-40",
      cell: (t) => (canWrite ? <TaskStatusSelect task={t} /> : <StatusBadge map={TASK_STATUS} value={t.status} />),
    },
    {
      key: "priority",
      header: "Ưu tiên",
      headClassName: "hidden sm:table-cell",
      className: "hidden sm:table-cell",
      cell: (t) => <StatusBadge map={PRIORITY} value={t.priority} />,
    },
    {
      key: "type",
      header: "Loại",
      headClassName: "hidden xl:table-cell",
      className: "hidden xl:table-cell text-xs text-muted-foreground",
      cell: (t) => TASK_TYPES[t.type]?.label ?? "—",
    },
    {
      key: "assignees",
      header: "Người làm",
      headClassName: "hidden md:table-cell",
      className: "hidden md:table-cell",
      cell: (t) => <TaskAssignees task={t} />,
    },
    { key: "due", header: "Hạn chót", headClassName: "hidden sm:table-cell", className: "hidden sm:table-cell", cell: (t) => <TaskDue task={t} /> },
    ...(canWrite
      ? [
          {
            key: "actions",
            header: <span className="sr-only">Thao tác</span>,
            className: "w-10 text-right",
            cell: (t) => <TaskRowActions task={t} onEdit={onEdit} onDelete={onDelete} />,
          },
        ]
      : []),
  ]

  return (
    <DataTable
      columns={columns}
      rows={rows}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      onRowClick={onOpen}
      empty={empty ?? <EmptyState icon={ListTodoIcon} title="Không có công việc" className="m-3 border-0" />}
    />
  )
}
