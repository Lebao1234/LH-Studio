import { useState } from "react"
import { ClapperboardIcon, PlusIcon, SearchIcon, SlidersHorizontalIcon } from "lucide-react"
import { useNavigate } from "react-router"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { SimpleSelect } from "@/components/shared/SimpleSelect"
import { EmptyState } from "@/components/shared/EmptyState"
import { ErrorState } from "@/components/shared/ErrorState"
import { Pagination } from "@/components/shared/DataTable"
import { usePermissions } from "@/features/auth/auth-context"
import { useUrlFilters } from "@/hooks/use-url-filters"
import { getErrorMessage } from "@/lib/api/axios"
import { options } from "@/lib/constants/labels"
import { cn } from "@/lib/utils"
import { ProjectCard } from "../components/ProjectCard"
import { ProjectFormDialog } from "../components/ProjectFormDialog"
import { useDeleteProject, useProjects } from "../hooks/use-projects"
import { PROJECT_SORTS } from "../lib/project-utils"

const DEFAULTS = { search: "", category: "all", status: "all", priority: "all", sort: "-updatedAt", page: "1" }
const PAGE_SIZE = 12

function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10" aria-hidden>
      <Skeleton className="aspect-[16/9] rounded-none" />
      <div className="grid gap-3 p-4">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-1 w-full" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  )
}

export default function ProjectsPage() {
  const navigate = useNavigate()
  const { canWrite, isManager } = usePermissions()
  const [filters, setFilter, setFilters] = useUrlFilters(DEFAULTS)
  const [createOpen, setCreateOpen] = useState(false)
  // Kept after close so the dialog does not flip to "create" during its exit animation.
  const [editing, setEditing] = useState(null)
  const [editOpen, setEditOpen] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const remove = useDeleteProject()

  const query = useProjects({
    search: filters.search,
    category: filters.category !== "all" ? filters.category : undefined,
    status: filters.status !== "all" ? filters.status : undefined,
    priority: filters.priority !== "all" ? filters.priority : undefined,
    sort: filters.sort,
    page: Number(filters.page) || 1,
    limit: PAGE_SIZE,
  })

  const items = query.data?.items ?? []
  const total = query.data?.meta?.total ?? items.length
  const hasFilters = Boolean(filters.search) || ["category", "status", "priority"].some((k) => filters[k] !== "all")
  const advancedCount = ["status", "priority"].filter((k) => filters[k] !== "all").length
  const clearFilters = () => setFilters({ search: "", category: "all", status: "all", priority: "all" })

  // The list has no per-project role, so list-level edit/delete is for studio managers.
  // Project managers can still edit from the project page; the API enforces both.
  const canEdit = canWrite && isManager
  const canDelete = isManager

  const confirmDelete = () =>
    remove.mutate(deleting._id, {
      onSuccess: () => {
        toast.success(`Đã xóa dự án ${deleting.code}.`)
        setDeleting(null)
      },
      onError: (err) => {
        // e.g. PROJECT_HAS_FINANCE: the server explains to cancel instead of deleting.
        toast.error(getErrorMessage(err), { duration: 6000 })
        setDeleting(null)
      },
    })

  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Dự án phim</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {query.isPending ? "Đang tải danh sách" : `${total} dự án${hasFilters ? " khớp bộ lọc" : ""}`}
          </p>
        </div>
        {canWrite && (
          <Button onClick={() => setCreateOpen(true)} className="h-9 gap-1.5 px-3.5">
            <PlusIcon /> Tạo dự án
          </Button>
        )}
      </div>

      <div className="grid gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-64">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              type="search"
              aria-label="Tìm dự án"
              value={filters.search}
              onChange={(e) => setFilter("search", e.target.value)}
              placeholder="Tìm theo tên hoặc mã"
              className="h-9 pl-9"
            />
          </div>
          <SimpleSelect
            aria-label="Thể loại"
            className="h-9 w-40"
            value={filters.category}
            onChange={(v) => setFilter("category", v)}
            options={options.projectCategories}
            allLabel="Mọi thể loại"
          />
          <SimpleSelect aria-label="Sắp xếp" className="h-9 w-44" value={filters.sort} onChange={(v) => setFilter("sort", v)} options={PROJECT_SORTS} />
          <Button
            type="button"
            variant="outline"
            className={cn("h-9 gap-1.5", advancedCount > 0 && "border-primary/50 text-primary")}
            aria-expanded={showAdvanced}
            onClick={() => setShowAdvanced((v) => !v)}
          >
            <SlidersHorizontalIcon /> Lọc thêm
            {advancedCount > 0 && <span className="tabular rounded bg-primary/15 px-1 text-xs">{advancedCount}</span>}
          </Button>
          {hasFilters && (
            <Button variant="ghost" className="h-9 text-muted-foreground" onClick={clearFilters}>
              Xóa bộ lọc
            </Button>
          )}
        </div>

        {showAdvanced && (
          <div className="flex flex-wrap items-center gap-2">
            <SimpleSelect
              aria-label="Trạng thái"
              className="h-9 w-44"
              value={filters.status}
              onChange={(v) => setFilter("status", v)}
              options={options.projectStatus}
              allLabel="Mọi trạng thái"
            />
            <SimpleSelect
              aria-label="Ưu tiên"
              className="h-9 w-40"
              value={filters.priority}
              onChange={(v) => setFilter("priority", v)}
              options={options.projectPriority}
              allLabel="Mọi mức ưu tiên"
            />
          </div>
        )}
      </div>

      {query.isError ? (
        <ErrorState error={query.error} onRetry={query.refetch} />
      ) : query.isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        hasFilters ? (
          <EmptyState
            icon={SearchIcon}
            title="Không có dự án khớp bộ lọc"
            description="Thử từ khóa khác hoặc bỏ bớt bộ lọc."
            action={
              <Button size="sm" variant="outline" onClick={clearFilters}>
                Xóa bộ lọc
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={ClapperboardIcon}
            title="Studio chưa có dự án nào"
            description={canWrite ? "Tạo dự án đầu tiên, mã dự án sẽ được sinh theo thể loại." : "Khi quản lý tạo dự án, bạn sẽ thấy chúng ở đây."}
            action={
              canWrite && (
                <Button size="sm" onClick={() => setCreateOpen(true)}>
                  <PlusIcon /> Tạo dự án
                </Button>
              )
            }
          />
        )
      ) : (
        <div className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4", query.isFetching && "opacity-70 transition-opacity")}>
          {items.map((p) => (
            <ProjectCard
              key={p._id}
              project={p}
              onEdit={
                canEdit
                  ? (proj) => {
                      setEditing(proj)
                      setEditOpen(true)
                    }
                  : undefined
              }
              onDelete={canDelete ? setDeleting : undefined}
            />
          ))}
        </div>
      )}

      <Pagination meta={query.data?.meta} onPageChange={(page) => setFilter("page", String(page))} />

      {canWrite && (
        <ProjectFormDialog open={createOpen} onOpenChange={setCreateOpen} onSaved={(p) => p?._id && navigate(`/projects/${p._id}`)} />
      )}
      {canEdit && (
        <ProjectFormDialog open={editOpen} onOpenChange={setEditOpen} project={editing ?? undefined} />
      )}
      {canDelete && (
        <ConfirmDialog
          open={Boolean(deleting)}
          onOpenChange={(o) => !o && setDeleting(null)}
          title={`Xóa dự án ${deleting?.code ?? ""}?`}
          description="Toàn bộ tập phim, công việc và thành viên dự án sẽ bị xóa. Bài đăng được giữ lại. Không thể hoàn tác."
          confirmLabel="Xóa dự án"
          pending={remove.isPending}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  )
}
