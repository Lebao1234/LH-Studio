import { useForm, useWatch, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { LockIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { Field, MoneyField, SelectField, TextareaField, TextField } from "@/components/shared/FormField"
import { useProjectOptions } from "@/hooks/use-lookups"
import { financeApi } from "@/lib/api/finances.api"
import { applyFieldErrors, getErrorMessage } from "@/lib/api/axios"
import { TRANSACTION_STATUS } from "@/lib/constants/labels"
import { cn } from "@/lib/utils"
import { big, formatVND, toDateInput } from "@/lib/utils/format"
import { useCategoryOptions, useFinanceMutation, useOpenSession } from "../hooks/use-finance"
import { errorCode, financeErrorMessage, FINANCE_ERRORS, isSettled, localDate, txId } from "../lib/finance-utils"
import { transactionSchema } from "../lib/schemas"

const statusOpts = (values) => values.map((v) => ({ value: v, label: TRANSACTION_STATUS[v].label }))

const FIELD_FOR_CODE = {
  CATEGORY_TYPE_MISMATCH: "categoryId",
  CATEGORY_INACTIVE: "categoryId",
  INVALID_CATEGORY: "categoryId",
  INVALID_PROJECT: "projectId",
  TOTAL_BELOW_PAID: "totalAmount",
  STATUS_DERIVED: "status",
}

function toPayload(values) {
  const expected = localDate(values.expectedDate, 12)
  return {
    title: values.title.trim(),
    description: values.description.trim(),
    type: values.type,
    categoryId: values.categoryId,
    projectId: values.projectId && values.projectId !== "all" ? values.projectId : null,
    totalAmount: values.totalAmount,
    status: values.status,
    expectedDate: expected ? expected.toISOString() : null,
  }
}

function TypeToggle({ value, onChange, disabled }) {
  return (
    <div role="radiogroup" aria-label="Loại giao dịch" className="grid grid-cols-2 gap-1 rounded-lg bg-muted/60 p-0.5">
      {["income", "expense"].map((t) => (
        <button
          key={t}
          type="button"
          role="radio"
          aria-checked={value === t}
          disabled={disabled}
          onClick={() => onChange(t)}
          className={cn(
            "h-7 rounded-md text-sm font-medium text-muted-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-60",
            value === t && (t === "income" ? "bg-income/15 text-income" : "bg-expense/15 text-expense"),
          )}
        >
          {t === "income" ? "Khoản thu" : "Khoản chi"}
        </button>
      ))}
    </div>
  )
}

function TransactionForm({ transaction, defaultType, onDone, onCancel }) {
  const editing = Boolean(transaction)
  const settled = editing && isSettled(transaction)
  const hasPaid = editing && big(transaction.paidAmount) > 0n
  const { data: projectOptions = [] } = useProjectOptions()

  const form = useForm({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      title: transaction?.title ?? "",
      description: transaction?.description ?? "",
      type: transaction?.type ?? defaultType ?? "expense",
      categoryId: transaction?.categoryId ?? "",
      projectId: transaction?.projectId ?? "",
      totalAmount: transaction ? String(transaction.totalAmount ?? "") : "",
      status: transaction?.status ?? "pending",
      expectedDate: toDateInput(transaction?.expectedDate),
    },
  })
  const type = useWatch({ control: form.control, name: "type" })
  const { options: categoryOptions } = useCategoryOptions({ type, activeOnly: true, keepId: transaction?.categoryId })

  const mutation = useFinanceMutation(
    (values) => {
      const payload = toPayload(values)
      if (!editing) return financeApi.createTransaction(payload)
      // Only send what changed: unchanged locked fields would be rejected on settled transactions.
      const dirty = form.formState.dirtyFields
      const body = Object.fromEntries(Object.entries(payload).filter(([k]) => k !== "type" && dirty[k]))
      if (!Object.keys(body).length) return Promise.resolve(transaction)
      return financeApi.updateTransaction(txId(transaction), body)
    },
    {
      onSuccess: (tx) => {
        toast.success(editing ? "Đã cập nhật giao dịch." : "Đã thêm giao dịch.")
        onDone?.(tx)
      },
      onError: (err) => {
        const code = errorCode(err)
        if (FIELD_FOR_CODE[code]) form.setError(FIELD_FOR_CODE[code], { message: FINANCE_ERRORS[code] })
        else if (code === "TRANSACTION_SETTLED") form.setError("root", { message: FINANCE_ERRORS[code] })
        else if (!applyFieldErrors(err, form.setError)) toast.error(financeErrorMessage(err, getErrorMessage))
      },
    },
  )

  const submit = form.handleSubmit((values) => {
    if (editing && big(values.totalAmount) < big(transaction.paidAmount)) {
      form.setError("totalAmount", { message: `Không thể nhỏ hơn số đã thanh toán (${formatVND(transaction.paidAmount)}).` })
      return
    }
    mutation.mutate(values)
  })

  const statusOptions = editing
    ? statusOpts(hasPaid || settled ? [transaction.status] : ["planned", "pending", "cancelled"])
    : statusOpts(["planned", "pending"])
  const locked = settled

  return (
    <>
      <form id="transaction-form" className="grid gap-3" onSubmit={submit} noValidate>
        {settled && (
          <div role="note" className="flex gap-2 rounded-lg bg-warning/10 px-3 py-2 text-xs text-warning ring-1 ring-warning/20">
            <LockIcon className="mt-0.5 size-3.5 shrink-0" />
            <span>
              Giao dịch đã {transaction.status === "paid" ? "tất toán" : "hủy"} nên chỉ được sửa nội dung và mô tả. Số tiền, danh mục, dự án,
              trạng thái và ngày dự kiến được khóa để bảo toàn sổ sách.
            </span>
          </div>
        )}
        {form.formState.errors.root && (
          <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {form.formState.errors.root.message}
          </p>
        )}

        <Field label="Loại giao dịch" hint={editing ? "Loại giao dịch không thể thay đổi sau khi tạo." : undefined}>
          {() =>
            editing ? (
              <div>
                <span className={cn("text-sm font-medium", transaction.type === "income" ? "text-income" : "text-expense")}>
                  {transaction.type === "income" ? "Khoản thu" : "Khoản chi"}
                </span>
              </div>
            ) : (
              <Controller
                control={form.control}
                name="type"
                render={({ field }) => (
                  <TypeToggle
                    value={field.value}
                    onChange={(v) => {
                      field.onChange(v)
                      form.setValue("categoryId", "", { shouldDirty: true })
                    }}
                  />
                )}
              />
            )
          }
        </Field>

        <TextField form={form} name="title" label="Nội dung" required placeholder="VD: Thanh toán đợt 1 hợp đồng…" autoFocus />

        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField
            form={form}
            name="categoryId"
            label="Danh mục"
            required
            options={categoryOptions}
            placeholder="Chọn danh mục"
            disabled={locked}
          />
          <SelectField
            form={form}
            name="projectId"
            label="Dự án"
            options={projectOptions}
            allLabel="Không gắn dự án"
            disabled={locked}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <MoneyField
            form={form}
            name="totalAmount"
            label="Tổng tiền"
            required
            disabled={locked}
            hint={hasPaid && !locked ? `Đã thanh toán ${formatVND(transaction.paidAmount)}` : undefined}
          />
          <TextField form={form} name="expectedDate" label="Ngày dự kiến" type="date" disabled={locked} />
        </div>

        <SelectField
          form={form}
          name="status"
          label="Trạng thái"
          options={statusOptions}
          disabled={locked || hasPaid}
          hint={
            hasPaid && !locked
              ? "Đã có thanh toán: trạng thái được tính tự động theo các khoản thanh toán."
              : !editing
                ? "Trạng thái thanh toán sẽ tự cập nhật khi ghi nhận thanh toán."
                : undefined
          }
        />

        <TextareaField form={form} name="description" label="Mô tả" rows={3} placeholder="Ghi chú thêm (không bắt buộc)" />
      </form>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Hủy
        </Button>
        <Button type="submit" form="transaction-form" disabled={mutation.isPending}>
          {mutation.isPending && <Spinner />}
          {editing ? "Lưu thay đổi" : "Thêm giao dịch"}
        </Button>
      </DialogFooter>
    </>
  )
}

/** Create / edit a transaction. `transaction` null → create. */
export function TransactionFormDialog({ open, onOpenChange, transaction, defaultType, onSaved }) {
  const session = useOpenSession(open)
  const editing = Boolean(transaction)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Sửa giao dịch" : "Thêm giao dịch"}</DialogTitle>
          <DialogDescription>
            {editing ? "Cập nhật thông tin giao dịch. Lịch sử thanh toán không bị thay đổi." : "Ghi một khoản thu hoặc chi dự kiến vào sổ."}
          </DialogDescription>
        </DialogHeader>
        <TransactionForm
          key={`${session}-${txId(transaction) ?? "new"}`}
          transaction={transaction}
          defaultType={defaultType}
          onCancel={() => onOpenChange(false)}
          onDone={(tx) => {
            onOpenChange(false)
            onSaved?.(tx)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
