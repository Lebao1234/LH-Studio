import { useState } from "react"
import { PlusIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { Pagination } from "@/components/shared/DataTable"
import { usePermissions } from "@/features/auth/auth-context"
import { getErrorMessage } from "@/lib/api/axios"
import { useDeleteTask, useTasks } from "../hooks/use-tasks"
import { KANBAN_STATUSES } from "../lib/task-utils"
import { TaskFilters, ViewToggle } from "./TaskFilters"
import { TaskFormDialog } from "./TaskFormDialog"
import { TaskKanban } from "./TaskKanban"
import { TaskTable } from "./TaskTable"

const PAGE_SIZE = 20
const KANBAN_LIMIT = 100

/**
 * Task list UI (filters + table/kanban + create/edit/delete) driven by an external filter state
 * with the `useUrlFilters` signature. `projectId` scopes everything to one project.
 */
export function TaskList({ filters, setFilter, setFilters, projectId, canCreate }) {
  const perms = usePermissions()
  const canWrite = perms.canWrite
  const allowCreate = canCreate ?? canWrite
  const scopedProject = projectId ?? (filters.projectId !== "all" ? filters.projectId : undefined)
  const kanban = filters.view === "kanban"

  const query = useTasks({
    search: filters.search,
    projectId: scopedProject,
    status: kanban && filters.status === "all" ? KANBAN_STATUSES.join(",") : filters.status,
    priority: filters.priority,
    mine: filters.mine,
    overdue: filters.overdue,
    sort: filters.sort,
    page: kanban ? 1 : Number(filters.page) || 1,
    limit: kanban ? KANBAN_LIMIT : PAGE_SIZE,
  })
  const rows = query.data?.items ?? []
  const meta = query.data?.meta

  const [editing, setEditing] = useState(null) // null | { task } | { defaults }
  const [deleting, setDeleting] = useState(null)
  const remove = useDeleteTask()

  const openTask = (task) => setEditing({ task })
  const openCreate = (status) => setEditing({ defaults: status ? { status } : {} })

  const confirmDelete = () =>
    remove.mutate(deleting._id, {
      onSuccess: () => {
        toast.success("Đã xóa công việc.")
        setDeleting(null)
      },
      onError: (err) => toast.error(getErrorMessage(err)),
    })

  const shared = { isLoading: query.isPending, error: query.error, onRetry: query.refetch, onOpen: openTask, canWrite, showProject: !projectId }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ViewToggle value={filters.view} onChange={(v) => setFilters({ view: v, page: "1" })} />
        {allowCreate && (
          <Button size="sm" onClick={() => openCreate()}>
            <PlusIcon /> Tạo công việc
          </Button>
        )}
      </div>
      <TaskFilters filters={filters} setFilter={setFilter} setFilters={setFilters} showProject={!projectId} />

      {kanban ? (
        <>
          <TaskKanban rows={rows} onCreate={allowCreate ? openCreate : undefined} {...shared} />
          {meta && meta.total > rows.length && (
            <p className="text-xs text-muted-foreground">
              Đang hiển thị {rows.length}/{meta.total} việc. Dùng bộ lọc hoặc chế độ Bảng để xem hết.
            </p>
          )}
        </>
      ) : (
        <>
          <TaskTable rows={rows} onEdit={openTask} onDelete={setDeleting} {...shared} />
          <Pagination meta={meta} onPageChange={(page) => setFilter("page", String(page))} />
        </>
      )}

      <TaskFormDialog
        open={Boolean(editing)}
        onOpenChange={(o) => !o && setEditing(null)}
        task={editing?.task}
        projectId={projectId}
        defaults={{ ...editing?.defaults, projectId: scopedProject }}
      />
      {canWrite && (
        <ConfirmDialog
          open={Boolean(deleting)}
          onOpenChange={(o) => !o && setDeleting(null)}
          title="Xóa công việc?"
          description={deleting ? `"${deleting.title}" và các phân công sẽ bị xóa vĩnh viễn.` : undefined}
          confirmLabel="Xóa"
          pending={remove.isPending}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  )
}
