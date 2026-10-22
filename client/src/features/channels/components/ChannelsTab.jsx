import { useState } from "react"
import { MoreHorizontalIcon, PencilIcon, PlusIcon, PowerIcon, RadioTowerIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { DataTable } from "@/components/shared/DataTable"
import { EmptyState } from "@/components/shared/EmptyState"
import { FilterBar } from "@/components/shared/FilterBar"
import { SimpleSelect } from "@/components/shared/SimpleSelect"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { usePermissions } from "@/features/auth/auth-context"
import { useChannels } from "@/hooks/use-lookups"
import { getErrorMessage } from "@/lib/api/axios"
import { options } from "@/lib/constants/labels"
import { CHANNEL_STATUS, channelStatusOptions } from "../constants"
import { useDeleteChannel, useSaveChannel } from "../hooks/use-channel-mutations"
import { ChannelFormDialog } from "./ChannelFormDialog"
import { PlatformBadge } from "./PlatformBadge"

const idOf = (c) => c?._id ?? c?.id

function PostCounts({ counts = {} }) {
  return (
    <div className="tabular flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
      <span className="font-medium text-foreground">{counts.total ?? 0}</span>
      {counts.published > 0 && <span className="text-success">{counts.published} đã đăng</span>}
      {counts.scheduled > 0 && <span className="text-info">{counts.scheduled} lên lịch</span>}
      {counts.draft > 0 && <span>{counts.draft} nháp</span>}
    </div>
  )
}

function ChannelNameCell({ channel: c }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      {c.avatarUrl ? (
        <img src={c.avatarUrl} alt="" className="size-7 shrink-0 rounded-full object-cover ring-1 ring-foreground/10" />
      ) : (
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <RadioTowerIcon className="size-3.5" />
        </span>
      )}
      <div className="min-w-0">
        {c.channelUrl ? (
          <a href={c.channelUrl} target="_blank" rel="noreferrer" className="block truncate text-sm font-medium hover:underline">
            {c.name}
          </a>
        ) : (
          <p className="truncate text-sm font-medium">{c.name}</p>
        )}
        {c.handle && <p className="truncate text-xs text-muted-foreground">{c.handle}</p>}
      </div>
    </div>
  )
}

/** Channels list + management. Filters are local (the list is small and unpaginated). */
export function ChannelsTab() {
  const { canManageChannels } = usePermissions()
  const [platform, setPlatform] = useState("all")
  const [status, setStatus] = useState("all")
  const params = { ...(platform !== "all" && { platform }), ...(status !== "all" && { status }) }
  const query = useChannels(params)

  const [editing, setEditing] = useState(null) // channel object, or {} for a new one
  const [deleting, setDeleting] = useState(null)
  const del = useDeleteChannel()
  const save = useSaveChannel()

  const toggleStatus = (c) => {
    const next = c.status === "active" ? "inactive" : "active"
    save.mutate(
      { id: idOf(c), body: { status: next } },
      {
        onSuccess: () => toast.success(next === "active" ? "Đã kích hoạt lại kênh." : "Đã ngừng hoạt động kênh."),
        onError: (err) => toast.error(getErrorMessage(err)),
      },
    )
  }

  const confirmDelete = () => {
    const target = deleting
    del.mutate(idOf(target), {
      onSuccess: () => {
        toast.success("Đã xóa kênh.")
        setDeleting(null)
      },
      onError: (err) => {
        setDeleting(null)
        if (err.response?.data?.code === "CHANNEL_HAS_POSTS") {
          toast.error("Kênh đã có bài viết nên không thể xóa.", {
            description: "Hãy chuyển kênh sang “Ngừng hoạt động” để giữ lịch sử bài viết.",
            action: target.status === "active" ? { label: "Ngừng hoạt động", onClick: () => toggleStatus(target) } : undefined,
          })
        } else toast.error(getErrorMessage(err))
      },
    })
  }

  const columns = [
    { key: "name", header: "Kênh", cell: (c) => <ChannelNameCell channel={c} /> },
    { key: "platform", header: "Nền tảng", cell: (c) => <PlatformBadge platform={c.platform} /> },
    {
      key: "platformChannelId",
      header: "ID nền tảng",
      headClassName: "hidden lg:table-cell",
      className: "hidden lg:table-cell text-xs text-muted-foreground",
      cell: (c) => c.platformChannelId || "—",
    },
    { key: "status", header: "Trạng thái", cell: (c) => <StatusBadge map={CHANNEL_STATUS} value={c.status} /> },
    { key: "posts", header: "Bài viết", cell: (c) => <PostCounts counts={c.postCounts} /> },
  ]

  if (canManageChannels) {
    columns.push({
      key: "actions",
      header: <span className="sr-only">Thao tác</span>,
      className: "w-10 text-right",
      cell: (c) => (
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Thao tác cho ${c.name}`} />}>
            <MoreHorizontalIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => setEditing(c)}>
              <PencilIcon /> Sửa
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toggleStatus(c)}>
              <PowerIcon /> {c.status === "active" ? "Ngừng hoạt động" : "Kích hoạt lại"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => setDeleting(c)}>
              <Trash2Icon /> Xóa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    })
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <FilterBar>
          <SimpleSelect
            aria-label="Lọc theo nền tảng"
            size="sm"
            className="w-36"
            value={platform}
            onChange={setPlatform}
            options={options.platforms}
            allLabel="Mọi nền tảng"
          />
          <SimpleSelect
            aria-label="Lọc theo trạng thái kênh"
            size="sm"
            className="w-40"
            value={status}
            onChange={setStatus}
            options={channelStatusOptions}
            allLabel="Mọi trạng thái"
          />
        </FilterBar>
        {canManageChannels && (
          <Button size="sm" onClick={() => setEditing({})}>
            <PlusIcon /> Thêm kênh
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        rows={query.data}
        isLoading={query.isLoading}
        error={query.error}
        onRetry={query.refetch}
        rowKey={idOf}
        skeletonRows={3}
        empty={
          <EmptyState
            className="m-3 border-0"
            icon={RadioTowerIcon}
            title="Chưa có kênh"
            description={
              canManageChannels ? "Thêm kênh YouTube, TikTok hoặc Facebook để bắt đầu lên lịch bài viết." : "Quản trị viên chưa thêm kênh nào."
            }
          />
        }
      />
      {!canManageChannels && <p className="text-xs text-muted-foreground">Chỉ chủ sở hữu hoặc quản trị viên được thêm / sửa kênh.</p>}

      <ChannelFormDialog
        open={Boolean(editing)}
        onOpenChange={(o) => !o && setEditing(null)}
        channel={editing && idOf(editing) ? editing : undefined}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Xóa kênh "${deleting?.name ?? ""}"?`}
        description="Chỉ xóa được kênh chưa có bài viết. Kênh đã có bài nên chuyển sang “Ngừng hoạt động”."
        confirmLabel="Xóa kênh"
        pending={del.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
