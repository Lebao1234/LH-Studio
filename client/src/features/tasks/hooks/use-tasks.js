import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { tasksApi } from "@/lib/api/tasks.api"

export function useTasks(params) {
  return useQuery({
    queryKey: ["tasks", "list", params],
    queryFn: () => tasksApi.list(params),
    placeholderData: keepPreviousData,
  })
}

export function useTask(taskId, options = {}) {
  return useQuery({
    queryKey: ["tasks", "detail", taskId],
    queryFn: () => tasksApi.get(taskId),
    enabled: Boolean(taskId),
    ...options,
  })
}

/** Invalidates every cache a task change can affect (lists, project stats, episode counts, dashboard). */
export function useInvalidateTasks() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: ["tasks"] })
    qc.invalidateQueries({ queryKey: ["project"] })
    qc.invalidateQueries({ queryKey: ["projects"] })
    qc.invalidateQueries({ queryKey: ["episodes"] })
    qc.invalidateQueries({ queryKey: ["dashboard"] })
  }
}

export function useSaveTask(taskId) {
  const invalidate = useInvalidateTasks()
  return useMutation({
    mutationFn: (body) => (taskId ? tasksApi.update(taskId, body) : tasksApi.create(body)),
    onSuccess: invalidate,
  })
}

export function useUpdateTaskStatus() {
  const invalidate = useInvalidateTasks()
  return useMutation({
    mutationFn: ({ id, status }) => tasksApi.update(id, { status }),
    onSuccess: invalidate,
  })
}

export function useDeleteTask() {
  const invalidate = useInvalidateTasks()
  return useMutation({
    mutationFn: (taskId) => tasksApi.remove(taskId),
    onSuccess: invalidate,
  })
}

/** Immediate assignment changes for an existing task: add / setRole / remove. */
export function useAssignmentMutations(taskId) {
  const invalidate = useInvalidateTasks()
  const opts = { onSuccess: invalidate }
  return {
    add: useMutation({ mutationFn: (body) => tasksApi.assign(taskId, body), ...opts }),
    setRole: useMutation({ mutationFn: ({ userId, role }) => tasksApi.updateAssignment(taskId, userId, { role }), ...opts }),
    remove: useMutation({ mutationFn: (userId) => tasksApi.unassign(taskId, userId), ...opts }),
  }
}
