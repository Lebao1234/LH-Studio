export const MEMBER_STATUS = {
  active: { label: "Đang hoạt động", tone: "success" },
  pending: { label: "Chờ phê duyệt", tone: "warning" },
  inactive: { label: "Đã vô hiệu hóa", tone: "muted" },
}

export const MEMBER_STATUS_FILTERS = [
  { value: "active", label: "Đang hoạt động" },
  { value: "pending", label: "Chờ phê duyệt" },
  { value: "inactive", label: "Đã vô hiệu hóa" },
]

/** Roles assignable through an invitation (owner is never granted by invite). */
export const INVITE_ROLES = ["admin", "member", "viewer"]
