import { AlertTriangleIcon, EyeIcon, HandCoinsIcon, MoreHorizontalIcon, PencilIcon, ReceiptTextIcon, Trash2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { DataTable, Pagination } from "@/components/shared/DataTable"
import { EmptyState } from "@/components/shared/EmptyState"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { FINANCE_TYPES, TRANSACTION_STATUS } from "@/lib/constants/labels"
import { cn } from "@/lib/utils"
import { big, formatDate, formatVND } from "@/lib/utils/format"
import { isOverdue, isPayable } from "../lib/finance-utils"

const stop = (e) => e.stopPropagation()

function RowActions({ tx, onOpen, onPay, onEdit, onDelete }) {
  return (
    <div onClick={stop} onKeyDown={stop} className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Thao tác cho ${tx.title}`} />}>
          <MoreHorizontalIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => onOpen(tx)}>
            <EyeIcon /> Xem chi tiết
          </DropdownMenuItem>
          {isPayable(tx) && (
            <DropdownMenuItem onClick={() => onPay(tx)}>
              <HandCoinsIcon /> Ghi nhận thanh toán
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => onEdit(tx)}>
            <PencilIcon /> Sửa
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" disabled={tx.paymentCount > 0} onClick={() => onDelete(tx)}>
            <Trash2Icon /> Xóa
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

/** Paginated ledger ("Sổ thu chi"). Row click opens the detail sheet. */
export function LedgerTable({ query, onPageChange, onOpen, onPay, onEdit, onDelete, onCreate }) {
  const { data, isLoading, error, refetch } = query

  const amountCls = "text-right tabular whitespace-nowrap"
  const columns = [
    {
      key: "date",
      header: "Ngày dự kiến",
      headClassName: "w-28",
      cell: (tx) => {
        const overdue = isOverdue(tx)
        return (
          <span className={cn("inline-flex items-center gap-1 whitespace-nowrap text-xs", overdue ? "font-medium text-destructive" : "text-muted-foreground")}>
            {overdue && <AlertTriangleIcon className="size-3" aria-label="Quá hạn" />}
            {formatDate(tx.expectedDate ?? tx.createdAt)}
          </span>
        )
      },
    },
    {
      key: "title",
      header: "Nội dung",
      className: "max-w-64",
      cell: (tx) => (
        <span className="block truncate font-medium" title={tx.title}>
          {tx.title}
        </span>
      ),
    },
    {
      key: "category",
      header: "Danh mục",
      cell: (tx) => <span className="whitespace-nowrap text-xs text-muted-foreground">{tx.category?.name ?? "—"}</span>,
    },
    {
      key: "project",
      header: "Dự án",
      cell: (tx) =>
        tx.project ? (
          <span className="whitespace-nowrap text-xs" title={tx.project.title}>
            <span className="font-medium">{tx.project.code}</span>
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    { key: "type", header: "Loại", cell: (tx) => <StatusBadge map={FINANCE_TYPES} value={tx.type} /> },
    {
      key: "total",
      header: "Tổng tiền",
      headClassName: "text-right",
      className: cn(amountCls, "font-medium"),
      cell: (tx) => formatVND(tx.totalAmount),
    },
    {
      key: "paid",
      header: "Đã thanh toán",
      headClassName: "text-right",
      className: amountCls,
      cell: (tx) => <span className={tx.type === "income" ? "text-income" : "text-expense"}>{formatVND(tx.paidAmount)}</span>,
    },
    {
      key: "remaining",
      header: "Còn lại",
      headClassName: "text-right",
      className: amountCls,
      cell: (tx) => (
        <span className={big(tx.remainingAmount) > 0n && tx.status !== "cancelled" ? "text-warning" : "text-muted-foreground"}>
          {formatVND(tx.remainingAmount)}
        </span>
      ),
    },
    { key: "status", header: "Trạng thái", cell: (tx) => <StatusBadge map={TRANSACTION_STATUS} value={tx.status} /> },
    {
      key: "actions",
      header: <span className="sr-only">Thao tác</span>,
      headClassName: "w-10",
      cell: (tx) => <RowActions tx={tx} onOpen={onOpen} onPay={onPay} onEdit={onEdit} onDelete={onDelete} />,
    },
  ]

  return (
    <div className="grid gap-2">
      <div className="overflow-x-auto rounded-xl">
        <DataTable
          className="min-w-[60rem]"
          columns={columns}
          rows={data?.items}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
          onRowClick={onOpen}
          empty={
            <EmptyState
              icon={ReceiptTextIcon}
              title="Không có giao dịch"
              description="Không có giao dịch nào khớp bộ lọc hiện tại."
              className="m-3 border-0"
              action={
                onCreate && (
                  <Button size="sm" onClick={onCreate}>
                    Thêm giao dịch
                  </Button>
                )
              }
            />
          }
        />
      </div>
      <Pagination meta={data?.meta} onPageChange={onPageChange} />
    </div>
  )
}
