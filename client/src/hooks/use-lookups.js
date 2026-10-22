import { useQuery } from "@tanstack/react-query"
import { studioApi } from "@/lib/api/studios.api"
import { projectsApi, episodesApi } from "@/lib/api/projects.api"
import { channelsApi } from "@/lib/api/posts.api"

// Shared, cached reference data for pickers and filters.

export function useStudioMembers(options = {}) {
  return useQuery({
    queryKey: ["studio", "members", "active"],
    queryFn: () => studioApi.members({ status: "active" }),
    staleTime: 60_000,
    ...options,
  })
}

export function useProjectOptions() {
  return useQuery({
    queryKey: ["projects", "options"],
    queryFn: () => projectsApi.list({ limit: 100, sort: "code" }),
    staleTime: 60_000,
    select: (page) => page.items.map((p) => ({ value: p._id, label: `${p.code} · ${p.title}` })),
  })
}

export function useEpisodeOptions(projectId) {
  return useQuery({
    queryKey: ["episodes", "options", projectId],
    queryFn: () => episodesApi.list(projectId, { limit: 200 }),
    enabled: Boolean(projectId),
    staleTime: 60_000,
    select: (page) => page.items.map((e) => ({ value: e._id, label: `Tập ${e.episodeNumber}: ${e.title}` })),
  })
}

export function useChannels(params = {}) {
  return useQuery({
    queryKey: ["channels", params],
    queryFn: () => channelsApi.list(params),
    staleTime: 60_000,
  })
}
