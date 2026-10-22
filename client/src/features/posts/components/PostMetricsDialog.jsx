import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { BarChart3Icon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EmptyState } from "@/components/shared/EmptyState"
import { ErrorState } from "@/components/shared/ErrorState"
import { TextField } from "@/components/shared/FormField"
import { usePermissions } from "@/features/auth/auth-context"
import { applyFieldErrors, getErrorMessage } from "@/lib/api/axios"
import { formatCompactNumber, formatDateTime, formatNumber, fromDateInput, toDateTimeInput } from "@/lib/utils/format"
import { metricSchema } from "../schemas"
import { postIdOf, useAddMetric, usePostMetrics } from "../hooks/use-posts"
import { useStickyValue } from "../hooks/use-sticky-value"
import { MetricsChart } from "./MetricsChart"

function formatWatchTime(seconds) {
  if (seconds === null || seconds === undefined || seconds === "") return "—"
  const hours = Number(seconds) / 3600
  return `${hours.toLocaleString("vi-VN", { maximumFractionDigits: 1 })} giờ`
}

/** Snapshot history (cumulative counters) + a form to record a new one. */
export function PostMetricsDialog({ open, onOpenChange, post: postProp }) {
  const post = useStickyValue(open, postProp)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3Icon className="size-4 text-muted-foreground" /> Số liệu bài viết
          </DialogTitle>
          <DialogDescription className="truncate">{post?.title}</DialogDescription>
        </DialogHeader>
        {post && <MetricsBody postId={postIdOf(post)} />}
      </DialogContent>
    </Dialog>
  )
}

function MetricsBody({ postId }) {
  const { canWrite } = usePermissions()
  const query = usePostMetrics(postId)

  if (query.error) return <ErrorState error={query.error} onRetry={query.refetch} />
  if (query.isLoading) {
    return (
      <div className="grid gap-2" aria-busy="true">
        <Skeleton className="h-28" />
        <Skeleton className="h-8" />
        <Skeleton className="h-8" />
      </div>
    )
  }

  const metrics = query.data ?? []
  return (
    <div className="grid gap-4">
      <p className="text-xs text-muted-foreground">
        Mỗi lần ghi nhận là số liệu <span className="text-foreground">tích lũy</span> tại thời điểm đó (nhập tay từ trang thống kê của nền tảng).
      </p>
      <MetricsChart metrics={metrics} />
      {canWrite && <MetricForm postId={postId} latest={metrics[0]} />}
      <MetricsHistory metrics={metrics} />
    </div>
  )
}

function MetricsHistory({ metrics }) {
  if (!metrics.length) {
    return <EmptyState icon={BarChart3Icon} title="Chưa có số liệu" description="Ghi nhận lượt xem, lượt thích… sau khi bài đã đăng." className="py-6" />
  }
  return (
    <div className="overflow-hidden rounded-lg ring-1 ring-foreground/10">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {["Thời điểm", "Lượt xem", "Thích", "Bình luận", "Chia sẻ", "Thời gian xem"].map((h, i) => (
              <TableHead key={h} className={`h-8 px-3 text-xs text-muted-foreground ${i > 0 ? "text-right" : ""} ${i > 3 ? "hidden sm:table-cell" : ""}`}>
                {h}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {metrics.map((m) => (
            <TableRow key={m._id}>
              <TableCell className="px-3 py-2 text-xs">
                {formatDateTime(m.recordedAt)}
                {m.recordedBy?.name && <span className="block text-muted-foreground">{m.recordedBy.name}</span>}
              </TableCell>
              <TableCell className="tabular px-3 py-2 text-right text-xs font-medium" title={formatNumber(m.views)}>
                {formatNumber(m.views)}
              </TableCell>
              <TableCell className="tabular px-3 py-2 text-right text-xs" title={formatNumber(m.likes)}>
                {formatCompactNumber(m.likes)}
              </TableCell>
              <TableCell className="tabular px-3 py-2 text-right text-xs">{m.comments != null ? formatCompactNumber(m.comments) : "—"}</TableCell>
              <TableCell className="tabular hidden px-3 py-2 text-right text-xs sm:table-cell">
                {m.shares != null ? formatCompactNumber(m.shares) : "—"}
              </TableCell>
              <TableCell className="tabular hidden px-3 py-2 text-right text-xs sm:table-cell">{formatWatchTime(m.watchTimeSeconds)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

const hoursOf = (seconds) => (seconds ? String(Math.round((Number(seconds) / 3600) * 100) / 100) : "")

function MetricForm({ postId, latest }) {
  const form = useForm({
    resolver: zodResolver(metricSchema),
    defaultValues: {
      recordedAt: toDateTimeInput(new Date()),
      views: latest?.views ?? "",
      likes: latest?.likes ?? "",
      comments: latest?.comments ?? "",
      shares: latest?.shares ?? "",
      watchTimeHours: hoursOf(latest?.watchTimeSeconds),
    },
  })
  const mutation = useAddMetric(postId)

  const onSubmit = (v) => {
    const body = { views: v.views, likes: v.likes }
    const recordedAt = fromDateInput(v.recordedAt)
    if (recordedAt) body.recordedAt = recordedAt
    if (v.comments !== "") body.comments = v.comments
    if (v.shares !== "") body.shares = v.shares
    if (v.watchTimeHours !== "") body.watchTimeSeconds = Math.round(Number(v.watchTimeHours.replace(",", ".")) * 3600)
    mutation.mutate(body, {
      onSuccess: () => {
        toast.success("Đã ghi nhận số liệu.")
        form.reset({ ...v, recordedAt: toDateTimeInput(new Date()) })
      },
      onError: (err) => {
        const data = err.response?.data
        if (data?.code === "METRIC_IN_FUTURE") form.setError("recordedAt", { message: data.message })
        else if (!applyFieldErrors(err, (path, e) => form.setError(path === "watchTimeSeconds" ? "watchTimeHours" : path, e)))
          toast.error(getErrorMessage(err))
      },
    })
  }

  const num = (name, label, required) => (
    <TextField form={form} name={name} label={label} required={required} inputMode="numeric" autoComplete="off" className="tabular" />
  )

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="grid gap-3 rounded-lg bg-muted/40 p-3 ring-1 ring-foreground/8">
      <p className="text-xs font-medium">Ghi nhận số liệu mới</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <TextField form={form} name="recordedAt" label="Thời điểm" type="datetime-local" className="col-span-2 sm:col-span-1" />
        {num("views", "Lượt xem", true)}
        {num("likes", "Lượt thích", true)}
        {num("comments", "Bình luận")}
        {num("shares", "Chia sẻ")}
        <TextField form={form} name="watchTimeHours" label="Thời gian xem (giờ)" inputMode="decimal" autoComplete="off" />
      </div>
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={mutation.isPending}>
          {mutation.isPending && <Spinner />}
          Ghi nhận
        </Button>
      </div>
    </form>
  )
}
