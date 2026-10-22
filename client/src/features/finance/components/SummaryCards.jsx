import { ArrowDownRightIcon, ArrowUpRightIcon, ScaleIcon, WalletIcon } from "lucide-react"
import { StatCard } from "@/components/shared/StatCard"
import { ErrorState } from "@/components/shared/ErrorState"
import { big, formatVND } from "@/lib/utils/format"

/** Four cash KPIs from GET /finance/summary. Amounts are exact decimal strings. */
export function SummaryCards({ query }) {
  const { data, isLoading, error, refetch } = query
  if (error) return <ErrorState error={error} onRetry={refetch} className="py-6" />

  const s = data ?? {}
  const c = s.counts ?? {}
  const netPositive = big(s.netCash) >= 0n
  const projectedPositive = big(s.projectedNet) >= 0n

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Doanh thu đã thu"
        value={formatVND(s.receivedIncome)}
        hint={isLoading ? undefined : `${c.incomePayments ?? 0} khoản thanh toán`}
        icon={ArrowUpRightIcon}
        accent="income"
        loading={isLoading}
      />
      <StatCard
        label="Chi phí đã chi"
        value={formatVND(s.paidExpense)}
        hint={isLoading ? undefined : `${c.expensePayments ?? 0} khoản thanh toán`}
        icon={ArrowDownRightIcon}
        accent="expense"
        loading={isLoading}
      />
      <StatCard
        label="Lợi nhuận thực thu – thực chi"
        value={formatVND(s.netCash)}
        hint="Chỉ tính các khoản đã thanh toán"
        icon={WalletIcon}
        accent={netPositive ? "success" : "danger"}
        loading={isLoading}
      />
      <StatCard
        label="Chênh lệch sau dự kiến"
        value={formatVND(s.projectedNet)}
        hint={
          isLoading
            ? undefined
            : `Còn phải thu ${formatVND(s.expectedIncome)} · còn phải chi ${formatVND(s.expectedExpense)}`
        }
        icon={ScaleIcon}
        accent={projectedPositive ? "info" : "warning"}
        loading={isLoading}
      />
    </div>
  )
}
