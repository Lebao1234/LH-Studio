import { AlertTriangleIcon, RotateCwIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getErrorMessage } from "@/lib/api/axios"
import { cn } from "@/lib/utils"

export function ErrorState({ error, title = "Không tải được dữ liệu", description, onRetry, className }) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/25 bg-destructive/5 px-6 py-10 text-center",
        className,
      )}
    >
      <span className="flex size-9 items-center justify-center rounded-lg bg-destructive/15 text-destructive">
        <AlertTriangleIcon className="size-4" />
      </span>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description ?? (error ? getErrorMessage(error) : null)}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RotateCwIcon /> Thử lại
        </Button>
      )}
    </div>
  )
}
