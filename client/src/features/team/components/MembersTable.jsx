import {
  CheckCircle2Icon,
  CircleDashedIcon,
  ClockIcon,
  LockIcon,
  MoreHorizontalIcon,
  ShieldIcon,
  UserCheckIcon,
  UsersIcon,
  UserXIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { DataTable } from "@/components/shared/DataTable"
import { EmptyState } from "@/components/shared/EmptyState"
import { UserAvatar } from "@/components/shared/UserAvatar"
import { formatDate } from "@/lib/utils/format"

function RowActions({ member, caps, onEditRole, onSetStatus, onApprove, onReject }) {
  if (caps.approve || caps.reject) {
    return (
      <div className="flex items-center justify-end gap-1.5">
        {caps.approve && (
          <Button
            size="sm"
            variant="default"
            className="h-7 px-2.5 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => onApprove(member)}
          >
            <UserCheckIcon className="size-3.5" /> Duyệt
          </Button>
        )}
        {caps.reject && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs gap-1 text-destructive hover:bg-destructive/10"
            onClick={() => onReject(member)}
          >
            <UserXIcon className="size-3.5" /> Từ chối
          </Button>
        )}
      </div>
    )
  }

  if (!caps.editRole && !caps.deactivate && !caps.reactivate) {
    if (!caps.reason) return null
    return (
      <Tooltip>
        <TooltipTrigger
          render={<span tabIndex={0} aria-label={caps.reason} className="inline-flex size-7 items-center justify-center text-muted-foreground" />}
        >
          <LockIcon className="size-3.5" />
        </TooltipTrigger>
        <TooltipContent>{caps.reason}</TooltipContent>
      </Tooltip>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Thao tác với ${member.user?.name ?? "thành viên"}`} />}>
        <MoreHorizontalIcon className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {caps.editRole && (
          <DropdownMenuItem onClick={() => onEditRole(member)}>
            <ShieldIcon className="size-4" /> Đổi vai trò
          </DropdownMenuItem>
        )}
        {caps.reactivate && (
          <DropdownMenuItem onClick={() => onSetStatus(member, "active")}>
            <UserCheckIcon className="size-4" /> Kích hoạt lại
          </DropdownMenuItem>
        )}
        {caps.deactivate && (
          <>
            {caps.editRole && <DropdownMenuSeparator />}
            <DropdownMenuItem variant="destructive" onClick={() => onSetStatus(member, "inactive")}>
              <UserXIcon className="size-4" /> Vô hiệu hóa
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const ROLE_LABELS = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
  viewer: "Guest",
}

const TEAM_MAP = {
  owner: "STUDIO LEAD",
  admin: "STUDIO ADMIN",
  member: "AI CREATIVE",
  viewer: "EXTERNAL GUEST",
}

/**
 * Members table designed after @shadcnblocks/member-list1.
 */
export function MembersTable({
  rows,
  query,
  userId,
  manageable,
  getCaps,
  onEditRole,
  onSetStatus,
  onApprove,
  onReject,
  filtered,
}) {
  const columns = [
    {
      key: "member",
      header: "Member",
      cell: (m) => {
        const dotColor =
          m.status === "active"
            ? "bg-emerald-500"
            : m.status === "pending"
            ? "bg-amber-500"
            : "bg-muted-foreground/50"

        return (
          <div className="flex min-w-0 items-center gap-3 py-1">
            <div className="relative shrink-0">
              <UserAvatar user={m.user} size="default" className="size-9" />
              <span
                className={`absolute bottom-0 right-0 size-2.5 rounded-full ring-2 ring-background ${dotColor}`}
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-sm font-semibold text-foreground">
                  {m.user?.name ?? "—"}
                </p>
                {String(m.userId) === String(userId) && (
                  <span className="shrink-0 rounded bg-primary/15 px-1.5 py-0.2 text-[10px] font-medium text-primary">
                    Bạn
                  </span>
                )}
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {m.user?.email ?? "—"}
              </p>
            </div>
          </div>
        )
      },
      className: "max-w-64",
      headClassName: "w-72",
    },
    {
      key: "availability",
      header: "Availability",
      cell: (m) => {
        if (m.status === "active") {
          return (
            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground">
              <CheckCircle2Icon className="size-4 shrink-0 text-emerald-500" />
              <span>Available</span>
            </div>
          )
        }
        if (m.status === "pending") {
          return (
            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
              <ClockIcon className="size-4 shrink-0 text-amber-500 animate-pulse" />
              <span>Away</span>
            </div>
          )
        }
        return (
          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <CircleDashedIcon className="size-4 shrink-0" />
            <span>Offline</span>
          </div>
        )
      },
      className: "hidden sm:table-cell",
      headClassName: "hidden sm:table-cell",
    },
    {
      key: "role",
      header: "Role",
      cell: (m) => (
        <span className="text-sm font-normal text-muted-foreground capitalize">
          {ROLE_LABELS[m.role] || m.role}
        </span>
      ),
      className: "hidden md:table-cell",
      headClassName: "hidden md:table-cell",
    },
    {
      key: "teams",
      header: "Teams",
      cell: (m) => (
        <span className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-muted/40 px-2 py-0.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          <UsersIcon className="size-3 text-muted-foreground shrink-0" />
          <span>{TEAM_MAP[m.role] || "STUDIO"}</span>
        </span>
      ),
      className: "hidden lg:table-cell",
      headClassName: "hidden lg:table-cell",
    },
    {
      key: "joinedAt",
      header: "Joined",
      cell: (m) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(m.joinedAt || m.createdAt, "MMM yyyy")}
        </span>
      ),
      className: "hidden sm:table-cell",
      headClassName: "hidden sm:table-cell",
    },
  ]

  if (manageable) {
    columns.push({
      key: "actions",
      header: <span className="sr-only">Thao tác</span>,
      cell: (m) => (
        <RowActions
          member={m}
          caps={getCaps(m)}
          onEditRole={onEditRole}
          onSetStatus={onSetStatus}
          onApprove={onApprove}
          onReject={onReject}
        />
      ),
      className: "w-28 text-right",
      headClassName: "w-28",
    })
  }

  return (
    <DataTable
      columns={columns}
      rows={rows}
      isLoading={query.isPending}
      error={query.error}
      onRetry={() => query.refetch()}
      skeletonRows={5}
      className="border-0 shadow-none ring-0 rounded-none border-b"
      empty={
        <EmptyState
          icon={UsersIcon}
          title={filtered ? "Không có thành viên phù hợp" : "Chưa có thành viên"}
          description={filtered ? "Thử đổi bộ lọc hoặc từ khóa tìm kiếm." : undefined}
          className="m-3 border-0"
        />
      }
    />
  )
}
