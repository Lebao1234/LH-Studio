import { format } from "date-fns"
import { CalendarRangeIcon, ChevronLeftIcon, ChevronRightIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FilterBar } from "@/components/shared/FilterBar"
import { SimpleSelect } from "@/components/shared/SimpleSelect"
import { useProjectOptions } from "@/hooks/use-lookups"
import { options } from "@/lib/constants/labels"
import { cn } from "@/lib/utils"
import { useCategoryOptions } from "../hooks/use-finance"
import { monthKey, monthLabel, parseMonth, shiftMonth } from "../lib/finance-utils"

export function FinanceFilters({ filters, setFilter, setFilters, className }) {
  const { data: projectOptions = [] } = useProjectOptions()
  const { options: categoryOptions } = useCategoryOptions({ type: filters.type })
  const custom = filters.range === "custom"
  const currentKey = filters.month || monthKey()

  const goMonth = (key) => setFilters({ range: "month", month: key === monthKey() ? "" : key, start: "", end: "" })

  const startCustom = () => {
    const { year, month } = parseMonth(currentKey)
    setFilters({
      range: "custom",
      start: format(new Date(year, month - 1, 1), "yyyy-MM-dd"),
      end: format(new Date(year, month, 0), "yyyy-MM-dd"),
    })
  }

  const hasExtra = ["projectId", "type", "categoryId", "status"].some((k) => filters[k] && filters[k] !== "all")

  return (
    <FilterBar className={className}>
      <div className="flex items-center gap-1 rounded-lg bg-card p-0.5 ring-1 ring-foreground/10">
        {custom ? (
          <div className="flex flex-wrap items-center gap-1 px-1">
            <label className="sr-only" htmlFor="fin-start">
              Từ ngày
            </label>
            <Input
              id="fin-start"
              type="date"
              className="h-7 w-[8.5rem] text-xs"
              value={filters.start}
              max={filters.end || undefined}
              onChange={(e) => setFilter("start", e.target.value)}
            />
            <span className="text-xs text-muted-foreground">–</span>
            <label className="sr-only" htmlFor="fin-end">
              Đến ngày
            </label>
            <Input
              id="fin-end"
              type="date"
              className="h-7 w-[8.5rem] text-xs"
              value={filters.end}
              min={filters.start || undefined}
              onChange={(e) => setFilter("end", e.target.value)}
            />
            <Button variant="ghost" size="sm" onClick={() => goMonth(currentKey)}>
              Theo tháng
            </Button>
          </div>
        ) : (
          <>
            <Button variant="ghost" size="icon-sm" aria-label="Tháng trước" onClick={() => goMonth(shiftMonth(currentKey, -1))}>
              <ChevronLeftIcon />
            </Button>
            <span className="min-w-28 text-center text-sm font-medium tabular" aria-live="polite">
              {monthLabel(currentKey)}
            </span>
            <Button variant="ghost" size="icon-sm" aria-label="Tháng sau" onClick={() => goMonth(shiftMonth(currentKey, 1))}>
              <ChevronRightIcon />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn("text-muted-foreground", currentKey === monthKey() && "hidden")}
              onClick={() => goMonth(monthKey())}
            >
              Tháng này
            </Button>
            <Button variant="ghost" size="sm" onClick={startCustom}>
              <CalendarRangeIcon /> Tùy chọn
            </Button>
          </>
        )}
      </div>

      <SimpleSelect
        aria-label="Dự án"
        className="w-full sm:w-52"
        value={filters.projectId}
        onChange={(v) => setFilter("projectId", v)}
        options={projectOptions}
        allLabel="Tất cả dự án"
      />
      <SimpleSelect
        aria-label="Loại giao dịch"
        className="w-full sm:w-32"
        value={filters.type}
        onChange={(v) => setFilters({ type: v, categoryId: "all" })}
        options={options.financeTypes}
        allLabel="Thu & chi"
      />
      <SimpleSelect
        aria-label="Danh mục"
        className="w-full sm:w-48"
        value={filters.categoryId}
        onChange={(v) => setFilter("categoryId", v)}
        options={categoryOptions}
        allLabel="Tất cả danh mục"
      />
      <SimpleSelect
        aria-label="Trạng thái thanh toán"
        className="w-full sm:w-48"
        value={filters.status}
        onChange={(v) => setFilter("status", v)}
        options={options.transactionStatus}
        allLabel="Mọi trạng thái"
      />
      {hasExtra && (
        <Button variant="ghost" size="sm" onClick={() => setFilters({ projectId: "all", type: "all", categoryId: "all", status: "all" })}>
          <XIcon /> Xóa lọc
        </Button>
      )}
    </FilterBar>
  )
}
