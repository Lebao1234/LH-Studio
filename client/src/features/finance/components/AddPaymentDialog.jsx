import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { MoneyField, SelectField, TextareaField, TextField } from "@/components/shared/FormField"
import { financeApi } from "@/lib/api/finances.api"
import { applyFieldErrors, getErrorMessage } from "@/lib/api/axios"
import { options } from "@/lib/constants/labels"
import { big, formatVND } from "@/lib/utils/format"
import { useFinanceMutation, useOpenSession } from "../hooks/use-finance"
import { errorCode, financeErrorMessage, FINANCE_ERRORS, localDate, newIdempotencyKey, todayInput, txId } from "../lib/finance-utils"
import { paymentSchema } from "../lib/schemas"

/** Today → the current instant (never "in the future"); a past day → local noon of that day. */
function paidAtIso(value) {
  if (value === todayInput()) return new Date().toISOString()
  return localDate(value, 12)?.toISOString()
}

function PaymentForm({ transaction, onDone, onCancel }) {
  // One key per dialog opening: double clicks and retries reuse it, so the server records at most once.
  const [idempotencyKey] = useState(newIdempotencyKey)
  const remaining = big(transaction.remainingAmount)
  const today = todayInput()

  const form = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: remaining > 0n ? remaining.toString() : "",
      paidAt: today,
      method: "bank_transfer",
      referenceNumber: "",
      note: "",
    },
  })

  const mutation = useFinanceMutation(
    (v) =>
      financeApi.addPayment(txId(transaction), {
        amount: v.amount,
        paidAt: paidAtIso(v.paidAt),
        method: v.method,
        referenceNumber: v.referenceNumber || undefined,
        note: v.note || undefined,
        idempotencyKey,
      }),
    {
      onSuccess: (tx) => {
        toast.success("Đã ghi nhận thanh toán.")
        onDone?.(tx)
      },
      onError: (err) => {
        const code = errorCode(err)
        if (code === "DUPLICATE_PAYMENT") {
          // The first submission went through; nothing was recorded twice.
          toast.info(FINANCE_ERRORS.DUPLICATE_PAYMENT)
          onDone?.()
        } else if (code === "OVERPAYMENT") {
          form.setError("amount", { message: `${FINANCE_ERRORS.OVERPAYMENT} Có thể số còn lại vừa thay đổi — hãy tải lại.` })
        } else if (code === "PAYMENT_IN_FUTURE") {
          form.setError("paidAt", { message: FINANCE_ERRORS.PAYMENT_IN_FUTURE })
        } else if (code === "VALIDATION_ERROR" && applyFieldErrors(err, form.setError)) {
          // field errors shown inline
        } else {
          toast.error(financeErrorMessage(err, getErrorMessage))
        }
      },
    },
  )

  const submit = form.handleSubmit((v) => {
    if (big(v.amount) > remaining) {
      form.setError("amount", { message: `Không được vượt quá số còn lại (${formatVND(remaining)}).` })
      return
    }
    if (v.paidAt > today) {
      form.setError("paidAt", { message: FINANCE_ERRORS.PAYMENT_IN_FUTURE })
      return
    }
    mutation.mutate(v)
  })

  const income = transaction.type === "income"

  return (
    <>
      <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/40 px-3 py-2 text-xs ring-1 ring-foreground/5">
        <div>
          <p className="text-muted-foreground">Tổng tiền</p>
          <p className="tabular font-medium">{formatVND(transaction.totalAmount)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">{income ? "Còn phải thu" : "Còn phải chi"}</p>
          <p className="tabular font-semibold text-warning">{formatVND(remaining)}</p>
        </div>
      </div>
      <form id="payment-form" className="grid gap-3" onSubmit={submit} noValidate>
        <div className="grid gap-3 sm:grid-cols-2">
          <MoneyField form={form} name="amount" label="Số tiền" required hint="Có thể thanh toán một phần." />
          <TextField form={form} name="paidAt" label="Ngày thanh toán" type="date" required max={today} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField form={form} name="method" label="Phương thức" options={options.paymentMethods} />
          <TextField form={form} name="referenceNumber" label="Số tham chiếu" placeholder="Mã giao dịch ngân hàng…" autoComplete="off" />
        </div>
        <TextareaField form={form} name="note" label="Ghi chú" rows={2} />
      </form>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={mutation.isPending}>
          Hủy
        </Button>
        <Button type="submit" form="payment-form" disabled={mutation.isPending || remaining <= 0n}>
          {mutation.isPending && <Spinner />}
          Ghi nhận
        </Button>
      </DialogFooter>
    </>
  )
}

/** Records a (partial) payment against a transaction. Requires `transaction.remainingAmount`. */
export function AddPaymentDialog({ open, onOpenChange, transaction, onRecorded }) {
  const session = useOpenSession(open)
  const income = transaction?.type === "income"
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{income ? "Ghi nhận khoản đã thu" : "Ghi nhận khoản đã chi"}</DialogTitle>
          <DialogDescription className="truncate">{transaction?.title}</DialogDescription>
        </DialogHeader>
        {transaction && (
          <PaymentForm
            key={`${session}-${txId(transaction)}`}
            transaction={transaction}
            onCancel={() => onOpenChange(false)}
            onDone={(tx) => {
              onOpenChange(false)
              onRecorded?.(tx)
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
