import { useState } from "react"
import { toast } from "sonner"
import { BanIcon, HandCoinsIcon, HistoryIcon, PencilIcon, Trash2Icon, Undo2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { EmptyState } from "@/components/shared/EmptyState"
import { ErrorState } from "@/components/shared/ErrorState"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { financeApi } from "@/lib/api/finances.api"
import { getErrorMessage } from "@/lib/api/axios"
import { FINANCE_TYPES, PAYMENT_METHODS, TRANSACTION_STATUS } from "@/lib/constants/labels"
import { cn } from "@/lib/utils"
import { big, formatDate, formatDateTime, formatVND } from "@/lib/utils/format"
import { useFinanceMutation, useTransaction } from "../hooks/use-finance"
import { bpToPercent, financeErrorMessage, isOverdue, isPayable, progressBp, txId } from "../lib/finance-utils"
import { AddPaymentDialog } from "./AddPaymentDialog"
import { ReversePaymentDialog } from "./ReversePaymentDialog"

function Amount({ label, value, className }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={cn("truncate text-sm font-semibold tabular", className)} title={formatVND(value)}>
        {formatVND(value)}
      </p>
    </div>
  )
}

function Meta({ label, children }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-xs">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate text-right">{children}</span>
    </div>
  )
}

function PaymentItem({ p, onReverse }) {
  const reversal = p.kind === "reversal"
  const reversed = Boolean(p.reversedByPaymentId)
  return (
    <li className={cn("grid gap-1 rounded-lg px-3 py-2 ring-1 ring-foreground/8", reversal ? "bg-destructive/5" : "bg-card")}>
      <div className="flex items-center gap-2">
        {reversal ? (
          <StatusBadge tone="danger">Bút toán điều chỉnh</StatusBadge>
        ) : (
          <StatusBadge tone="neutral">{PAYMENT_METHODS[p.method]?.label ?? "Thanh toán"}</StatusBadge>
        )}
        {reversed && <StatusBadge tone="muted">Đã điều chỉnh</StatusBadge>}
        <span
          className={cn(
            "ml-auto text-sm font-semibold tabular",
            reversal ? "text-destructive" : reversed ? "text-muted-foreground line-through" : "text-foreground",
          )}
        >
          {reversal ? `-${formatVND(p.amount)}` : formatVND(p.amount)}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
        <span>{formatDate(p.paidAt)}</span>
        {p.referenceNumber && <span>· Mã: {p.referenceNumber}</span>}
        {p.recordedBy?.name && <span>· {p.recordedBy.name}</span>}
        <span title={formatDateTime(p.createdAt)}>· ghi lúc {formatDateTime(p.createdAt)}</span>
      </div>
      {p.note && <p className="text-xs whitespace-pre-line">{reversal ? `Lý do: ${p.note}` : p.note}</p>}
      {!reversal && !reversed && (
        <div className="flex justify-end">
          <Button variant="ghost" size="xs" onClick={() => onReverse(p)}>
            <Undo2Icon /> Điều chỉnh
          </Button>
        </div>
      )}
    </li>
  )
}

function DetailBody({ tx, onPay, onReverse }) {
  const bp = progressBp(tx.paidAmount, tx.totalAmount)
  const income = tx.type === "income"
  const payments = tx.payments ?? []
  const overdue = isOverdue(tx)

  return (
    <div className="grid gap-4 px-4">
      <div className="grid grid-cols-3 gap-3 rounded-xl bg-muted/30 p-3 ring-1 ring-foreground/5">
        <Amount label="Tổng tiền" value={tx.totalAmount} />
        <Amount label={income ? "Đã thu" : "Đã chi"} value={tx.paidAmount} className={income ? "text-income" : "text-expense"} />
        <Amount label="Còn lại" value={tx.remainingAmount} className={big(tx.remainingAmount) > 0n ? "text-warning" : "text-muted-foreground"} />
        <div className="col-span-3 grid gap-1">
          <Progress
            value={bp / 100}
            aria-label="Tiến độ thanh toán"
            className={cn(income ? "[&_[data-slot=progress-indicator]]:bg-income" : "[&_[data-slot=progress-indicator]]:bg-expense")}
          />
          <p className="text-right text-[11px] text-muted-foreground tabular">{bpToPercent(bp)} đã thanh toán</p>
        </div>
      </div>

      <div className="grid gap-1.5">
        <Meta label="Trạng thái">
          <StatusBadge map={TRANSACTION_STATUS} value={tx.status} />
        </Meta>
        <Meta label="Loại">
          <StatusBadge map={FINANCE_TYPES} value={tx.type} />
        </Meta>
        <Meta label="Danh mục">{tx.category?.name ?? "—"}</Meta>
        <Meta label="Dự án">{tx.project ? `${tx.project.code} · ${tx.project.title}` : "—"}</Meta>
        <Meta label="Ngày dự kiến">
          <span className={cn(overdue && "font-medium text-destructive")}>
            {tx.expectedDate ? formatDate(tx.expectedDate) : "—"}
            {overdue && " (quá hạn)"}
          </span>
        </Meta>
        <Meta label="Người tạo">{tx.createdBy?.name ?? "—"}</Meta>
        {tx.description && <p className="mt-1 rounded-lg bg-muted/30 px-3 py-2 text-xs whitespace-pre-line">{tx.description}</p>}
      </div>

      <Separator />

      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="flex items-center gap-1.5 text-sm font-medium">
            <HistoryIcon className="size-4 text-muted-foreground" /> Lịch sử thanh toán
          </h3>
          {isPayable(tx) && (
            <Button size="sm" onClick={onPay}>
              <HandCoinsIcon /> Thêm thanh toán
            </Button>
          )}
        </div>
        {payments.length ? (
          <ul className="grid gap-2">
            {payments.map((p) => (
              <PaymentItem key={p._id} p={p} onReverse={onReverse} />
            ))}
          </ul>
        ) : (
          <EmptyState icon={HistoryIcon} title="Chưa có thanh toán" description="Các khoản thu/chi thực tế sẽ hiển thị ở đây." className="py-6" />
        )}
        <p className="text-[11px] text-muted-foreground">
          Lịch sử thanh toán không thể sửa hoặc xóa. Dùng “Điều chỉnh” để ghi bút toán đảo khi cần sửa sai.
        </p>
      </div>
    </div>
  )
}

/** Right-side sheet with totals, payment history and the actions for one transaction. */
export function TransactionDetailSheet({ open, onOpenChange, transactionId, onEdit }) {
  const query = useTransaction(transactionId)
  const tx = query.data
  const [payOpen, setPayOpen] = useState(false)
  const [reverseTarget, setReverseTarget] = useState(null)
  const [reverseOpen, setReverseOpen] = useState(false)
  const [confirm, setConfirm] = useState(null) // "delete" | "cancel" | null

  const deleteMutation = useFinanceMutation(() => financeApi.deleteTransaction(transactionId), {
    onSuccess: () => {
      toast.success("Đã xóa giao dịch.")
      setConfirm(null)
      onOpenChange(false)
    },
    onError: (err) => {
      setConfirm(null)
      toast.error(financeErrorMessage(err, getErrorMessage))
    },
  })
  const cancelMutation = useFinanceMutation(() => financeApi.updateTransaction(transactionId, { status: "cancelled" }), {
    onSuccess: () => {
      toast.success("Đã hủy giao dịch.")
      setConfirm(null)
    },
    onError: (err) => {
      setConfirm(null)
      toast.error(financeErrorMessage(err, getErrorMessage))
    },
  })

  const hasPayments = (tx?.paymentCount ?? 0) > 0 || (tx?.payments?.length ?? 0) > 0
  const canCancel = tx && !["paid", "cancelled"].includes(tx.status) && big(tx.paidAmount) === 0n

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full gap-0 overflow-y-auto sm:max-w-lg data-[side=right]:sm:max-w-lg">
          <SheetHeader className="pr-12">
            <SheetTitle className="line-clamp-2">{tx?.title ?? "Chi tiết giao dịch"}</SheetTitle>
            <SheetDescription>{tx ? `Tạo ngày ${formatDate(tx.createdAt)}` : "Đang tải…"}</SheetDescription>
          </SheetHeader>

          {query.error ? (
            <ErrorState error={query.error} onRetry={query.refetch} className="mx-4" />
          ) : !tx ? (
            <div className="grid gap-3 px-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <DetailBody
              tx={tx}
              onPay={() => setPayOpen(true)}
              onReverse={(p) => {
                setReverseTarget(p)
                setReverseOpen(true)
              }}
            />
          )}

          {tx && (
            <SheetFooter className="mt-4 border-t">
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => onEdit?.(tx)}>
                  <PencilIcon /> Sửa
                </Button>
                {canCancel && (
                  <Button variant="outline" size="sm" onClick={() => setConfirm("cancel")}>
                    <BanIcon /> Hủy giao dịch
                  </Button>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  className="ml-auto"
                  disabled={hasPayments}
                  onClick={() => setConfirm("delete")}
                >
                  <Trash2Icon /> Xóa
                </Button>
              </div>
              {hasPayments && (
                <p className="text-[11px] text-muted-foreground">
                  Giao dịch đã có lịch sử thanh toán nên không thể xóa.{" "}
                  {big(tx.paidAmount) > 0n
                    ? "Muốn hủy, hãy điều chỉnh (đảo) các khoản thanh toán trước, sau đó chuyển sang “Đã hủy”."
                    : tx.status !== "cancelled"
                      ? "Bạn có thể chuyển giao dịch sang “Đã hủy”."
                      : null}
                </p>
              )}
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>

      {tx && <AddPaymentDialog open={payOpen} onOpenChange={setPayOpen} transaction={tx} />}
      <ReversePaymentDialog open={reverseOpen} onOpenChange={setReverseOpen} transactionId={txId(tx) ?? transactionId} payment={reverseTarget} />
      <ConfirmDialog
        open={confirm === "delete"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Xóa giao dịch?"
        description="Giao dịch chưa có thanh toán sẽ bị xóa vĩnh viễn khỏi sổ thu chi."
        confirmLabel="Xóa"
        pending={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
      />
      <ConfirmDialog
        open={confirm === "cancel"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Hủy giao dịch?"
        description="Giao dịch sẽ chuyển sang “Đã hủy” và không còn được tính vào các khoản dự kiến. Sau khi hủy chỉ có thể sửa nội dung và mô tả."
        confirmLabel="Hủy giao dịch"
        pending={cancelMutation.isPending}
        onConfirm={() => cancelMutation.mutate()}
      />
    </>
  )
}
