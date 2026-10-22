import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { postsApi } from "@/lib/api/posts.api"

export const postIdOf = (p) => p?._id ?? p?.id

export function usePosts(params) {
  return useQuery({
    queryKey: ["posts", params],
    queryFn: () => postsApi.list(params),
    placeholderData: keepPreviousData,
  })
}

export function usePost(id, options = {}) {
  return useQuery({
    queryKey: ["post", id],
    queryFn: () => postsApi.get(id),
    enabled: Boolean(id),
    ...options,
  })
}

export function usePostMetrics(id) {
  return useQuery({
    queryKey: ["post-metrics", id],
    queryFn: () => postsApi.metrics(id),
    enabled: Boolean(id),
  })
}

/** Everything that shows post data: lists, calendar, dashboard tiles. */
export function useInvalidatePosts() {
  const qc = useQueryClient()
  return (id) => {
    qc.invalidateQueries({ queryKey: ["posts"] })
    qc.invalidateQueries({ queryKey: ["calendar"] })
    qc.invalidateQueries({ queryKey: ["dashboard"] })
    qc.invalidateQueries({ queryKey: ["channels"] }) // postCounts
    if (id) qc.invalidateQueries({ queryKey: ["post", id] })
  }
}

export function useSavePost() {
  const invalidate = useInvalidatePosts()
  return useMutation({
    mutationFn: ({ id, body }) => (id ? postsApi.update(id, body) : postsApi.create(body)),
    onSuccess: (_data, { id }) => invalidate(id),
  })
}

/** Manual "Đánh dấu đã đăng": the server fills publishedAt / publishedBy. */
export function useMarkPublished() {
  const invalidate = useInvalidatePosts()
  return useMutation({
    mutationFn: (id) => postsApi.update(id, { status: "published" }),
    onSuccess: (_data, id) => invalidate(id),
  })
}

export function useDeletePost() {
  const invalidate = useInvalidatePosts()
  return useMutation({
    mutationFn: (id) => postsApi.remove(id),
    onSuccess: (_data, id) => invalidate(id),
  })
}

export function useAddMetric(postId) {
  const qc = useQueryClient()
  const invalidate = useInvalidatePosts()
  return useMutation({
    mutationFn: (body) => postsApi.addMetric(postId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["post-metrics", postId] })
      invalidate(postId) // latestMetric on rows
    },
  })
}
