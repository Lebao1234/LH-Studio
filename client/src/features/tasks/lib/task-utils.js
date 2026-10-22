const OPEN = ["todo", "in_progress", "review"]

/** Prefers the server-computed flag; falls back to the same rule client-side. */
export const isTaskOverdue = (t) =>
  t?.isOverdue ?? (Boolean(t?.dueDate) && new Date(t.dueDate) < new Date() && OPEN.includes(t.status))

export const KANBAN_STATUSES = ["todo", "in_progress", "review", "done"]

export const TASK_SORTS = [
  { value: "-updatedAt", label: "Cập nhật gần nhất" },
  { value: "dueDate", label: "Hạn chót sớm nhất" },
  { value: "-createdAt", label: "Mới tạo" },
  { value: "title", label: "Tiêu đề A → Z" },
]

export const TASK_FILTER_DEFAULTS = {
  search: "",
  projectId: "all",
  status: "all",
  priority: "all",
  mine: "",
  overdue: "",
  sort: "-updatedAt",
  view: "table",
  page: "1",
}

export const leadOf = (task) => task?.assignments?.find((a) => a.role === "lead")
