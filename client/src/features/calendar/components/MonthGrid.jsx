import { isSameMonth, isToday } from "date-fns"
import { PlusIcon } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate } from "@/lib/utils/format"
import { cn } from "@/lib/utils"
import { WEEKDAYS, WEEKDAY_NAMES, dayKey } from "../lib/calendar-utils"
import { PostChip } from "./PostChip"
import { styleOf } from "./post-status-styles"

const MAX_CHIPS = 3
const MAX_DOTS = 4
const isDesktop = () => typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches

/**
 * Mon–Sun month grid. Desktop: status chips per day; phones: coloured dots + count
 * (the selected day's list is rendered by the page).
 */
export function MonthGrid({ month, days, byDay, selectedKey, onSelectDay, onOpenPost, onCreate, isLoading }) {
  const weeks = []
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))

  return (
    <div role="grid" aria-label={`Lịch đăng ${formatDate(month, "MM/yyyy")}`} className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
      <div role="row" className="grid grid-cols-7 border-b border-border">
        {WEEKDAYS.map((w, i) => (
          <div key={w} role="columnheader" aria-label={WEEKDAY_NAMES[i]} className={cn("py-1.5 text-center text-xs font-medium text-muted-foreground", i >= 5 && "text-foreground/70")}>
            {w}
          </div>
        ))}
      </div>
      {weeks.map((week) => (
        <div role="row" key={dayKey(week[0])} className="grid grid-cols-7 border-b border-border last:border-b-0">
          {week.map((day) => (
            <DayCell
              key={dayKey(day)}
              day={day}
              inMonth={isSameMonth(day, month)}
              posts={byDay.get(dayKey(day)) ?? []}
              selected={selectedKey === dayKey(day)}
              onSelectDay={onSelectDay}
              onOpenPost={onOpenPost}
              onCreate={onCreate}
              isLoading={isLoading}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

function DayCell({ day, inMonth, posts, selected, onSelectDay, onOpenPost, onCreate, isLoading }) {
  const today = isToday(day)
  const fullDate = formatDate(day, "EEEE, dd/MM/yyyy")
  const overflow = posts.length - MAX_CHIPS

  const handleClick = () => {
    onSelectDay(day)
    if (!posts.length && onCreate && isDesktop()) onCreate(day)
  }

  return (
    <div
      role="gridcell"
      aria-selected={selected}
      onClick={handleClick}
      className={cn(
        "group relative flex h-14 min-w-0 cursor-pointer flex-col gap-1 border-r border-border p-1 last:border-r-0 md:h-auto md:min-h-28 md:p-1.5",
        !inMonth && "bg-muted/25",
        selected && "bg-primary/8 ring-1 ring-primary/40 ring-inset",
        "hover:bg-accent/40",
      )}
    >
      <div className="flex items-center justify-between gap-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onSelectDay(day)
          }}
          aria-label={`${fullDate}, ${posts.length} bài viết`}
          aria-current={today ? "date" : undefined}
          className={cn(
            "tabular flex size-6 items-center justify-center rounded-full text-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            today ? "bg-primary font-semibold text-primary-foreground" : inMonth ? "text-foreground" : "text-muted-foreground/60",
          )}
        >
          {formatDate(day, "d")}
        </button>
        {onCreate && (
          <button
            type="button"
            aria-label={`Thêm bài viết ngày ${formatDate(day, "dd/MM")}`}
            onClick={(e) => {
              e.stopPropagation()
              onCreate(day)
            }}
            className="hidden size-5 items-center justify-center rounded text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-accent hover:text-foreground focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none md:flex"
          >
            <PlusIcon className="size-3.5" />
          </button>
        )}
      </div>

      {isLoading ? (
        <Skeleton className="hidden h-4 w-4/5 md:block" />
      ) : (
        <>
          {/* Desktop: chips */}
          <div className="hidden min-w-0 flex-col gap-0.5 md:flex">
            {posts.slice(0, MAX_CHIPS).map((p) => (
              <PostChip key={p.id ?? p._id} post={p} onClick={onOpenPost} />
            ))}
            {overflow > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onSelectDay(day)
                }}
                className="h-5 rounded px-1 text-left text-[11px] text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                aria-label={`Xem thêm ${overflow} bài viết ngày ${formatDate(day, "dd/MM")}`}
              >
                +{overflow} bài
              </button>
            )}
          </div>
          {/* Phones: dots */}
          {posts.length > 0 && (
            <div className="flex flex-wrap items-center gap-0.5 md:hidden" aria-hidden>
              {posts.slice(0, MAX_DOTS).map((p) => (
                <span key={p.id ?? p._id} className={cn("size-1.5 rounded-full", styleOf(p.status).dot)} />
              ))}
              {posts.length > MAX_DOTS && <span className="text-[9px] leading-none text-muted-foreground">+{posts.length - MAX_DOTS}</span>}
            </div>
          )}
        </>
      )}
    </div>
  )
}
