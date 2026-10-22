import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { episodesApi } from "@/lib/api/projects.api"

export function useEpisodes(projectId, params) {
  return useQuery({
    queryKey: ["episodes", projectId, "list", params],
    queryFn: () => episodesApi.list(projectId, params),
    enabled: Boolean(projectId),
    placeholderData: keepPreviousData,
  })
}

/** Full episode (the list omits `script`). */
export function useEpisode(episodeId, options = {}) {
  return useQuery({
    queryKey: ["episodes", "detail", episodeId],
    queryFn: () => episodesApi.get(episodeId),
    enabled: Boolean(episodeId),
    ...options,
  })
}

function useInvalidateEpisodes(projectId) {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: ["episodes"] })
    qc.invalidateQueries({ queryKey: ["project", projectId] })
    qc.invalidateQueries({ queryKey: ["projects"] })
    qc.invalidateQueries({ queryKey: ["dashboard"] })
  }
}

export function useSaveEpisode(projectId, episodeId) {
  const invalidate = useInvalidateEpisodes(projectId)
  return useMutation({
    mutationFn: (body) => (episodeId ? episodesApi.update(episodeId, body) : episodesApi.create(projectId, body)),
    onSuccess: invalidate,
  })
}

export function useDeleteEpisode(projectId) {
  const qc = useQueryClient()
  const invalidate = useInvalidateEpisodes(projectId)
  return useMutation({
    mutationFn: (episodeId) => episodesApi.remove(episodeId),
    onSuccess: () => {
      invalidate()
      // Tasks of the deleted episode lose their episode reference.
      qc.invalidateQueries({ queryKey: ["tasks"] })
    },
  })
}
