import { useState } from "react"
import { EyeIcon, FilmIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { ActionButton, HoverActions } from "@/components/shared/HoverActions"
import { DataTable, Pagination } from "@/components/shared/DataTable"
import { EmptyState } from "@/components/shared/EmptyState"
import { FilterBar } from "@/components/shared/FilterBar"
import { SearchInput } from "@/components/shared/SearchInput"
import { SimpleSelect } from "@/components/shared/SimpleSelect"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { UserCell } from "@/components/shared/UserAvatar"
import { getErrorMessage } from "@/lib/api/axios"
import { EPISODE_STATUS, options } from "@/lib/constants/labels"
import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/utils/format"
import { useDeleteEpisode, useEpisodes } from "../hooks/use-episodes"
import { EpisodeFormDialog } from "./EpisodeFormDialog"
import { EpisodeDetailDialog } from "./EpisodeDetailDialog"

const PAGE_SIZE = 20
const isEpisodeOverdue = (e) => Boolean(e.dueDate) && new Date(e.dueDate) < new Date() && e.status !== "completed"

/** Episodes of one project with CRUD. Permission flags come from the project page. */
export function EpisodesTab({ projectId, projectCode, canWrite, canDelete }) {
  const [filters, setFilters] = useState({ search: "", status: "all", page: 1 })
  const [viewingId, setViewingId] = useState(null)
  const [editing, setEditing] = useState(null) // null | {} (new) | episode
  const [deleting, setDeleting] = useState(null)
  const query = useEpisodes(projectId, { ...filters, limit: PAGE_SIZE })
  const remove = useDeleteEpisode(projectId)
  const rows = query.data?.items ?? []
  const update = (patch) => setFilters((f) => ({ ...f, page: 1, ...patch }))

  const columns = [
    {
      key: "code",
      header: "Mã tập",
      className: "w-36 tabular text-xs",
      cell: (e) => (
        <span className="inline-flex items-center rounded-md border border-border/70 bg-muted/60 px-2 py-0.5 text-xs font-mono font-medium text-foreground">
          {e.code || (projectCode ? `${projectCode}-E${String(e.episodeNumber).padStart(2, "0")}` : `#${e.episodeNumber}`)}
        </span>
      ),
    },
    {
      key: "title",
      header: "Tên tập",
      cell: (e) => <span className="line-clamp-1 font-medium">{e.title}</span>,
    },
    { key: "status", header: "Trạng thái", cell: (e) => <StatusBadge map={EPISODE_STATUS} value={e.status} /> },
    {
      key: "assignee",
      header: "Phụ trách",
      headClassName: "hidden md:table-cell",
      className: "hidden md:table-cell",
      cell: (e) => (e.assignedTo ? <UserCell user={e.assignedTo} /> : <span className="text-muted-foreground">—</span>),
    },
    {
      key: "due",
      header: "Hạn chót",
      headClassName: "hidden sm:table-cell",
      className: "hidden sm:table-cell",
      cell: (e) => (
        <span className={cn("tabular text-xs", isEpisodeOverdue(e) ? "font-medium text-destructive" : "text-muted-foreground")}>
          {formatDate(e.dueDate)}
          {isEpisodeOverdue(e) && " · Quá hạn"}
        </span>
      ),
    },
    {
      key: "tasks",
      header: "Công việc",
      headClassName: "hidden lg:table-cell",
      className: "hidden lg:table-cell text-xs text-muted-foreground tabular",
      cell: (e) => `${e.tasks?.open ?? 0} mở / ${e.tasks?.total ?? 0}`,
    },
    ...(canWrite || canDelete
      ? [
          {
            key: "actions",
            header: <span className="sr-only">Thao tác</span>,
            className: "w-24",
            cell: (e) => (
              <HoverActions className="justify-end">
                <ActionButton icon={EyeIcon} label={`Xem tập ${e.episodeNumber}`} onClick={() => setViewingId(e._id)} />
                {canWrite && <ActionButton icon={PencilIcon} label={`Sửa tập ${e.episodeNumber}`} onClick={() => setEditing(e)} />}
                {canDelete && <ActionButton icon={Trash2Icon} tone="destructive" label={`Xóa tập ${e.episodeNumber}`} onClick={() => setDeleting(e)} />}
              </HoverActions>
            ),
          },
        ]
      : []),
  ]

  const confirmDelete = () =>
    remove.mutate(deleting._id, {
      onSuccess: () => {
        toast.success("Đã xóa tập phim.")
        setDeleting(null)
      },
      onError: (err) => toast.error(getErrorMessage(err)),
    })

  const hasFilters = Boolean(filters.search) || filters.status !== "all"

  return (
    <div className="grid gap-3">
      <FilterBar>
        <SearchInput value={filters.search} onChange={(v) => update({ search: v })} placeholder="Tìm tập phim..." />
        <SimpleSelect
          aria-label="Lọc trạng thái tập"
          className="w-full sm:w-40"
          value={filters.status}
          onChange={(v) => update({ status: v })}
          options={options.episodeStatus}
          allLabel="Mọi trạng thái"
        />
        {canWrite && (
          <Button size="sm" className="sm:ml-auto" onClick={() => setEditing({})}>
            <PlusIcon /> Thêm tập
          </Button>
        )}
      </FilterBar>

      <DataTable
        columns={columns}
        rows={rows}
        isLoading={query.isPending}
        error={query.error}
        onRetry={query.refetch}
        onRowClick={(e) => setViewingId(e._id)}
        empty={
          <EmptyState
            icon={FilmIcon}
            title={hasFilters ? "Không có tập khớp bộ lọc" : "Dự án chưa có tập phim"}
            description={!hasFilters && canWrite ? "Thêm tập đầu tiên, mã tập được đánh theo mã dự án." : undefined}
            className="m-3 border-0"
          />
        }
      />
      <Pagination meta={query.data?.meta} onPageChange={(page) => setFilters((f) => ({ ...f, page }))} />

      <EpisodeDetailDialog
        open={Boolean(viewingId)}
        onOpenChange={(o) => !o && setViewingId(null)}
        episodeId={viewingId}
        projectCode={projectCode}
        canEdit={canWrite}
        onEdit={(ep) => setEditing(ep)}
      />

      {canWrite && (
        <EpisodeFormDialog
          open={Boolean(editing)}
          onOpenChange={(o) => !o && setEditing(null)}
          projectId={projectId}
          projectCode={projectCode}
          episode={editing?._id ? editing : null}
        />
      )}
      {canDelete && (
        <ConfirmDialog
          open={Boolean(deleting)}
          onOpenChange={(o) => !o && setDeleting(null)}
          title={`Xóa tập ${deleting?.episodeNumber ?? ""}?`}
          description="Công việc và bài đăng liên quan sẽ được giữ lại nhưng bỏ liên kết với tập này."
          confirmLabel="Xóa tập"
          pending={remove.isPending}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  )
}
