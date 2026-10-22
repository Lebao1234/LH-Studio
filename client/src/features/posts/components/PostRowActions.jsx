import { BarChart3Icon, CheckCircle2Icon, ExternalLinkIcon, MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { usePermissions } from "@/features/auth/auth-context"
import { useCanDeletePost } from "../hooks/use-can-delete-post"

/**
 * Row menu. Handlers receive the post: onEdit, onMarkPublished, onMetrics, onDelete.
 */
export function PostRowActions({ post, onEdit, onMarkPublished, onMetrics, onDelete }) {
  const { canWrite } = usePermissions()
  const canDelete = useCanDeletePost()(post)
  const canMark = canWrite && post.status !== "published" && post.status !== "cancelled"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon-sm" aria-label={`Thao tác cho bài "${post.title}"`} onClick={(e) => e.stopPropagation()} />}
      >
        <MoreHorizontalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => onEdit(post)}>
          <PencilIcon /> {canWrite ? "Sửa" : "Xem chi tiết"}
        </DropdownMenuItem>
        {canMark && (
          <DropdownMenuItem onClick={() => onMarkPublished(post)}>
            <CheckCircle2Icon /> Đánh dấu đã đăng
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => onMetrics(post)}>
          <BarChart3Icon /> Số liệu
        </DropdownMenuItem>
        {post.externalUrl && (
          <DropdownMenuItem render={<a href={post.externalUrl} target="_blank" rel="noreferrer" />}>
            <ExternalLinkIcon /> Mở bài đăng
          </DropdownMenuItem>
        )}
        {canDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => onDelete(post)}>
              <Trash2Icon /> Xóa
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
