import { PageHeader } from "@/components/shared/PageHeader"
import { useUrlFilters } from "@/hooks/use-url-filters"
import { TaskList } from "../components/TaskList"
import { TASK_FILTER_DEFAULTS } from "../lib/task-utils"

export default function TasksPage() {
  const [filters, setFilter, setFilters] = useUrlFilters(TASK_FILTER_DEFAULTS)
  return (
    <div className="grid gap-4">
      <PageHeader title="Công việc" description="Mọi công việc trong các dự án bạn tham gia." />
      <TaskList filters={filters} setFilter={setFilter} setFilters={setFilters} />
    </div>
  )
}
