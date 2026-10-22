import { useId } from "react"
import { KanbanSquareIcon, TableIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { FilterBar } from "@/components/shared/FilterBar"
import { SearchInput } from "@/components/shared/SearchInput"
import { SimpleSelect } from "@/components/shared/SimpleSelect"
import { useProjectOptions } from "@/hooks/use-lookups"
import { options } from "@/lib/constants/labels"
import { TASK_SORTS } from "../lib/task-utils"

function ToggleFilter({ label, checked, onChange }) {
  const id = useId()
  return (
    <div className="flex h-8 items-center gap-2 rounded-lg px-1">
      <Switch id={id} size="sm" checked={checked} onCheckedChange={onChange} />
      <Label htmlFor={id} className="cursor-pointer text-xs font-normal whitespace-nowrap">
        {label}
      </Label>
    </div>
  )
}

export function ViewToggle({ value, onChange }) {
  return (
    <div className="inline-flex rounded-lg bg-muted p-0.5" role="group" aria-label="Kiểu hiển thị">
      <Button
        variant={value === "table" ? "outline" : "ghost"}
        size="xs"
        aria-pressed={value === "table"}
        onClick={() => onChange("table")}
      >
        <TableIcon /> Bảng
      </Button>
      <Button
        variant={value === "kanban" ? "outline" : "ghost"}
        size="xs"
        aria-pressed={value === "kanban"}
        onClick={() => onChange("kanban")}
      >
        <KanbanSquareIcon /> Kanban
      </Button>
    </div>
  )
}

/** Filter controls for task lists. Values are strings ("all" / "" = unfiltered). */
export function TaskFilters({ filters, setFilter, setFilters, showProject = true }) {
  const projects = useProjectOptions()
  const hasFilters =
    Boolean(filters.search) ||
    (showProject && filters.projectId !== "all") ||
    filters.status !== "all" ||
    filters.priority !== "all" ||
    filters.mine === "true" ||
    filters.overdue === "true"

  return (
    <FilterBar>
      <SearchInput value={filters.search} onChange={(v) => setFilter("search", v)} placeholder="Tìm công việc..." />
      {showProject && (
        <SimpleSelect
          aria-label="Lọc dự án"
          className="w-full sm:w-48"
          value={filters.projectId}
          onChange={(v) => setFilter("projectId", v)}
          options={projects.data ?? []}
          allLabel="Mọi dự án"
        />
      )}
      <SimpleSelect
        aria-label="Lọc trạng thái"
        className="w-[calc(50%-0.25rem)] sm:w-36"
        value={filters.status}
        onChange={(v) => setFilter("status", v)}
        options={options.taskStatus}
        allLabel="Mọi trạng thái"
      />
      <SimpleSelect
        aria-label="Lọc ưu tiên"
        className="w-[calc(50%-0.25rem)] sm:w-36"
        value={filters.priority}
        onChange={(v) => setFilter("priority", v)}
        options={options.priority}
        allLabel="Mọi ưu tiên"
      />
      <SimpleSelect
        aria-label="Sắp xếp"
        className="w-full sm:w-44"
        value={filters.sort}
        onChange={(v) => setFilter("sort", v)}
        options={TASK_SORTS}
      />
      <ToggleFilter label="Việc của tôi" checked={filters.mine === "true"} onChange={(v) => setFilter("mine", v ? "true" : "")} />
      <ToggleFilter label="Quá hạn" checked={filters.overdue === "true"} onChange={(v) => setFilter("overdue", v ? "true" : "")} />
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            setFilters({ search: "", status: "all", priority: "all", mine: "", overdue: "", ...(showProject ? { projectId: "all" } : {}) })
          }
        >
          Xóa bộ lọc
        </Button>
      )}
    </FilterBar>
  )
}
