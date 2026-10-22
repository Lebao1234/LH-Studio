import { MailIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/EmptyState"
import { ErrorState } from "@/components/shared/ErrorState"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { STUDIO_ROLES } from "@/lib/constants/labels"
import { formatDateTime, formatRelative } from "@/lib/utils/format"

function InvitationRow({ invitation, onRevoke }) {
  return (
    <li className="flex items-center gap-3 px-3 py-2.5">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-info/12 text-info">
        <MailIcon className="size-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
          <p className="truncate text-sm font-medium">{invitation.email}</p>
          <StatusBadge map={STUDIO_ROLES} value={invitation.role} />
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {[
            invitation.name,
            invitation.invitedBy?.name ? `Mời bởi ${invitation.invitedBy.name}` : null,
            `${formatRelative(invitation.createdAt)}`,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>
      <span className="hidden shrink-0 text-xs text-muted-foreground sm:block" title={formatDateTime(invitation.expiresAt)}>
        Hết hạn {formatRelative(invitation.expiresAt)}
      </span>
      <Button variant="ghost" size="sm" className="shrink-0 text-destructive hover:text-destructive" onClick={() => onRevoke(invitation)}>
        <XIcon /> Thu hồi
      </Button>
    </li>
  )
}

export function InvitationsList({ query, onRevoke }) {
  const items = query.data ?? []
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Lời mời đang chờ{items.length ? ` (${items.length})` : ""}</CardTitle>
        <CardDescription className="text-xs">Người được mời chưa tạo tài khoản. Đường dẫn mời chỉ hiển thị một lần lúc tạo.</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        {query.isPending ? (
          <div className="grid gap-2 px-3" aria-hidden>
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        ) : query.isError ? (
          <ErrorState error={query.error} onRetry={() => query.refetch()} className="mx-3 py-6" />
        ) : !items.length ? (
          <EmptyState icon={MailIcon} title="Không có lời mời nào đang chờ" className="border-0 py-6" />
        ) : (
          <ul className="divide-y divide-border">
            {items.map((inv) => (
              <InvitationRow key={inv._id} invitation={inv} onRevoke={onRevoke} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
