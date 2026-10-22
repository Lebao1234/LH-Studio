import { useMemo, useState } from "react"
import { toast } from "sonner"
import { FilterIcon, PlusIcon, SlidersHorizontalIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { FilterBar } from "@/components/shared/FilterBar"
import { SearchInput } from "@/components/shared/SearchInput"
import { SimpleSelect } from "@/components/shared/SimpleSelect"
import { usePermissions } from "@/features/auth/auth-context"
import { useUrlFilters } from "@/hooks/use-url-filters"
import { options } from "@/lib/constants/labels"
import { EditRoleDialog } from "../components/EditRoleDialog"
import { InvitationsList } from "../components/InvitationsList"
import { InviteMemberDialog } from "../components/InviteMemberDialog"
import { MembersTable } from "../components/MembersTable"
import { MEMBER_STATUS_FILTERS } from "../constants"
import { useDeactivateMember, useInvitations, useRevokeInvitation, useTeamMembers, useUpdateMember } from "../hooks/use-team"
import { memberCapabilities } from "../permissions"

const FILTER_DEFAULTS = { status: "all", role: "all", q: "" }

const normalize = (s = "") =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()

export default function TeamPage() {
  const { canManageTeam, isOwner, userId } = usePermissions()
  const [filters, setFilter] = useUrlFilters(FILTER_DEFAULTS)

  const members = useTeamMembers()
  const invitations = useInvitations(canManageTeam)

  const [inviteOpen, setInviteOpen] = useState(false)
  const [roleTarget, setRoleTarget] = useState(null)
  const [roleOpen, setRoleOpen] = useState(false)
  // Targets outlive their dialog's `open` flag so content doesn't flicker while closing.
  const [statusTarget, setStatusTarget] = useState(null) // { member, status }
  const [statusOpen, setStatusOpen] = useState(false)
  const [revokeTarget, setRevokeTarget] = useState(null)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [rejectOpen, setRejectOpen] = useState(false)

  const all = useMemo(() => members.data ?? [], [members.data])
  const activeOwners = all.filter((m) => m.role === "owner" && m.status === "active").length
  const activeCount = all.filter((m) => m.status === "active").length
  const pendingCount = all.filter((m) => m.status === "pending").length

  const rows = useMemo(() => {
    const q = normalize(filters.q.trim())
    return all.filter((m) => {
      // Nếu là tài khoản quản trị (admin / owner) thì bỏ qua, chỉ hiển thị user (member / viewer)
      if (m.role === "admin" || m.role === "owner") return false

      if (filters.status !== "all" && m.status !== filters.status) return false
      if (filters.role !== "all" && m.role !== filters.role) return false
      if (!q) return true
      return [m.user?.name, m.user?.email, m.user?.phone].some((v) => v && normalize(v).includes(q))
    })
  }, [all, filters.q, filters.status, filters.role])

  const getCaps = (member) => memberCapabilities(member, { canManageTeam, isOwner, userId, activeOwners })

  const updateStatus = useUpdateMember({
    onSuccess: () => {
      toast.success("Đã kích hoạt lại thành viên.")
      setStatusOpen(false)
    },
  })
  const deactivate = useDeactivateMember({
    onSuccess: () => {
      toast.success("Đã vô hiệu hóa thành viên.")
      setStatusOpen(false)
    },
  })
  const approve = useUpdateMember({
    onSuccess: () => {
      toast.success("Đã phê duyệt thành viên vào studio.")
    },
  })
  const reject = useDeactivateMember({
    onSuccess: () => {
      toast.success("Đã từ chối yêu cầu gia nhập.")
      setRejectOpen(false)
    },
  })
  const revoke = useRevokeInvitation({
    onSuccess: () => {
      toast.success("Đã thu hồi lời mời.")
      setRoleOpen(false)
    },
  })

  const confirmStatus = () => {
    const { member, status } = statusTarget
    if (status === "inactive") deactivate.mutate(member._id)
    else updateStatus.mutate({ id: member._id, status: "active" })
  }

  const statusName = statusTarget?.member.user?.name ?? "thành viên này"
  const isFiltered = filters.status !== "all" || filters.role !== "all" || Boolean(filters.q)

  const [showFilters, setShowFilters] = useState(false)

  return (
    <div className="grid gap-5">
      {/* Member-List1 Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border/40">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Members</h1>
          <span className="inline-flex items-center justify-center rounded-full border border-border/80 bg-muted/40 px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
            {rows.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={showFilters ? "secondary" : "outline"}
            size="sm"
            onClick={() => setShowFilters((prev) => !prev)}
            className="h-9 gap-2 text-xs font-medium"
          >
            <FilterIcon className="size-3.5" />
            <span>Filter</span>
            {isFiltered && <span className="size-1.5 rounded-full bg-primary" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm" className="h-9 gap-2 text-xs font-medium">
                  <SlidersHorizontalIcon className="size-3.5" />
                  <span>Display</span>
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setFilter("status", "all")}>
                Tất cả thành viên
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter("status", "active")}>
                Đang hoạt động ({activeCount})
              </DropdownMenuItem>
              {pendingCount > 0 && (
                <DropdownMenuItem onClick={() => setFilter("status", "pending")}>
                  Đang chờ duyệt ({pendingCount})
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {canManageTeam && (
            <Button
              size="sm"
              onClick={() => setInviteOpen(true)}
              className="h-9 gap-1.5 text-xs font-medium shadow-sm"
            >
              <PlusIcon className="size-4" />
              <span>Invite Member</span>
            </Button>
          )}
        </div>
      </div>

      {pendingCount > 0 && canManageTeam && filters.status !== "pending" && (
        <div className="flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-800 dark:text-amber-300">
          <div className="flex items-center gap-2">
            <span className="flex size-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Có <b>{pendingCount}</b> tài khoản đang chờ bạn xét duyệt vào studio.</span>
          </div>
          <Button
            size="xs"
            variant="outline"
            className="border-amber-500/30 bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 dark:text-amber-200"
            onClick={() => {
              setFilter("status", "pending")
              setShowFilters(true)
            }}
          >
            Xem danh sách
          </Button>
        </div>
      )}

      {(showFilters || isFiltered) && (
        <FilterBar className="pt-1">
          <SearchInput
            value={filters.q}
            onChange={(v) => setFilter("q", v)}
            placeholder="Tìm theo tên, email, điện thoại..."
            className="max-w-md"
          />
          <SimpleSelect
            aria-label="Lọc theo trạng thái"
            className="sm:w-44"
            value={filters.status}
            onChange={(v) => setFilter("status", v)}
            options={MEMBER_STATUS_FILTERS}
            allLabel="Tất cả trạng thái"
          />
          <SimpleSelect
            aria-label="Lọc theo vai trò"
            className="sm:w-40"
            value={filters.role}
            onChange={(v) => setFilter("role", v)}
            options={options.studioRoles}
            allLabel="Tất cả vai trò"
          />
          {isFiltered && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilter("q", "")
                setFilter("status", "all")
                setFilter("role", "all")
              }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Đặt lại
            </Button>
          )}
        </FilterBar>
      )}

      <MembersTable
        rows={rows}
        query={members}
        userId={userId}
        manageable={canManageTeam}
        getCaps={getCaps}
        filtered={isFiltered}
        onEditRole={(m) => {
          setRoleTarget(m)
          setRoleOpen(true)
        }}
        onSetStatus={(member, status) => {
          setStatusTarget({ member, status })
          setStatusOpen(true)
        }}
        onApprove={(m) => approve.mutate({ id: m._id, status: "active" })}
        onReject={(m) => {
          setRejectTarget(m)
          setRejectOpen(true)
        }}
      />

      {canManageTeam && <InvitationsList
          query={invitations}
          onRevoke={(inv) => {
            setRevokeTarget(inv)
            setRoleOpen(true)
          }}
        />}

      {canManageTeam && (
        <>
          <InviteMemberDialog open={inviteOpen} onOpenChange={setInviteOpen} />
          <EditRoleDialog member={roleTarget} open={roleOpen} onOpenChange={setRoleOpen} />
          <ConfirmDialog
            open={statusOpen}
            onOpenChange={setStatusOpen}
            title={statusTarget?.status === "inactive" ? "Vô hiệu hóa thành viên?" : "Kích hoạt lại thành viên?"}
            description={
              statusTarget?.status === "inactive"
                ? `${statusName} sẽ không thể truy cập studio nữa. Dữ liệu và lịch sử công việc vẫn được giữ lại; bạn có thể kích hoạt lại sau.`
                : `${statusName} sẽ có thể truy cập studio trở lại với vai trò hiện tại.`
            }
            confirmLabel={statusTarget?.status === "inactive" ? "Vô hiệu hóa" : "Kích hoạt lại"}
            destructive={statusTarget?.status === "inactive"}
            pending={deactivate.isPending || updateStatus.isPending}
            onConfirm={confirmStatus}
          />
          <ConfirmDialog
            open={rejectOpen}
            onOpenChange={setRejectOpen}
            title="Từ chối yêu cầu gia nhập?"
            description={`Từ chối yêu cầu của ${rejectTarget?.user?.name || "thành viên này"}. Họ sẽ không thể truy cập vào studio.`}
            confirmLabel="Từ chối"
            destructive
            pending={reject.isPending}
            onConfirm={() => reject.mutate(rejectTarget._id)}
          />
          <ConfirmDialog
            open={roleOpen}
            onOpenChange={setRoleOpen}
            title="Thu hồi lời mời?"
            description={`Đường dẫn mời gửi tới ${revokeTarget?.email ?? ""} sẽ không còn dùng được.`}
            confirmLabel="Thu hồi"
            pending={revoke.isPending}
            onConfirm={() => revoke.mutate(revokeTarget._id)}
          />
        </>
      )}
    </div>
  )
}
