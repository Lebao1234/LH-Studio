import { useState, useMemo } from "react"
import { Link } from "react-router"
import { SearchIcon, SlidersHorizontalIcon, MoreHorizontalIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { UserAvatar } from "@/components/shared/UserAvatar"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { PROJECT_STATUS } from "@/lib/constants/labels"

export function RecentProjectsTable({ projects = [] }) {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const pageSize = 6

  const filtered = useMemo(() => {
    if (!search.trim()) return projects
    const q = search.toLowerCase()
    return projects.filter(
      (p) =>
        p.title?.toLowerCase().includes(q) ||
        p.code?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
    )
  }, [projects, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  // Real progress from the list's aggregated counts: tasks first, then episodes. Null when nothing to measure.
  const getProgress = (p) => {
    if (p.tasks?.total > 0) return Math.round(((p.tasks.done ?? 0) / p.tasks.total) * 100)
    if (p.episodes?.total > 0) return Math.round(((p.episodes.completed ?? 0) / p.episodes.total) * 100)
    return null
  }

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-4">
      {/* Header with Search and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="font-heading text-base font-bold text-foreground">
            Recent Projects (Dự án sản xuất gần đây)
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Theo dõi tiến độ, hạn chót và đạo diễn phụ trách từng dự án
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex items-center">
            <SearchIcon className="absolute left-3 size-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="Tìm kiếm dự án..."
              className="h-8.5 w-44 sm:w-56 pl-8.5 rounded-xl text-xs"
            />
          </div>

          <Button variant="outline" size="sm" className="h-8.5 gap-1.5 rounded-xl text-xs">
            <SlidersHorizontalIcon className="size-3.5" />
            Filters
          </Button>
        </div>
      </div>

      {/* Modern Data Table matching reference image */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border/70 text-muted-foreground">
              <th className="pb-3 font-semibold">Project Name</th>
              <th className="pb-3 font-semibold">Client / Director</th>
              <th className="pb-3 font-semibold">Start Date</th>
              <th className="pb-3 font-semibold">Deadline</th>
              <th className="pb-3 font-semibold">Status</th>
              <th className="pb-3 font-semibold">Progress</th>
              <th className="pb-3 font-semibold text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-muted-foreground">
                  Không tìm thấy dự án nào phù hợp.
                </td>
              </tr>
            ) : (
              paginated.map((p) => {
                const progress = getProgress(p)
                const leadUser = (p.members?.find((m) => m.role === "manager") ?? p.members?.[0])?.user
                const startDate = p.startDate || p.createdAt
                const deadline = p.dueDate

                return (
                  <tr key={p._id} className="hover:bg-muted/30 transition-colors group">
                    {/* Project Name */}
                    <td className="py-3.5 font-semibold text-foreground max-w-[200px]">
                      <Link to={`/projects/${p._id}`} className="hover:underline flex flex-col">
                        <span className="truncate">{p.title}</span>
                        <span className="text-[10px] font-normal text-muted-foreground font-mono">{p.code}</span>
                      </Link>
                    </td>

                    {/* Client / Lead */}
                    <td className="py-3.5">
                      {leadUser ? (
                        <div className="flex items-center gap-2">
                          <UserAvatar user={leadUser} size="xs" />
                          <span className="truncate max-w-[120px] font-medium text-foreground">
                            {leadUser.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Chưa phân công</span>
                      )}
                    </td>

                    {/* Start Date */}
                    <td className="py-3.5 text-muted-foreground">
                      {startDate ? format(new Date(startDate), "dd/MM/yyyy", { locale: vi }) : "—"}
                    </td>

                    {/* Deadline */}
                    <td className="py-3.5 text-muted-foreground">
                      {deadline ? format(new Date(deadline), "dd/MM/yyyy", { locale: vi }) : "Chưa đặt hạn"}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5">
                      <StatusBadge map={PROJECT_STATUS} value={p.status} />
                    </td>

                    {/* Progress Bar with percentage */}
                    <td className="py-3.5 min-w-[140px]">
                      {progress === null ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                      <div className="flex items-center gap-2.5">
                        <div className="h-1.5 w-24 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-blue-600 transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="font-semibold text-foreground text-[11px] tabular-nums">
                          {progress}%
                        </span>
                      </div>
                      )}
                    </td>

                    {/* Actions button */}
                    <td className="py-3.5 text-right">
                      <Link to={`/projects/${p._id}`}>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="opacity-0 group-hover:opacity-100 transition-opacity rounded-md"
                        >
                          <MoreHorizontalIcon className="size-3.5 text-muted-foreground" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination matching reference image */}
      <div className="flex items-center justify-between pt-3 border-t border-border/50 text-xs text-muted-foreground">
        <span>
          {filtered.length === 0
            ? "0 dự án"
            : `${(page - 1) * pageSize + 1} - ${Math.min(page * pageSize, filtered.length)} of ${filtered.length} projects`}
        </span>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-xs"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-lg size-7"
          >
            <ChevronLeftIcon className="size-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon-xs"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg size-7"
          >
            <ChevronRightIcon className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}

