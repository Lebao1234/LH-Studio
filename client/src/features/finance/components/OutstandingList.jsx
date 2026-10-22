import { AlertTriangleIcon, CalendarClockIcon, HandCoinsIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/EmptyState"
import { ErrorState } from "@/components/shared/ErrorState"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { FINANCE_TYPES, TRANSACTION_STATUS } from "@/lib/constants/labels"
import { cn } from "@/lib/utils"
import { formatDate, formatVND } from "@/lib/utils/format"
import { isOverdue, isPayable, txId } from "../lib/finance-utils"

/** Outstanding (planned / pending / partially paid) items ordered by expected date. */
export function OutstandingList({ query, overdueCount = 0, onOpen, onPay, className }) {
  const { data, isLoading, error, refetch } = query
  const items = data?.items ?? []
  const total = data?.meta?.total ?? 0

  return (
    <Card size="sm" className={className}>
      <CardHeader className="px-4">
        <CardTitle>Các khoản dự kiến</CardTitle>
        <p className="text-xs text-muted-foreground">
          {isLoading ? "Đang tải…" : `${total} khoản chưa tất toán trong kỳ`}
        </p>
        {overdueCount > 0 && (
          <CardAction>
            <StatusBadge tone="danger" dot>
              {overdueCount} quá hạn
            </StatusBadge>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="px-2">
        {error ? (
          <ErrorState error={error} onRetry={refetch} className="mx-2 py-6" />
        ) : isLoading ? (
          <div className="grid gap-2 px-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-11 w-full" />
            ))}
          </div>
        ) : !items.length ? (
          <EmptyState
            icon={CalendarClockIcon}
            title="Không có khoản dự kiến"
            description="Mọi khoản trong kỳ đã được tất toán."
            className="mx-2 py-6"
          />
        ) : (
          <ul className="grid max-h-[22rem] gap-0.5 overflow-y-auto">
            {items.map((tx) => {
              const overdue = isOverdue(tx)
              return (
                <li key={txId(tx)} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/50">
                  <button
                    type="button"
                    className="grid min-w-0 flex-1 gap-0.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded"
                    onClick={() => onOpen?.(tx)}
                  >
                    <span className="flex min-w-0 items-center gap-1.5">
                      <StatusBadge map={FINANCE_TYPES} value={tx.type} />
                      <span className="truncate text-sm font-medium" title={tx.title}>
                        {tx.title}
                      </span>
                    </span>
                    <span className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                      <span className={cn("inline-flex items-center gap-1", overdue && "font-medium text-destructive")}>
                        {overdue && <AlertTriangleIcon className="size-3" aria-hidden />}
                        {tx.expectedDate ? formatDate(tx.expectedDate) : "Chưa có ngày"}
                        {overdue && <span className="sr-only">(quá hạn)</span>}
                      </span>
                      <StatusBadge map={TRANSACTION_STATUS} value={tx.status} className="h-4 text-[10px]" />
                    </span>
                  </button>
                  <span className={cn("shrink-0 text-right text-sm font-semibold tabular", tx.type === "income" ? "text-income" : "text-expense")}>
                    {formatVND(tx.remainingAmount)}
                  </span>
                  {isPayable(tx) && (
                    <Button variant="ghost" size="icon-sm" aria-label={`Ghi nhận thanh toán: ${tx.title}`} title="Ghi nhận thanh toán" onClick={() => onPay?.(tx)}>
                      <HandCoinsIcon />
                    </Button>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
