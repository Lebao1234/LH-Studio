import { describe, expect, it } from "vitest"

/** Pure permission computation logic mirroring usePermissions() in auth-context.js */
function computePermissions(role, user = { _id: "usr_123" }) {
  const isManager = role === "owner" || role === "admin"
  return {
    role,
    userId: user?._id ?? user?.id,
    isOwner: role === "owner",
    isManager,
    canWrite: Boolean(role) && role !== "viewer",
    canSeeFinance: isManager,
    canManageTeam: isManager,
    canManageChannels: isManager,
  }
}

describe("Client RBAC Permissions", () => {
  it("grants full permissions to Owner", () => {
    const perms = computePermissions("owner")
    expect(perms.isOwner).toBe(true)
    expect(perms.isManager).toBe(true)
    expect(perms.canWrite).toBe(true)
    expect(perms.canSeeFinance).toBe(true)
    expect(perms.canManageTeam).toBe(true)
    expect(perms.canManageChannels).toBe(true)
  })

  it("grants manager permissions to Admin (cannot be Owner)", () => {
    const perms = computePermissions("admin")
    expect(perms.isOwner).toBe(false)
    expect(perms.isManager).toBe(true)
    expect(perms.canWrite).toBe(true)
    expect(perms.canSeeFinance).toBe(true)
    expect(perms.canManageTeam).toBe(true)
    expect(perms.canManageChannels).toBe(true)
  })

  it("restricts Member from finance, team and channel management", () => {
    const perms = computePermissions("member")
    expect(perms.isOwner).toBe(false)
    expect(perms.isManager).toBe(false)
    expect(perms.canWrite).toBe(true)
    expect(perms.canSeeFinance).toBe(false)
    expect(perms.canManageTeam).toBe(false)
    expect(perms.canManageChannels).toBe(false)
  })

  it("restricts Viewer to read-only mode and denies all management and write access", () => {
    const perms = computePermissions("viewer")
    expect(perms.isOwner).toBe(false)
    expect(perms.isManager).toBe(false)
    expect(perms.canWrite).toBe(false)
    expect(perms.canSeeFinance).toBe(false)
    expect(perms.canManageTeam).toBe(false)
    expect(perms.canManageChannels).toBe(false)
  })
})
