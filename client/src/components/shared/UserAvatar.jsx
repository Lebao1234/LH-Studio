import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { initials } from "@/lib/utils/format"

export function UserAvatar({ user, size = "default", className }) {
  return (
    <Avatar size={size} className={className}>
      {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user?.name} />}
      <AvatarFallback className="bg-primary/15 text-[11px] font-medium text-primary">{initials(user?.name)}</AvatarFallback>
    </Avatar>
  )
}

/** Stack of avatars with tooltips; `users` = [{ name, avatarUrl }]. */
export function UserAvatarGroup({ users = [], max = 4, size = "sm" }) {
  if (!users.length) return <span className="text-xs text-muted-foreground">—</span>
  const shown = users.slice(0, max)
  const rest = users.length - shown.length
  return (
    <AvatarGroup>
      {shown.map((u, i) => (
        <Tooltip key={u?._id ?? i}>
          <TooltipTrigger render={<span />}>
            <UserAvatar user={u} size={size} />
          </TooltipTrigger>
          <TooltipContent>{u?.name}</TooltipContent>
        </Tooltip>
      ))}
      {rest > 0 && <AvatarGroupCount className="size-6 text-[10px]">+{rest}</AvatarGroupCount>}
    </AvatarGroup>
  )
}

export function UserCell({ user, subtitle }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <UserAvatar user={user} size="sm" />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{user?.name ?? "—"}</p>
        {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  )
}
