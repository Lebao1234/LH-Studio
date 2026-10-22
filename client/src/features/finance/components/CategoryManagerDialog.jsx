import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { PlusIcon, TagsIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { EmptyState } from "@/components/shared/EmptyState"
import { ErrorState } from "@/components/shared/ErrorState"
import { SelectField, TextField } from "@/components/shared/FormField"
import { financeApi } from "@/lib/api/finances.api"
import { applyFieldErrors, getErrorMessage } from "@/lib/api/axios"
import { options } from "@/lib/constants/labels"
import { cn } from "@/lib/utils"
import { useFinanceCategories, useFinanceMutation } from "../hooks/use-finance"
import { errorCode, FINANCE_ERRORS, financeErrorMessage } from "../lib/finance-utils"
import { categorySchema } from "../lib/schemas"

function CreateCategoryForm() {
  const form = useForm({ resolver: zodResolver(categorySchema), defaultValues: { name: "", code: "", type: "expense" } })
  const mutation = useFinanceMutation(financeApi.createCategory, {
    onSuccess: () => {
      toast.success("Đã thêm danh mục.")
      form.reset({ name: "", code: "", type: form.getValues("type") })
    },
    onError: (err) => {
      if (errorCode(err) === "CATEGORY_CODE_TAKEN") form.setError("code", { message: FINANCE_ERRORS.CATEGORY_CODE_TAKEN })
      else if (!applyFieldErrors(err, form.setError)) toast.error(getErrorMessage(err))
    },
  })

  return (
    <form
      className="grid gap-2 rounded-lg bg-muted/30 p-3 ring-1 ring-foreground/5 sm:grid-cols-[1fr_8rem_6.5rem_auto] sm:items-start"
      onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
      noValidate
    >
      <TextField form={form} name="name" label="Tên danh mục" placeholder="VD: Thuê studio" />
      <TextField form={form} name="code" label="Mã" placeholder="STUDIO_RENT" className="uppercase" autoComplete="off" />
      <SelectField form={form} name="type" label="Loại" options={options.financeTypes} />
      <Button type="submit" className="sm:mt-5" disabled={mutation.isPending}>
        {mutation.isPending ? <Spinner /> : <PlusIcon />}
        Thêm
      </Button>
    </form>
  )
}

function CategoryRow({ c }) {
  const mutation = useFinanceMutation((isActive) => financeApi.updateCategory(c._id, { isActive }), {
    onSuccess: (_, isActive) => toast.success(isActive ? `Đã bật “${c.name}”.` : `Đã ngừng dùng “${c.name}”.`),
    onError: (err) => toast.error(financeErrorMessage(err, getErrorMessage)),
  })
  return (
    <li className="flex items-center gap-2 px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-sm", !c.isActive && "text-muted-foreground line-through")}>{c.name}</p>
        <p className="text-[11px] text-muted-foreground">{c.code}</p>
      </div>
      {mutation.isPending && <Spinner className="size-3.5" />}
      <Switch
        checked={c.isActive}
        disabled={mutation.isPending}
        onCheckedChange={(v) => mutation.mutate(v)}
        aria-label={c.isActive ? `Ngừng dùng ${c.name}` : `Bật lại ${c.name}`}
      />
    </li>
  )
}

/** List, create and (de)activate finance categories. */
export function CategoryManagerDialog({ open, onOpenChange }) {
  const { data = [], isLoading, error, refetch } = useFinanceCategories()
  const [tab, setTab] = useState("expense")
  const rows = data.filter((c) => c.type === tab)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Danh mục thu chi</DialogTitle>
          <DialogDescription>Danh mục đã ngừng dùng vẫn giữ trên các giao dịch cũ nhưng không chọn được cho giao dịch mới.</DialogDescription>
        </DialogHeader>
        <CreateCategoryForm />
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted/60 p-0.5" role="tablist" aria-label="Loại danh mục">
          {options.financeTypes.map((o) => (
            <button
              key={o.value}
              type="button"
              role="tab"
              aria-selected={tab === o.value}
              onClick={() => setTab(o.value)}
              className={cn(
                "h-7 rounded-md text-sm font-medium text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                tab === o.value && "bg-background text-foreground",
              )}
            >
              {o.value === "income" ? "Khoản thu" : "Khoản chi"} ({data.filter((c) => c.type === o.value).length})
            </button>
          ))}
        </div>
        {error ? (
          <ErrorState error={error} onRetry={refetch} className="py-6" />
        ) : isLoading ? (
          <div className="grid gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : rows.length ? (
          <ul className="divide-y divide-border rounded-lg ring-1 ring-foreground/10">
            {rows.map((c) => (
              <CategoryRow key={c._id} c={c} />
            ))}
          </ul>
        ) : (
          <EmptyState icon={TagsIcon} title="Chưa có danh mục" className="py-6" />
        )}
      </DialogContent>
    </Dialog>
  )
}
