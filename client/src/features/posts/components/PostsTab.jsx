import { useState } from "react"
import { FileTextIcon } from "lucide-react"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { DataTable, Pagination } from "@/components/shared/DataTable"
import { EmptyState } from "@/components/shared/EmptyState"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { ChannelCell } from "@/features/channels/components/PlatformBadge"
import { getErrorMessage } from "@/lib/api/axios"
import { POST_STATUS } from "@/lib/constants/labels"
import { postIdOf, useDeletePost, useMarkPublished, usePosts } from "../hooks/use-posts"
import { PostLinkCell, PostMetricCell, PostTimeCell } from "./PostCells"
import { PostFormDialog } from "./PostFormDialog"
import { PostMetricsDialog } from "./PostMetricsDialog"
import { PostRowActions } from "./PostRowActions"
import { PostsFilters } from "./PostsFilters"

const PAGE_SIZE = 20

/** Posts table with URL filters. `filters`/`setFilters` from useUrlFilters (owned by the page). */
export function PostsTab({ filters, setFilters }) {
  const params = {
    page: filters.page,
    limit: PAGE_SIZE,
    search: filters.search,
    status: filters.status,
    platform: filters.platform,
    channelId: filters.channel,
    projectId: filters.independent === "true" ? "" : filters.project,
    independent: filters.independent === "true" ? "true" : "",
  }
  const query = usePosts(params)

  const [editing, setEditing] = useState(null)
  const [metricsFor, setMetricsFor] = useState(null)
  const [publishing, setPublishing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const markPublished = useMarkPublished()
  const del = useDeletePost()

  const confirmPublished = () =>
    markPublished.mutate(postIdOf(publishing), {
      onSuccess: () => {
        toast.success("Đã đánh dấu bài viết là đã đăng.")
        setPublishing(null)
      },
      onError: (err) => toast.error(getErrorMessage(err)),
    })

  const confirmDelete = () =>
    del.mutate(postIdOf(deleting), {
      onSuccess: () => {
        toast.success("Đã xóa bài viết.")
        setDeleting(null)
      },
      onError: (err) => {
        toast.error(getErrorMessage(err))
        setDeleting(null)
      },
    })

  const columns = [
    {
      key: "title",
      header: "Bài viết",
      className: "max-w-72",
      cell: (p) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium" title={p.title}>
            {p.title}
          </p>
          <p className="truncate text-xs text-muted-foreground md:hidden">{p.channel?.name}</p>
        </div>
      ),
    },
    {
      key: "channel",
      header: "Kênh",
      headClassName: "hidden md:table-cell",
      className: "hidden md:table-cell max-w-56",
      cell: (p) => <ChannelCell channel={p.channel} />,
    },
    {
      key: "link",
      header: "Dự án / Tập",
      headClassName: "hidden lg:table-cell",
      className: "hidden lg:table-cell max-w-56",
      cell: (p) => <PostLinkCell post={p} />,
    },
    { key: "status", header: "Trạng thái", cell: (p) => <StatusBadge map={POST_STATUS} value={p.status} /> },
    {
      key: "time",
      header: "Thời gian",
      headClassName: "hidden sm:table-cell",
      className: "hidden sm:table-cell",
      cell: (p) => <PostTimeCell post={p} />,
    },
    {
      key: "metrics",
      header: "Xem / Thích",
      headClassName: "hidden xl:table-cell",
      className: "hidden xl:table-cell",
      cell: (p) => <PostMetricCell metric={p.latestMetric} />,
    },
    {
      key: "actions",
      header: <span className="sr-only">Thao tác</span>,
      className: "w-10 text-right",
      cell: (p) => (
        // Keep menu clicks from triggering the row's edit handler.
        <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} role="presentation">
          <PostRowActions post={p} onEdit={setEditing} onMarkPublished={setPublishing} onMetrics={setMetricsFor} onDelete={setDeleting} />
        </div>
      ),
    },
  ]

  const filtered = filters.search || filters.status !== "all" || filters.platform !== "all" || filters.channel !== "all" || filters.project !== "all" || filters.independent === "true"

  return (
    <div className="grid gap-3">
      <PostsFilters filters={filters} setFilters={setFilters} />
      <DataTable
        columns={columns}
        rows={query.data?.items}
        isLoading={query.isLoading}
        error={query.error}
        onRetry={query.refetch}
        rowKey={postIdOf}
        onRowClick={setEditing}
        empty={
          <EmptyState
            className="m-3 border-0"
            icon={FileTextIcon}
            title={filtered ? "Không có bài viết phù hợp" : "Chưa có bài viết"}
            description={filtered ? "Thử đổi hoặc xóa bộ lọc." : "Tạo bài viết để lên kế hoạch đăng trên các kênh."}
          />
        }
      />
      <Pagination meta={query.data?.meta} onPageChange={(page) => setFilters({ page: String(page) })} />

      <PostFormDialog open={Boolean(editing)} onOpenChange={(o) => !o && setEditing(null)} post={editing ?? undefined} />
      <PostMetricsDialog open={Boolean(metricsFor)} onOpenChange={(o) => !o && setMetricsFor(null)} post={metricsFor} />
      <ConfirmDialog
        open={Boolean(publishing)}
        onOpenChange={(o) => !o && setPublishing(null)}
        title="Đánh dấu đã đăng?"
        description={`Xác nhận bạn đã tự đăng "${publishing?.title ?? ""}" lên nền tảng. Hệ thống không tự đăng bài; thời gian đăng được ghi nhận là bây giờ.`}
        confirmLabel="Đánh dấu đã đăng"
        destructive={false}
        pending={markPublished.isPending}
        onConfirm={confirmPublished}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Xóa bài viết?"
        description={`"${deleting?.title ?? ""}" và toàn bộ số liệu đã ghi nhận sẽ bị xóa vĩnh viễn.`}
        confirmLabel="Xóa bài viết"
        pending={del.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
