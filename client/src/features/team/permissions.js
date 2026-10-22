/**
 * UI-only rules for what the current manager may do to a member row.
 * The API enforces the same rules (PROTECTED_OWNER, OWNER_ONLY, LAST_OWNER).
 */
export function memberCapabilities(member, { canManageTeam, isOwner, userId, activeOwners }) {
  const none = { editRole: false, deactivate: false, reactivate: false, approve: false, reject: false, reason: null }
  if (!canManageTeam) return none
  if (member.isInitialOwner) return { ...none, reason: "Chủ sở hữu khởi tạo studio không thể bị thay đổi." }
  if (member.role === "owner" && !isOwner) return { ...none, reason: "Chỉ chủ sở hữu mới có thể thay đổi chủ sở hữu khác." }

  const isSelf = String(member.userId ?? member.user?._id) === String(userId)
  const isLastOwner = member.role === "owner" && member.status === "active" && activeOwners <= 1
  if (isLastOwner) return { ...none, reason: "Studio phải còn ít nhất một chủ sở hữu." }

  const isPending = member.status === "pending"

  return {
    editRole: !isPending,
    approve: isPending,
    reject: isPending,
    // Never offer to deactivate yourself — it would lock you out of the studio.
    deactivate: member.status === "active" && !isSelf,
    reactivate: member.status === "inactive",
    reason: null,
  }
}

/** Role options the current user may assign. Only owners can grant the owner role. */
export const assignableRoles = (studioRoleOptions, isOwner) => studioRoleOptions.filter((o) => isOwner || o.value !== "owner")
