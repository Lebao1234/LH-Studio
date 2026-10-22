import axios from "axios"
import { notifySessionExpired, tokenStore } from "./tokenStore"
const rawApiUrl = import.meta.env.VITE_API_URL
const baseURL = rawApiUrl ? `${rawApiUrl.replace(/\/$/, "")}/api/v1` : "/api/v1"

export const api = axios.create({
  baseURL,
  withCredentials: true, // refresh cookie
  timeout: 20_000,
  headers: { "X-CSRF-Protection": "1" },
})

api.interceptors.request.use((config) => {
  const token = tokenStore.get()
  if (token && !config.headers.Authorization) config.headers.Authorization = `Bearer ${token}`
  return config
})

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function requestRefresh() {
  try {
    const res = await api.post("/auth/refresh", null, { skipAuthRefresh: true })
    return res.data.data
  } catch (err) {
    // Another tab rotated the cookie a moment ago: the browser already holds the new one.
    if (err.response?.data?.code === "REFRESH_ROTATED") {
      await sleep(300)
      const res = await api.post("/auth/refresh", null, { skipAuthRefresh: true })
      return res.data.data
    }
    throw err
  }
}

let refreshPromise = null

/**
 * Single-flight refresh: concurrent 401s share one refresh request.
 * Resolves with the session payload ({ user, memberships, accessToken }).
 */
export function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = requestRefresh()
      .then((session) => {
        tokenStore.set(session.accessToken)
        return session
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const status = error.response?.status

    // Only authentication expiry is retried; 403/404/422 etc. are business errors.
    if (status !== 401 || !original || original.skipAuthRefresh || original._retried) {
      throw error
    }
    original._retried = true
    try {
      const session = await refreshSession()
      original.headers.Authorization = `Bearer ${session.accessToken}`
      return api(original)
    } catch {
      tokenStore.clear()
      notifySessionExpired()
      throw error
    }
  },
)

/** Unwraps the standard { success, data, meta } envelope. */
export const unwrap = (res) => res.data.data
export const unwrapPage = (res) => ({ items: res.data.data, meta: res.data.meta })

/** Human-readable message from an API error. */
export function getErrorMessage(error, fallback = "Đã có lỗi xảy ra. Vui lòng thử lại.") {
  if (!error) return fallback
  if (error.code === "ECONNABORTED") return "Máy chủ phản hồi quá lâu."
  if (!error.response) return "Không kết nối được máy chủ."
  const body = error.response.data
  if (body?.code === "VALIDATION_ERROR" && body.errors?.length) return body.errors[0].message || body.message
  return body?.message || fallback
}

/** Maps API field errors onto react-hook-form's setError. */
export function applyFieldErrors(error, setError) {
  const errors = error?.response?.data?.errors
  if (!Array.isArray(errors)) return false
  let applied = false
  for (const e of errors) {
    if (e.path) {
      setError(e.path, { type: "server", message: e.message })
      applied = true
    }
  }
  return applied
}

/** Strips empty strings so optional fields are omitted rather than sent blank. */
export function cleanParams(params = {}) {
  return Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "" && v !== "all"))
}
