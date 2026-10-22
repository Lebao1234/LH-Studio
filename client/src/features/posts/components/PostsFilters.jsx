import { XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FilterBar } from "@/components/shared/FilterBar"
import { SearchInput } from "@/components/shared/SearchInput"
import { SimpleSelect } from "@/components/shared/SimpleSelect"
import { useChannels, useProjectOptions } from "@/hooks/use-lookups"
import { options } from "@/lib/constants/labels"

const INDEPENDENT = "__independent"

/** URL-backed filters for the posts table. `filters` / `setFilters` come from useUrlFilters. */
export function PostsFilters({ filters, setFilters }) {
  const channelsQuery = useChannels()
  const projectsQuery = useProjectOptions()

  const channelOptions = (channelsQuery.data ?? [])
    .filter((c) => filters.platform === "all" || c.platform === filters.platform)
    .map((c) => ({ value: String(c._id ?? c.id), label: c.name }))
  const projectOptions = [{ value: INDEPENDENT, label: "Độc lập (không gắn dự án)" }, ...(projectsQuery.data ?? [])]
  const projectValue = filters.independent === "true" ? INDEPENDENT : filters.project

  const active =
    filters.search || filters.status !== "all" || filters.platform !== "all" || filters.channel !== "all" || projectValue !== "all"

  return (
    <FilterBar>
      <SearchInput value={filters.search} onChange={(v) => setFilters({ search: v })} placeholder="Tìm theo tiêu đề..." />
      <SimpleSelect
        aria-label="Lọc theo trạng thái"
        className="w-36"
        value={filters.status}
        onChange={(v) => setFilters({ status: v })}
        options={options.postStatus}
        allLabel="Mọi trạng thái"
      />
      <SimpleSelect
        aria-label="Lọc theo nền tảng"
        className="w-36"
        value={filters.platform}
        onChange={(v) => setFilters({ platform: v, channel: "all" })}
        options={options.platforms}
        allLabel="Mọi nền tảng"
      />
      <SimpleSelect
        aria-label="Lọc theo kênh"
        className="w-44"
        value={filters.channel}
        onChange={(v) => setFilters({ channel: v })}
        options={channelOptions}
        allLabel="Mọi kênh"
      />
      <SimpleSelect
        aria-label="Lọc theo dự án"
        className="w-52"
        value={projectValue}
        onChange={(v) => (v === INDEPENDENT ? setFilters({ independent: "true", project: "all" }) : setFilters({ independent: "", project: v }))}
        options={projectOptions}
        allLabel="Mọi dự án"
      />
      {active && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setFilters({ search: "", status: "all", platform: "all", channel: "all", project: "all", independent: "" })}
        >
          <XIcon /> Xóa lọc
        </Button>
      )}
    </FilterBar>
  )
}
