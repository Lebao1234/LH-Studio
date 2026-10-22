import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { TextareaField } from "@/components/shared/FormField"
import { financeApi } from "@/lib/api/finances.api"
import { applyFieldErrors, getErrorMessage } from "@/lib/api/axios"
import { formatDate, formatVND } from "@/lib/utils/format"
import { useFinanceMutation, useOpenSession } from "../hooks/use-finance"
import { financeErrorMessage } from "../lib/finance-utils"
import { reversalSchema } from "../lib/schemas"

function ReverseForm({ transactionId, payment, onDone, onCancel }) {
  const form = useForm({ resolver: zodResolver(reversalSchema), defaultValues: { reason: "" } })
  const mutation = useFinanceMutation((v) => financeApi.reversePayment(transactionId, payment._id, { reason: v.reason }), {
    onSuccess: (tx) => {
      toast.success("Đã ghi bút toán điều chỉnh.")
      onDone?.(tx)
    },
    onError: (err) => {
      if (!applyFieldErrors(err, form.setError)) toast.error(financeErrorMessage(err, getErrorMessage))
    },
  })

  return (
    <>
      <div className="rounded-lg bg-muted/40 px-3 py-2 text-xs ring-1 ring-foreground/5">
        <p>
          Khoản <span className="tabular font-semibold">{formatVND(payment.amount)}</span> ngày {formatDate(payment.paidAt)}
        </p>
        <p className="mt-1 text-muted-foreground">
          Hệ thống sẽ thêm một bút toán đảo (âm) có cùng số tiền. Lịch sử gốc được giữ nguyên để đối soát; số đã thanh toán và trạng thái được
          tính lại.
        </p>
      </div>
      <form id="reverse-form" className="grid gap-3" onSubmit={form.handleSubmit((v) => mutation.mutate(v))} noValidate>
        <TextareaField form={form} name="reason" label="Lý do điều chỉnh" required rows={3} placeholder="VD: Ghi nhầm số tiền, khách hoàn lại…" autoFocus />
      </form>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={mutation.isPending}>
          Hủy
        </Button>
        <Button type="submit" form="reverse-form" variant="destructive" disabled={mutation.isPending}>
          {mutation.isPending && <Spinner />}
          Điều chỉnh
        </Button>
      </DialogFooter>
    </>
  )
}

/** Auditable correction: reverses one payment with a required reason. */
export function ReversePaymentDialog({ open, onOpenChange, transactionId, payment, onReversed }) {
  const session = useOpenSession(open)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Điều chỉnh khoản thanh toán</DialogTitle>
          <DialogDescription>Không sửa hay xóa lịch sử — chỉ ghi thêm bút toán đảo.</DialogDescription>
        </DialogHeader>
        {payment && (
          <ReverseForm
            key={`${session}-${payment._id}`}
            transactionId={transactionId}
            payment={payment}
            onCancel={() => onOpenChange(false)}
            onDone={(tx) => {
              onOpenChange(false)
              onReversed?.(tx)
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
