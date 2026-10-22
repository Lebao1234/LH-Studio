import { InboxIcon } from "lucide-react"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { cn } from "@/lib/utils"

export function EmptyState({ icon: Icon = InboxIcon, title = "Chưa có dữ liệu", description, action, className }) {
  return (
    <Empty className={cn("border border-dashed py-10", className)}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        {description && <EmptyDescription>{description}</EmptyDescription>}
      </EmptyHeader>
      {action}
    </Empty>
  )
}
