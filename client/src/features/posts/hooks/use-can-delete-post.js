import { usePermissions } from "@/features/auth/auth-context"

const idStr = (v) => (v && typeof v === "object" ? String(v._id ?? v.id) : v ? String(v) : null)

/** Mirrors the API delete rule: creator or owner/admin; published posts only owner/admin. */
export function useCanDeletePost() {
  const { isManager, userId, canWrite } = usePermissions()
  return (post) => {
    if (!canWrite || !post) return false
    if (isManager) return true
    return post.status !== "published" && idStr(post.createdBy) === String(userId)
  }
}
