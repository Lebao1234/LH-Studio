import { PieChartIcon } from "lucide-react"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/EmptyState"
import { ErrorState } from "@/components/shared/ErrorState"
import { formatVND } from "@/lib/utils/format"
import { bpToPercent } from "../lib/finance-utils"

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--expense)"]
const colorAt = (i) => COLORS[i % COLORS.length]

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const item = payload[0].payload
  return (
    <div className="rounded-lg bg-popover px-2.5 py-1.5 text-xs shadow-md ring-1 ring-foreground/10">
      <p className="font-medium">{item.name}</p>
      <p className="tabular text-muted-foreground">
        {formatVND(item.amount)} · {bpToPercent(item.shareBp)}
      </p>
    </div>
  )
}

/** Paid expenses grouped by category (cash basis, from payment records). */
export function ExpenseByCategory({ query, className }) {
  const { data, isLoading, error, refetch } = query
  const items = data?.items ?? []
  // Number() is used for chart geometry only; every displayed amount stays exact.
  const chartData = items.map((it) => ({ ...it, value: Number(it.amount) }))

  return (
    <Card size="sm" className={className}>
      <CardHeader className="px-4">
        <CardTitle>Chi phí theo danh mục</CardTitle>
        <p className="text-xs text-muted-foreground">
          Tổng đã chi: <span className="tabular font-medium text-expense">{formatVND(data?.total)}</span>
        </p>
      </CardHeader>
      <CardContent className="px-4">
        {error ? (
          <ErrorState error={error} onRetry={refetch} className="py-6" />
        ) : isLoading ? (
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <Skeleton className="size-36 rounded-full" />
            <div className="grid w-full flex-1 gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-5 w-full" />
              ))}
            </div>
          </div>
        ) : !items.length ? (
          <EmptyState icon={PieChartIcon} title="Chưa có khoản chi" description="Chưa có thanh toán chi nào trong kỳ này." className="py-6" />
        ) : (
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <div className="relative size-36 shrink-0" role="img" aria-label="Biểu đồ tỷ trọng chi phí theo danh mục">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="62%"
                    outerRadius="100%"
                    paddingAngle={items.length > 1 ? 2 : 0}
                    stroke="none"
                    isAnimationActive={false}
                  >
                    {chartData.map((it, i) => (
                      <Cell key={it.categoryId ?? i} fill={colorAt(i)} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[10px] text-muted-foreground">Danh mục</span>
                <span className="text-lg font-semibold tabular">{items.length}</span>
              </div>
            </div>
            <ul className="grid w-full min-w-0 flex-1 gap-1.5">
              {items.map((it, i) => (
                <li key={it.categoryId ?? i} className="grid gap-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="size-2 shrink-0 rounded-full" style={{ background: colorAt(i) }} aria-hidden />
                    <span className="min-w-0 flex-1 truncate" title={it.name}>
                      {it.name}
                    </span>
                    <span className="tabular font-medium">{formatVND(it.amount)}</span>
                    <span className="w-12 text-right tabular text-muted-foreground">{bpToPercent(it.shareBp)}</span>
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full" style={{ width: `${it.shareBp / 100}%`, background: colorAt(i) }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
