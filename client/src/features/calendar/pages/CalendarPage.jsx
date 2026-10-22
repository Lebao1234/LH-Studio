import { useMemo, useState } from "react"
import { Link } from "react-router"
import { addMonths, isSameMonth, startOfMonth } from "date-fns"
import { InfoIcon, PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ErrorState } from "@/components/shared/ErrorState"
import { PageHeader } from "@/components/shared/PageHeader"
import { usePermissions } from "@/features/auth/auth-context"
import { PostFormDialog } from "@/features/posts/components/PostFormDialog"
import { useUrlFilters } from "@/hooks/use-url-filters"
import { formatDate } from "@/lib/utils/format"
import { AgendaList } from "../components/AgendaList"
import { CalendarToolbar } from "../components/CalendarToolbar"
import { MonthGrid } from "../components/MonthGrid"
import { StatusLegend } from "../components/StatusLegend"
import { useCalendar } from "../hooks/use-calendar"
import { dayKey, groupByDay, monthGrid, monthKey, parseMonth, prefillForDay } from "../lib/calendar-utils"

const DEFAULTS = { month: "", platform: "all", channel: "all" }
const UPCOMING_LIMIT = 8

export default function CalendarPage() {
  const { canWrite } = usePermissions()
  const [filters, , setFilters] = useUrlFilters(DEFAULTS)
  const month = useMemo(() => parseMonth(filters.month), [filters.month])
  const grid = useMemo(() => monthGrid(month), [month])

  const query = useCalendar({ start: grid.start, end: grid.end, platform: filters.platform, channelId: filters.channel })
  const items = useMemo(() => query.data ?? [], [query.data])
  const byDay = useMemo(() => groupByDay(items), [items])

  const [selected, setSelected] = useState(null)
  const today = new Date()
  const selectedDay = selected && isSameMonth(selected, month) ? selected : isSameMonth(today, month) ? today : month
  const selectedPosts = byDay.get(dayKey(selectedDay)) ?? []

  const now = today.getTime()
  const upcoming = items
    .filter((p) => (p.status === "scheduled" || p.status === "draft") && new Date(p.date).getTime() >= now)
    .slice(0, UPCOMING_LIMIT)

  const [editing, setEditing] = useState(null)
  const [createDefaults, setCreateDefaults] = useState(null)
  const channelFilter = filters.channel !== "all" ? filters.channel : undefined
  const openCreate = canWrite ? (day) => setCreateDefaults(prefillForDay(day, channelFilter)) : undefined

  const goMonth = (d) => {
    setSelected(null)
    setFilters({ month: isSameMonth(d, new Date()) ? "" : monthKey(d) })
  }

  return (
    <div className="grid gap-4">
      <PageHeader
        title="Lịch đăng bài"
        description="Kế hoạch đăng theo tháng trên các kênh. Đăng bài thực hiện thủ công, sau đó “Đánh dấu đã đăng”."
        actions={
          canWrite && (
            <Button size="sm" onClick={() => openCreate(selectedDay)}>
              <PlusIcon /> Tạo bài viết
            </Button>
          )
        }
      />

      <CalendarToolbar
        month={month}
        onPrev={() => goMonth(addMonths(month, -1))}
        onToday={() => goMonth(startOfMonth(new Date()))}
        onNext={() => goMonth(addMonths(month, 1))}
        platform={filters.platform}
        channel={filters.channel}
        onFilterChange={setFilters}
        fetching={query.isFetching && !query.isLoading}
      />

      {query.error && <ErrorState error={query.error} onRetry={query.refetch} />}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="grid min-w-0 content-start gap-2">
          <MonthGrid
            month={month}
            days={grid.days}
            byDay={byDay}
            selectedKey={dayKey(selectedDay)}
            onSelectDay={setSelected}
            onOpenPost={setEditing}
            onCreate={openCreate}
            isLoading={query.isLoading}
          />
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between">
            <StatusLegend />
            <p className="flex items-start gap-1 text-xs text-muted-foreground">
              <InfoIcon className="mt-px size-3.5 shrink-0" aria-hidden />
              <span>
                Bản nháp chưa có ngày không hiển thị trên lịch —{" "}
                <Link to="/posts?status=draft" className="underline underline-offset-2 hover:text-foreground">
                  xem trong Bài viết
                </Link>
                .
              </span>
            </p>
          </div>
        </div>

        <div className="grid min-w-0 content-start gap-3">
          <AgendaList
            title={formatDate(selectedDay, "EEEE, dd/MM")}
            posts={selectedPosts}
            isLoading={query.isLoading}
            onOpenPost={setEditing}
            onCreate={openCreate ? () => openCreate(selectedDay) : undefined}
            emptyText="Không có bài viết trong ngày này."
            className="[&_h2]:capitalize"
          />
          <AgendaList
            title="Sắp tới"
            posts={upcoming}
            isLoading={query.isLoading}
            showDate
            onOpenPost={setEditing}
            emptyText="Không có bài sắp đăng trong khoảng lịch đang xem."
          />
        </div>
      </div>

      <PostFormDialog open={Boolean(editing)} onOpenChange={(o) => !o && setEditing(null)} post={editing ?? undefined} />
      <PostFormDialog
        open={Boolean(createDefaults)}
        onOpenChange={(o) => !o && setCreateDefaults(null)}
        defaultValues={createDefaults ?? undefined}
      />
    </div>
  )
}
