import { useCallback, useEffect, useMemo, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { authApi } from "@/lib/api/auth.api"
import { refreshSession } from "@/lib/api/axios"
import { onSessionExpired, tokenStore } from "@/lib/api/tokenStore"
import { AuthContext } from "./auth-context"

export function AuthProvider({ children }) {
  const queryClient = useQueryClient()
  const [state, setState] = useState({ status: "loading", user: null, memberships: [] })

  const applySession = useCallback((session) => {
    tokenStore.set(session.accessToken)
    setState({ status: "authenticated", user: session.user, memberships: session.memberships ?? [] })
  }, [])

  const clearSession = useCallback(() => {
    tokenStore.clear()
    queryClient.clear()
    setState({ status: "anonymous", user: null, memberships: [] })
  }, [queryClient])

  // Restore the session from the HttpOnly refresh cookie on first load.
  useEffect(() => {
    let cancelled = false
    refreshSession()
      .then((session) => !cancelled && applySession(session))
      .catch(() => !cancelled && setState({ status: "anonymous", user: null, memberships: [] }))
    return () => {
      cancelled = true
    }
  }, [applySession])

  useEffect(() => onSessionExpired(clearSession), [clearSession])

  const login = useCallback(async (credentials) => applySession(await authApi.login(credentials)), [applySession])
  const register = useCallback(async (body) => applySession(await authApi.register(body)), [applySession])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } finally {
      clearSession()
    }
  }, [clearSession])

  const reloadMe = useCallback(async () => {
    const me = await authApi.me()
    setState((s) => ({ ...s, user: me.user, memberships: me.memberships }))
  }, [])

  const value = useMemo(() => {
    const current = state.memberships[0] ?? null
    return {
      ...state,
      studio: current?.studio ?? null,
      role: current?.role ?? null,
      membershipStatus: current?.status ?? null,
      login,
      register,
      logout,
      reloadMe,
    }
  }, [state, login, register, logout, reloadMe])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
