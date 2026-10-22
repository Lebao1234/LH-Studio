import { createContext, useContext } from "react"

export const AuthContext = createContext(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>")
  return ctx
}

/**
 * UI-level permission flags derived from the studio role. These only shape the UI;
 * the API enforces every rule independently.
 */
export function usePermissions() {
  const { role, user } = useAuth()
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
