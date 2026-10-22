import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { postsApi } from "@/lib/api/posts.api"

/** Posts dated within [start, end) — `date` = publishedAt ?? scheduledAt. */
export function useCalendar({ start, end, platform, channelId }) {
  const params = { start: start.toISOString(), end: end.toISOString(), platform, channelId }
  return useQuery({
    queryKey: ["calendar", params],
    queryFn: () => postsApi.calendar(params),
    placeholderData: keepPreviousData,
    select: (items) => {
      // The API matches scheduledAt OR publishedAt in range; keep only items whose display date is in range.
      const s = start.getTime()
      const e = end.getTime()
      return items.filter((p) => {
        const t = new Date(p.date).getTime()
        return t >= s && t < e
      })
    },
  })
}
