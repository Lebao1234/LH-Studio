import { fromDateInput } from "@/lib/utils/format"
import { PROJECT_CATEGORIES } from "@/lib/constants/labels"

const CLOSED = ["completed", "cancelled"]

/** Overdue = due date passed while the project is still open. */
export const isProjectOverdue = (p) => Boolean(p?.dueDate) && new Date(p.dueDate) < new Date() && !CLOSED.includes(p.status)

/** Whole days since the due date passed (min 1); only meaningful when overdue. */
export const overdueDays = (p) => Math.max(1, Math.floor((Date.now() - new Date(p.dueDate)) / 86_400_000))

export const projectCategoryKey = (project) =>
  project?.category || (project?.code?.includes("-") ? project.code.split("-")[0] : "GEN")

/** Short category name: "Thiếu nhi (Kids)" → "Thiếu nhi". */
export const projectCategoryName = (project) => {
  const meta = PROJECT_CATEGORIES[projectCategoryKey(project)]
  return meta ? meta.label.split("(")[0].trim() : null
}

/** Derives the UI permission flags for a project from the studio role + my project role. */
export function projectPermissions(perms, myProjectRole) {
  const canWrite = perms.canWrite
  return {
    canEditProject: canWrite && (perms.isManager || myProjectRole === "manager"),
    canDeleteProject: perms.isManager,
    canManageMembers: canWrite && (perms.isManager || myProjectRole === "manager"),
    canWriteEpisodes: canWrite && (perms.isManager || ["manager", "editor", "creator"].includes(myProjectRole)),
    canDeleteEpisodes: canWrite && (perms.isManager || myProjectRole === "manager"),
    canCreateTasks: canWrite && Boolean(perms.isManager || myProjectRole),
  }
}

export const PROJECT_SORTS = [
  { value: "-updatedAt", label: "Cập nhật gần nhất" },
  { value: "-createdAt", label: "Mới tạo" },
  { value: "dueDate", label: "Hạn chót sớm nhất" },
  { value: "title", label: "Tên A → Z" },
  { value: "code", label: "Mã dự án" },
]

/**
 * Date field value for API bodies. Empty → "" (NOT null): the server's `nullableDate`
 * coerces null to 1970-01-01, while "" is correctly stored as null.
 */
export const dateForApi = (inputValue) => fromDateInput(inputValue) ?? ""
