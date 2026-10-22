import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const stop = (e) => e.stopPropagation()

export function TaskRowActions({ task, onEdit, onDelete }) {
  return (
    <div onClick={stop} onKeyDown={stop}>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Thao tác: ${task.title}`} />}>
          <MoreHorizontalIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuItem onClick={() => onEdit(task)}>
            <PencilIcon /> Sửa
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => onDelete(task)}>
            <Trash2Icon /> Xóa
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
