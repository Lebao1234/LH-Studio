import { useState } from "react"
import { CheckIcon, CopyIcon, FilmIcon, ImageIcon, PencilIcon, VideoIcon, XIcon } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { UserAvatar } from "@/components/shared/UserAvatar"
import { EPISODE_STATUS } from "@/lib/constants/labels"
import { cn } from "@/lib/utils"
import { formatDate, formatDateTime } from "@/lib/utils/format"
import { useEpisode } from "../hooks/use-episodes"

/** Episode statuses are an ordered pipeline; the stepper shows where this episode is. */
const PIPELINE = Object.keys(EPISODE_STATUS)

const isOverdue = (e) => Boolean(e?.dueDate) && new Date(e.dueDate) < new Date() && e.status !== "completed"

function Detail({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 text-sm">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right">{children}</dd>
    </div>
  )
}

function PipelineSteps({ status }) {
  const current = Math.max(0, PIPELINE.indexOf(status))
  return (
    <ol className="grid gap-0.5" aria-label="Tiến trình sản xuất">
      {PIPELINE.map((key, i) => {
        const done = i < current || status === "completed"
        const active = i === current && status !== "completed"
        return (
          <li key={key} className="flex items-center gap-3 py-1.5 text-sm" aria-current={active ? "step" : undefined}>
            <span
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-medium ring-1",
                done && "bg-primary text-primary-foreground ring-primary",
                active && "bg-primary/15 text-primary ring-primary",
                !done && !active && "text-muted-foreground ring-foreground/15",
              )}
            >
              {done ? <CheckIcon className="size-3" aria-hidden /> : i + 1}
            </span>
            <span className={cn(active ? "font-medium text-foreground" : done ? "text-foreground/80" : "text-muted-foreground")}>
              {EPISODE_STATUS[key].label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

function Media({ episode }) {
  const [mode, setMode] = useState(episode.videoUrl && !episode.coverUrl ? "video" : "cover")
  const hasBoth = Boolean(episode.coverUrl && episode.videoUrl)

  return (
    <div className="grid gap-2">
      <div className="relative aspect-video overflow-hidden rounded-xl bg-muted ring-1 ring-foreground/10">
        {mode === "video" && episode.videoUrl ? (
          <video src={episode.videoUrl} poster={episode.coverUrl || undefined} controls className="size-full bg-black object-contain" />
        ) : episode.coverUrl ? (
          <img src={episode.coverUrl} alt={`Ảnh bìa ${episode.title}`} className="size-full object-cover" />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-2 p-6 text-center text-muted-foreground">
            <FilmIcon className="size-8" aria-hidden />
            <p className="text-sm">Tập này chưa có ảnh bìa hay video.</p>
          </div>
        )}
      </div>
      {hasBoth && (
        <div className="inline-flex w-fit rounded-lg bg-muted p-0.5" role="group" aria-label="Chọn nội dung xem">
          {[
            { id: "cover", label: "Ảnh bìa", icon: ImageIcon },
            { id: "video", label: "Video", icon: VideoIcon },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              aria-pressed={mode === id}
              onClick={() => setMode(id)}
              className={cn(
                "inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                mode === id ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-3.5" aria-hidden /> {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function BodySkeleton() {
  return (
    <div className="grid gap-6 p-6 md:grid-cols-[minmax(0,1fr)_17rem]" aria-busy="true">
      <div className="grid content-start gap-4">
        <Skeleton className="aspect-video w-full rounded-xl" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="grid content-start gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-5 w-full" />
        ))}
      </div>
    </div>
  )
}

export function EpisodeDetailDialog({ open, onOpenChange, episodeId, projectCode, canEdit, onEdit }) {
  const [tab, setTab] = useState("overview")
  const { data: episode, isPending, isError, refetch } = useEpisode(episodeId, { enabled: Boolean(open && episodeId) })

  const epCode =
    episode?.code ||
    (projectCode && episode?.episodeNumber !== undefined ? `${projectCode}-E${String(episode.episodeNumber).padStart(2, "0")}` : null)

  const copy = async (text, message) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(message)
    } catch {
      toast.error("Trình duyệt chặn sao chép.")
    }
  }

  const edit = () => {
    onOpenChange(false)
    onEdit?.(episode)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) setTab("overview")
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[min(90dvh,860px)] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl"
      >
        {/* Header stays put; only the body scrolls, so the scrollbar stays inside the rounded frame. */}
        <div className="flex items-start justify-between gap-4 border-b border-foreground/8 px-6 pt-5 pb-4">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
              {isPending ? <Skeleton className="h-3 w-28" /> : epCode ?? `Tập ${episode?.episodeNumber ?? ""}`}
              {epCode && (
                <button
                  type="button"
                  onClick={() => copy(epCode, "Đã sao chép mã tập.")}
                  className="rounded p-0.5 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Sao chép mã tập"
                >
                  <CopyIcon className="size-3" aria-hidden />
                </button>
              )}
            </p>
            <DialogTitle className="mt-1 font-heading text-xl leading-snug font-semibold break-words">
              {isPending ? <Skeleton className="h-6 w-64" /> : episode?.title ?? "Chi tiết tập phim"}
            </DialogTitle>
            <DialogDescription className="sr-only">Thông tin, kịch bản và lịch sử của tập phim.</DialogDescription>
            {episode && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <StatusBadge map={EPISODE_STATUS} value={episode.status} />
                <span className="text-xs text-muted-foreground">Tập {episode.episodeNumber}</span>
              </div>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {canEdit && episode && (
              <Button variant="outline" size="sm" onClick={edit}>
                <PencilIcon /> Sửa tập
              </Button>
            )}
            <Button variant="ghost" size="icon-sm" aria-label="Đóng" onClick={() => onOpenChange(false)}>
              <XIcon />
            </Button>
          </div>
        </div>

        {isPending ? (
          <BodySkeleton />
        ) : isError || !episode ? (
          <div className="grid justify-items-center gap-3 p-12 text-center">
            <p className="text-sm text-muted-foreground">Không tải được thông tin tập phim.</p>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              Thử lại
            </Button>
          </div>
        ) : (
          <Tabs value={tab} onValueChange={setTab} className="min-h-0 flex-1 gap-0">
            <div className="border-b border-foreground/8 px-6">
              <TabsList variant="line">
                <TabsTrigger value="overview" className="px-3 after:bg-primary">Tổng quan</TabsTrigger>
                <TabsTrigger value="script" className="px-3 after:bg-primary">Kịch bản</TabsTrigger>
                <TabsTrigger value="history" className="px-3 after:bg-primary">Lịch sử</TabsTrigger>
              </TabsList>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              <TabsContent value="overview" className="grid gap-6 p-6 md:grid-cols-[minmax(0,1fr)_17rem]">
                <div className="grid content-start gap-5">
                  <Media key={episode._id} episode={episode} />
                  <section>
                    <h3 className="font-heading text-sm font-semibold">Mô tả</h3>
                    <p className="mt-1.5 max-w-[70ch] text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
                      {episode.description || "Chưa có tóm tắt nội dung cho tập này."}
                    </p>
                  </section>
                </div>

                <div className="grid content-start gap-5">
                  <dl className="divide-y divide-foreground/8">
                    <Detail label="Phụ trách">
                      {episode.assignedTo ? (
                        <span className="inline-flex items-center gap-2">
                          <UserAvatar user={episode.assignedTo} size="sm" />
                          <span className="truncate">{episode.assignedTo.name}</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Chưa giao</span>
                      )}
                    </Detail>
                    <Detail label="Bắt đầu">{formatDate(episode.startDate)}</Detail>
                    <Detail label="Hạn chót">
                      <span className={cn(isOverdue(episode) && "font-medium text-destructive")}>
                        {formatDate(episode.dueDate)}
                        {isOverdue(episode) && ", quá hạn"}
                      </span>
                    </Detail>
                    {episode.completedAt && <Detail label="Hoàn thành">{formatDate(episode.completedAt)}</Detail>}
                    {episode.tasks && (
                      <Detail label="Công việc">
                        <span className="tabular">
                          {episode.tasks.open ?? 0} đang mở / {episode.tasks.total ?? 0}
                        </span>
                      </Detail>
                    )}
                  </dl>

                  <section>
                    <h3 className="mb-1.5 font-heading text-sm font-semibold">Tiến trình</h3>
                    <PipelineSteps status={episode.status} />
                  </section>
                </div>
              </TabsContent>

              <TabsContent value="script" className="p-6">
                {episode.script ? (
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-muted-foreground">Phân cảnh và lời thoại của tập.</p>
                      <Button variant="outline" size="sm" onClick={() => copy(episode.script, "Đã sao chép kịch bản.")}>
                        <CopyIcon /> Sao chép
                      </Button>
                    </div>
                    <pre className="max-w-none overflow-x-auto rounded-xl bg-muted/60 p-5 font-mono text-[13px] leading-relaxed whitespace-pre-wrap ring-1 ring-foreground/8">
                      {episode.script}
                    </pre>
                  </div>
                ) : (
                  <div className="grid justify-items-center gap-3 py-12 text-center">
                    <p className="text-sm text-muted-foreground">Tập này chưa có kịch bản.</p>
                    {canEdit && (
                      <Button size="sm" variant="outline" onClick={edit}>
                        <PencilIcon /> Thêm kịch bản
                      </Button>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="history" className="p-6">
                <ol className="grid max-w-md gap-4 border-l border-foreground/12 pl-5">
                  {[
                    episode.completedAt && { at: episode.completedAt, label: "Hoàn thành tập phim" },
                    { at: episode.updatedAt, label: "Cập nhật gần nhất" },
                    { at: episode.createdAt, label: "Tạo tập phim" },
                  ]
                    .filter(Boolean)
                    .map((e) => (
                      <li key={e.label} className="relative">
                        <span className="absolute top-1.5 -left-[25px] size-2.5 rounded-full bg-primary ring-4 ring-popover" aria-hidden />
                        <p className="text-sm font-medium">{e.label}</p>
                        <p className="tabular text-xs text-muted-foreground">{formatDateTime(e.at)}</p>
                      </li>
                    ))}
                </ol>
              </TabsContent>
            </div>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}
