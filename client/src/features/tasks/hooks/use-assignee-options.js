import { useMemo } from "react"
import { useStudioMembers } from "@/hooks/use-lookups"

/** Active, non-viewer studio members as select options `{ value: userId, label, user }`. */
export function useAssigneeOptions(enabled = true) {
  const query = useStudioMembers({ enabled })
  const optionsList = useMemo(
    () =>
      (query.data ?? [])
        .filter((m) => m.status === "active" && m.role !== "viewer" && m.user)
        .map((m) => ({ value: String(m.userId), label: m.user.name, user: m.user })),
    [query.data],
  )
  return { options: optionsList, isLoading: query.isPending && enabled, error: query.error }
}
