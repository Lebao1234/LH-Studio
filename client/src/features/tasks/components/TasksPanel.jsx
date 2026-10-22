import { useCallback, useState } from "react"
import { TASK_FILTER_DEFAULTS } from "../lib/task-utils"
import { TaskList } from "./TaskList"

/** Local (non-URL) filter state with the same API as useUrlFilters; non-page changes reset to page 1. */
function useLocalFilters(defaults) {
  const [filters, setState] = useState(defaults)
  const setFilters = useCallback(
    (patch) => setState((prev) => ({ ...prev, ...("page" in patch ? {} : { page: "1" }), ...patch })),
    [],
  )
  const setFilter = useCallback((key, value) => setFilters({ [key]: value }), [setFilters])
  return [filters, setFilter, setFilters]
}

/**
 * Task list scoped to one project (used on the project detail page).
 * `canCreate` overrides the default (studio canWrite) create permission.
 */
export function TasksPanel({ projectId, canCreate }) {
  const [filters, setFilter, setFilters] = useLocalFilters(TASK_FILTER_DEFAULTS)
  return <TaskList filters={filters} setFilter={setFilter} setFilters={setFilters} projectId={projectId} canCreate={canCreate} />
}
