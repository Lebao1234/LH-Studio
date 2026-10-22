import { useMutation, useQueryClient } from "@tanstack/react-query"
import { channelsApi } from "@/lib/api/posts.api"

function useInvalidateChannels() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: ["channels"] })
    // Post rows embed channel name/platform.
    qc.invalidateQueries({ queryKey: ["posts"] })
    qc.invalidateQueries({ queryKey: ["calendar"] })
  }
}

export function useSaveChannel() {
  const invalidate = useInvalidateChannels()
  return useMutation({
    mutationFn: ({ id, body }) => (id ? channelsApi.update(id, body) : channelsApi.create(body)),
    onSuccess: invalidate,
  })
}

export function useDeleteChannel() {
  const invalidate = useInvalidateChannels()
  return useMutation({
    mutationFn: (id) => channelsApi.remove(id),
    onSuccess: invalidate,
  })
}
