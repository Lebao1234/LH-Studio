import { useCallback, useMemo } from "react"
import { useSearchParams } from "react-router"

/**
 * Shareable filters in the URL query string.
 * const [filters, setFilter, setFilters] = useUrlFilters({ status: "all", page: "1" })
 * Changing any filter other than `page` resets to page 1.
 */
export function useUrlFilters(defaults = {}) {
  const [params, setParams] = useSearchParams()

  const filters = useMemo(() => {
    const out = { ...defaults }
    for (const [k, v] of params.entries()) out[k] = v
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params])

  const setFilters = useCallback(
    (patch) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          for (const [k, v] of Object.entries(patch)) {
            if (v === undefined || v === null || v === "" || v === defaults[k]) next.delete(k)
            else next.set(k, String(v))
          }
          if (!("page" in patch)) next.delete("page")
          return next
        },
        { replace: true },
      )
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setParams],
  )

  const setFilter = useCallback((key, value) => setFilters({ [key]: value }), [setFilters])
  return [filters, setFilter, setFilters]
}
