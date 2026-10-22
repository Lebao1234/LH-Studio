import { useMemo, useState } from "react"
import { toast } from "sonner"
import { DownloadIcon, PlusIcon, TagsIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { PageHeader } from "@/components/shared/PageHeader"
import { SearchInput } from "@/components/shared/SearchInput"
import { financeApi } from "@/lib/api/finances.api"
import { getErrorMessage } from "@/lib/api/axios"
import { AddPaymentDialog } from "../components/AddPaymentDialog"
import { CategoryManagerDialog } from "../components/CategoryManagerDialog"
import { ExpenseByCategory } from "../components/ExpenseByCategory"
import { FinanceFilters } from "../components/FinanceFilters"
import { LedgerTable } from "../components/LedgerTable"
import { OutstandingList } from "../components/OutstandingList"
import { SummaryCards } from "../components/SummaryCards"
import { TransactionDetailSheet } from "../components/TransactionDetailSheet"
import { TransactionFormDialog } from "../components/TransactionFormDialog"
import { useExpensesByCategory, useFinanceFilters, useFinanceMutation, useFinanceSummary, useTransactions } from "../hooks/use-finance"
import { financeErrorMessage, periodLabel, txId } from "../lib/finance-utils"

const LEDGER_LIMIT = 20

// Dialog state keeps its target while closing so content does not vanish mid-animation.
const closed = (s) => ({ ...s, open: false })

export default function FinancePage() {
  const { filters, setFilter, setFilters, reportParams, ledgerParams } = useFinanceFilters()

  const summary = useFinanceSummary(reportParams)
  const byCategory = useExpensesByCategory(useMemo(() => ({ ...reportParams, type: "expense" }), [reportParams]))
  const outstanding = useTransactions(
    // Search only narrows the ledger below; "" is stripped by cleanParams.
    useMemo(() => ({ ...ledgerParams, search: "", outstanding: "true", sort: "expectedDate", limit: 30 }), [ledgerParams]),
  )
  const ledger = useTransactions(useMemo(() => ({ ...ledgerParams, page: filters.page, limit: LEDGER_LIMIT }), [ledgerParams, filters.page]))

  const [form, setForm] = useState({ open: false, tx: null })
  const [sheet, setSheet] = useState({ open: false, id: null })
  const [pay, setPay] = useState({ open: false, tx: null })
  const [del, setDel] = useState({ open: false, tx: null })
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const [exporting, setExporting] = useState(false)

  const openDetail = (tx) => setSheet({ open: true, id: txId(tx) })
  const openPay = (tx) => setPay({ open: true, tx })
  const openEdit = (tx) => setForm({ open: true, tx })
  const openCreate = () => setForm({ open: true, tx: null })

  const deleteMutation = useFinanceMutation((tx) => financeApi.deleteTransaction(txId(tx)), {
    onSuccess: () => {
      toast.success("Đã xóa giao dịch.")
      setDel(closed)
    },
    onError: (err) => {
      setDel(closed)
      toast.error(financeErrorMessage(err, getErrorMessage))
    },
  })

  const exportCsv = async () => {
    setExporting(true)
    try {
      await financeApi.exportCsv(ledgerParams)
    } catch (err) {
      toast.error(getErrorMessage(err, "Không xuất được CSV."))
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="grid gap-4">
      <PageHeader
        title="Tài chính"
        description={`Dòng tiền thực thu – thực chi · ${periodLabel(filters)}`}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setCategoriesOpen(true)}>
              <TagsIcon /> Danh mục
            </Button>
            <Button size="sm" onClick={openCreate}>
              <PlusIcon /> Thêm giao dịch
            </Button>
          </>
        }
      />

      <FinanceFilters filters={filters} setFilter={setFilter} setFilters={setFilters} />

      <SummaryCards query={summary} />

      <div className="grid gap-4 lg:grid-cols-5">
        <ExpenseByCategory query={byCategory} className="lg:col-span-3" />
        <OutstandingList
          query={outstanding}
          overdueCount={summary.data?.counts?.overdueExpected ?? 0}
          onOpen={openDetail}
          onPay={openPay}
          className="lg:col-span-2"
        />
      </div>

      <section className="grid gap-2" aria-labelledby="ledger-title">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 id="ledger-title" className="text-base font-semibold">
            Sổ thu chi
            {ledger.data?.meta && <span className="ml-2 text-xs font-normal text-muted-foreground">{ledger.data.meta.total} giao dịch</span>}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput value={filters.search} onChange={(v) => setFilter("search", v)} placeholder="Tìm theo nội dung…" />
            <Button variant="outline" size="sm" onClick={exportCsv} disabled={exporting}>
              {exporting ? <Spinner /> : <DownloadIcon />} Xuất CSV
            </Button>
            <Button size="sm" onClick={openCreate}>
              <PlusIcon /> Thêm giao dịch
            </Button>
          </div>
        </div>
        <LedgerTable
          query={ledger}
          onPageChange={(p) => setFilter("page", String(p))}
          onOpen={openDetail}
          onPay={openPay}
          onEdit={openEdit}
          onDelete={(tx) => setDel({ open: true, tx })}
          onCreate={openCreate}
        />
      </section>

      <TransactionFormDialog
        open={form.open}
        onOpenChange={(o) => setForm((s) => ({ ...s, open: o }))}
        transaction={form.tx}
        defaultType={filters.type !== "all" ? filters.type : undefined}
        onSaved={(tx) => {
          if (!form.tx && tx) openDetail(tx)
        }}
      />
      <TransactionDetailSheet
        open={sheet.open}
        onOpenChange={(o) => setSheet((s) => ({ ...s, open: o }))}
        transactionId={sheet.id}
        onEdit={openEdit}
      />
      {pay.tx && <AddPaymentDialog open={pay.open} onOpenChange={(o) => setPay((s) => ({ ...s, open: o }))} transaction={pay.tx} />}
      <CategoryManagerDialog open={categoriesOpen} onOpenChange={setCategoriesOpen} />
      <ConfirmDialog
        open={del.open}
        onOpenChange={(o) => !o && setDel(closed)}
        title="Xóa giao dịch?"
        description={del.tx ? `“${del.tx.title}” sẽ bị xóa vĩnh viễn. Chỉ xóa được giao dịch chưa có thanh toán.` : undefined}
        confirmLabel="Xóa"
        pending={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(del.tx)}
      />
    </div>
  )
}
