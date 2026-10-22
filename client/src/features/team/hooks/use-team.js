import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { studioApi } from "@/lib/api/studios.api"
import { getErrorMessage } from "@/lib/api/axios"

export const teamKeys = {
  members: ["studio", "members", "all"],
  invitations: ["studio", "invitations"],
}

/** All members (active + inactive); filtering happens client-side. */
export function useTeamMembers() {
  return useQuery({ queryKey: teamKeys.members, queryFn: () => studioApi.members(), staleTime: 30_000 })
}

export function useInvitations(enabled) {
  return useQuery({ queryKey: teamKeys.invitations, queryFn: studioApi.invitations, enabled: Boolean(enabled), staleTime: 30_000 })
}

/** Member changes affect every ["studio", ...] cache (incl. useStudioMembers) and dashboard counts. */
function useInvalidateTeam() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([queryClient.invalidateQueries({ queryKey: ["studio"] }), queryClient.invalidateQueries({ queryKey: ["dashboard"] })])
}

const toastError = (err) => toast.error(getErrorMessage(err))

export function useInviteMember(options = {}) {
  const invalidate = useInvalidateTeam()
  return useMutation({
    mutationFn: studioApi.addMember,
    ...options,
    onSuccess: (...args) => {
      invalidate()
      options.onSuccess?.(...args)
    },
  })
}

export function useUpdateMember(options = {}) {
  const invalidate = useInvalidateTeam()
  return useMutation({
    mutationFn: ({ id, ...body }) => studioApi.updateMember(id, body),
    onError: toastError,
    ...options,
    onSuccess: (...args) => {
      invalidate()
      options.onSuccess?.(...args)
    },
  })
}

export function useDeactivateMember(options = {}) {
  const invalidate = useInvalidateTeam()
  return useMutation({
    mutationFn: (id) => studioApi.removeMember(id),
    onError: toastError,
    ...options,
    onSuccess: (...args) => {
      invalidate()
      options.onSuccess?.(...args)
    },
  })
}

export function useRevokeInvitation(options = {}) {
  const invalidate = useInvalidateTeam()
  return useMutation({
    mutationFn: (id) => studioApi.revokeInvitation(id),
    onError: toastError,
    ...options,
    onSuccess: (...args) => {
      invalidate()
      options.onSuccess?.(...args)
    },
  })
}
