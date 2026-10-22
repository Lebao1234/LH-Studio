import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { projectsApi } from "@/lib/api/projects.api"

export function useProjects(params) {
  return useQuery({
    queryKey: ["projects", "list", params],
    queryFn: () => projectsApi.list(params),
    placeholderData: keepPreviousData,
  })
}

export function useProject(projectId) {
  return useQuery({
    queryKey: ["project", projectId],
    queryFn: () => projectsApi.get(projectId),
    enabled: Boolean(projectId),
    retry: (count, err) => err?.response?.status !== 404 && count < 2,
  })
}

export function useProjectMembers(projectId) {
  return useQuery({
    queryKey: ["project", projectId, "members"],
    queryFn: () => projectsApi.members(projectId),
    enabled: Boolean(projectId),
    staleTime: 30_000,
  })
}

function useInvalidateProjects() {
  const qc = useQueryClient()
  return (projectId) => {
    qc.invalidateQueries({ queryKey: ["projects"] })
    qc.invalidateQueries({ queryKey: ["dashboard"] })
    if (projectId) qc.invalidateQueries({ queryKey: ["project", projectId] })
  }
}

/** Create when `projectId` is empty, update otherwise. */
export function useSaveProject(projectId) {
  const invalidate = useInvalidateProjects()
  return useMutation({
    mutationFn: (body) => (projectId ? projectsApi.update(projectId, body) : projectsApi.create(body)),
    onSuccess: (project) => invalidate(projectId || project?._id),
  })
}

export function useDeleteProject() {
  const qc = useQueryClient()
  const invalidate = useInvalidateProjects()
  return useMutation({
    mutationFn: (projectId) => projectsApi.remove(projectId),
    onSuccess: (_data, projectId) => {
      qc.removeQueries({ queryKey: ["project", projectId] })
      invalidate()
      qc.invalidateQueries({ queryKey: ["tasks"] })
      qc.invalidateQueries({ queryKey: ["episodes"] })
    },
  })
}

export function useAddProjectMember(projectId) {
  const invalidate = useInvalidateProjects()
  return useMutation({
    mutationFn: (body) => projectsApi.addMember(projectId, body),
    onSuccess: () => invalidate(projectId),
  })
}

export function useRemoveProjectMember(projectId) {
  const invalidate = useInvalidateProjects()
  return useMutation({
    mutationFn: (userId) => projectsApi.removeMember(projectId, userId),
    onSuccess: () => invalidate(projectId),
  })
}
