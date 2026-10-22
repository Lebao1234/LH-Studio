import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FilterBar } from "@/components/shared/FilterBar"
import { SimpleSelect } from "@/components/shared/SimpleSelect"
import { useChannels } from "@/hooks/use-lookups"
import { options } from "@/lib/constants/labels"
import { formatDate } from "@/lib/utils/format"

/** Month navigation + platform / channel filters. */
export function CalendarToolbar({ month, onPrev, onToday, onNext, platform, channel, onFilterChange, fetching }) {
  const channelsQuery = useChannels()
  const channelOptions = (channelsQuery.data ?? [])
    .filter((c) => platform === "all" || c.platform === platform)
    .map((c) => ({ value: String(c._id ?? c.id), label: c.name }))

  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon-sm" aria-label="Tháng trước" onClick={onPrev}>
            <ChevronLeftIcon />
          </Button>
          <Button variant="outline" size="sm" onClick={onToday}>
            Hôm nay
          </Button>
          <Button variant="outline" size="icon-sm" aria-label="Tháng sau" onClick={onNext}>
            <ChevronRightIcon />
          </Button>
        </div>
        <h2 className="text-base font-semibold tracking-tight" aria-live="polite">
          Tháng {formatDate(month, "M, yyyy")}
        </h2>
        {fetching && <span className="size-1.5 animate-pulse rounded-full bg-primary" aria-label="Đang tải" />}
      </div>
      <FilterBar>
        <SimpleSelect
          aria-label="Lọc theo nền tảng"
          size="sm"
          className="w-36"
          value={platform}
          onChange={(v) => onFilterChange({ platform: v, channel: "all" })}
          options={options.platforms}
          allLabel="Mọi nền tảng"
        />
        <SimpleSelect
          aria-label="Lọc theo kênh"
          size="sm"
          className="w-44"
          value={channel}
          onChange={(v) => onFilterChange({ channel: v })}
          options={channelOptions}
          allLabel="Mọi kênh"
        />
      </FilterBar>
    </div>
  )
}
