import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Spinner } from "@/components/ui/spinner"

/**
 * Controlled confirmation for destructive actions.
 * <ConfirmDialog open={!!target} onOpenChange={...} onConfirm={...} pending={mutation.isPending} />
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title = "Bạn chắc chắn?",
  description,
  confirmLabel = "Xác nhận",
  destructive = true,
  pending = false,
  onConfirm,
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Hủy</AlertDialogCancel>
          <AlertDialogAction variant={destructive ? "destructive" : "default"} disabled={pending} onClick={onConfirm}>
            {pending && <Spinner />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
