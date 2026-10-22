import { ArrowDownRightIcon, ArrowUpRightIcon, LineChartIcon, ScaleIcon, WalletIcon } from "lucide-react"
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { StatCard } from "@/components/shared/StatCard"
import { EmptyState } from "@/components/shared/EmptyState"
import { big, formatVND, formatVNDCompact } from "@/lib/utils/format"
import { axisProps, gridProps, tooltipProps } from "./chart-theme"
import { WidgetCard, WidgetLink } from "./WidgetCard"

const SERIES = { income: "Thu", expense: "Chi", net: "Dòng tiền ròng" }
const monthLabel = (m = "") => {
  const [y, mm] = m.split("-")
  return mm ? `T${Number(mm)}/${y.slice(2)}` : m
}

/** Exact amount strings are kept for the tooltip; Number() is used only for geometry. */
function toRows(cashflow = []) {
  return cashflow.map((c) => ({
    month: monthLabel(c.month),
    income: Number(c.income || 0),
    expense: Number(c.expense || 0),
    net: Number(c.net || 0),
    raw: c,
  }))
}

function CashflowTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const raw = payload[0].payload.raw
  return (
    <div style={tooltipProps.contentStyle}>
      <p style={tooltipProps.labelStyle}>{label}</p>
      {Object.keys(SERIES).map((k) => (
        <p key={k} className="tabular flex items-center justify-between gap-4">
          <span className="text-muted-foreground">{SERIES[k]}</span>
          <span>{formatVND(raw[k])}</span>
        </p>
      ))}
    </div>
  )
}

function CashflowChart({ cashflow }) {
  const rows = toRows(cashflow)
  const hasData = cashflow.some((c) => big(c.income) !== 0n || big(c.expense) !== 0n)
  if (!hasData) return <EmptyState icon={LineChartIcon} title="Chưa có dòng tiền trong 6 tháng qua" className="border-0 py-6" />
  return (
    <div role="img" aria-label="Biểu đồ thu chi 6 tháng gần nhất">
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={rows} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barGap={2}>
          <CartesianGrid {...gridProps} vertical={false} />
          <XAxis dataKey="month" {...axisProps} />
          <YAxis {...axisProps} width={52} tickFormatter={formatVNDCompact} />
          <Tooltip {...tooltipProps} content={<CashflowTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 11, color: "var(--muted-foreground)" }}
            formatter={(value) => <span style={{ color: "var(--muted-foreground)" }}>{value}</span>}
          />
          <Bar dataKey="income" name={SERIES.income} fill="var(--income)" radius={[3, 3, 0, 0]} maxBarSize={18} isAnimationActive={false} />
          <Bar dataKey="expense" name={SERIES.expense} fill="var(--expense)" radius={[3, 3, 0, 0]} maxBarSize={18} isAnimationActive={false} />
          <Line
            dataKey="net"
            name={SERIES.net}
            type="monotone"
            stroke="var(--info)"
            strokeWidth={2}
            dot={{ r: 2.5, fill: "var(--info)", strokeWidth: 0 }}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

const signedAccent = (v, pos = "income") => (big(v) < 0n ? "expense" : pos)

export function FinancialSummary({ query }) {
  const month = query.data?.month
  const loading = query.isPending
  const card = (props) => <StatCard loading={loading} {...props} />

  return (
    <div className="grid gap-3 lg:grid-cols-5">
      {!query.isError && (
        <div className="grid grid-cols-2 gap-3 lg:col-span-2 lg:content-start">
          {card({
            label: "Đã thu tháng này",
            icon: ArrowDownRightIcon,
            accent: "income",
            value: formatVNDCompact(month?.receivedIncome),
            hint: month ? formatVND(month.receivedIncome) : undefined,
          })}
          {card({
            label: "Đã chi tháng này",
            icon: ArrowUpRightIcon,
            accent: "expense",
            value: formatVNDCompact(month?.paidExpense),
            hint: month ? formatVND(month.paidExpense) : undefined,
          })}
          {card({
            label: "Dòng tiền ròng",
            icon: WalletIcon,
            accent: signedAccent(month?.netCash),
            value: formatVNDCompact(month?.netCash),
            hint: month ? formatVND(month.netCash) : undefined,
          })}
          {card({
            label: "Dự kiến cuối tháng",
            icon: ScaleIcon,
            accent: signedAccent(month?.projectedNet, "info"),
            value: formatVNDCompact(month?.projectedNet),
            hint: month ? `Gồm khoản chờ thu/chi · ${formatVND(month.projectedNet)}` : undefined,
          })}
        </div>
      )}
      <WidgetCard
        title="Dòng tiền 6 tháng"
        description="Thu, chi theo tháng và dòng tiền ròng"
        action={<WidgetLink to="/finance">Tài chính</WidgetLink>}
        query={query}
        skeleton={<Skeleton className="h-55 w-full" />}
        className={query.isError ? "lg:col-span-5" : "lg:col-span-3"}
      >
        <CashflowChart cashflow={query.data?.cashflow ?? []} />
      </WidgetCard>
    </div>
  )
}
