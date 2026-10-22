import { useState } from "react"
import { Trash2Icon, UserPlusIcon, UsersIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ActionButton, HoverActions } from "@/components/shared/HoverActions"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { DataTable } from "@/components/shared/DataTable"
import { EmptyState } from "@/components/shared/EmptyState"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { UserCell } from "@/components/shared/UserAvatar"
import { getErrorMessage } from "@/lib/api/axios"
import { PROJECT_ROLES } from "@/lib/constants/labels"
import { formatDate } from "@/lib/utils/format"
import { useProjectMembers, useRemoveProjectMember } from "../hooks/use-projects"
import { AddProjectMemberDialog } from "./AddProjectMemberDialog"

export function ProjectMembersTab({ projectId, canManage }) {
  const query = useProjectMembers(projectId)
  const remove = useRemoveProjectMember(projectId)
  const [addOpen, setAddOpen] = useState(false)
  const [target, setTarget] = useState(null)
  const members = query.data ?? []

  const columns = [
    { key: "user", header: "Thành viên", cell: (m) => <UserCell user={m.user} subtitle={m.user?.email} /> },
    { key: "role", header: "Vai trò", cell: (m) => <StatusBadge map={PROJECT_ROLES} value={m.role} /> },
    {
      key: "joinedAt",
      header: "Tham gia",
      headClassName: "hidden sm:table-cell",
      className: "hidden sm:table-cell text-muted-foreground",
      cell: (m) => formatDate(m.joinedAt),
    },
    ...(canManage
      ? [
          {
            key: "actions",
            header: <span className="sr-only">Thao tác</span>,
            className: "w-12",
            cell: (m) => (
              <HoverActions className="justify-end">
                <ActionButton icon={Trash2Icon} tone="destructive" label={`Gỡ ${m.user?.name ?? "thành viên"} khỏi dự án`} onClick={() => setTarget(m)} />
              </HoverActions>
            ),
          },
        ]
      : []),
  ]

  const confirmRemove = () =>
    remove.mutate(String(target.userId), {
      onSuccess: () => {
        toast.success("Đã gỡ thành viên khỏi dự án.")
        setTarget(null)
      },
      onError: (err) => toast.error(getErrorMessage(err)),
    })

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">{members.length} thành viên</p>
        {canManage && (
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <UserPlusIcon /> Thêm thành viên
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        rows={members}
        rowKey={(m) => m._id}
        isLoading={query.isPending}
        error={query.error}
        onRetry={query.refetch}
        skeletonRows={3}
        empty={<EmptyState icon={UsersIcon} title="Dự án chưa có thành viên" description={canManage ? "Thêm người trong studio để họ thấy và làm việc trong dự án này." : undefined} className="m-3 border-0" />}
      />

      {canManage && (
        <>
          <AddProjectMemberDialog
            open={addOpen}
            onOpenChange={setAddOpen}
            projectId={projectId}
            existingUserIds={members.map((m) => m.userId)}
          />
          <ConfirmDialog
            open={Boolean(target)}
            onOpenChange={(o) => !o && setTarget(null)}
            title="Gỡ thành viên khỏi dự án?"
            description={`${target?.user?.name ?? "Thành viên"} sẽ không còn truy cập dự án này (trừ khi là quản trị studio).`}
            confirmLabel="Gỡ khỏi dự án"
            pending={remove.isPending}
            onConfirm={confirmRemove}
          />
        </>
      )}
    </div>
  )
}
