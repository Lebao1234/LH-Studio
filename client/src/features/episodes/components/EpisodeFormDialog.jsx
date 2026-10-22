import { useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { SelectField, TextareaField, TextField } from "@/components/shared/FormField"
import { FileUpload } from "@/components/shared/FileUpload"
import { useProjectMembers } from "@/features/projects/hooks/use-projects"
import { useStudioMembers } from "@/hooks/use-lookups"
import { applyFieldErrors, getErrorMessage } from "@/lib/api/axios"
import { options } from "@/lib/constants/labels"
import { toDateInput } from "@/lib/utils/format"
import { dateForApi } from "@/features/projects/lib/project-utils"
import { useEpisode, useSaveEpisode } from "../hooks/use-episodes"
import { episodeSchema } from "../schemas"

const NONE = "none"

const toFormValues = (e) => ({
  episodeNumber: e?.episodeNumber !== undefined && e?.episodeNumber !== null ? String(e.episodeNumber) : "",
  title: e?.title ?? "",
  description: e?.description ?? "",
  script: e?.script ?? "",
  coverUrl: e?.coverUrl ?? "",
  videoUrl: e?.videoUrl ?? "",
  status: e?.status ?? "planned",
  assignedTo: e?.assignedTo?._id ?? (typeof e?.assignedTo === "string" ? e.assignedTo : NONE),
  startDate: toDateInput(e?.startDate),
  dueDate: toDateInput(e?.dueDate),
})

function toPayload(v) {
  const body = {
    title: v.title.trim(),
    description: v.description.trim(),
    script: v.script,
    coverUrl: v.coverUrl.trim(),
    videoUrl: v.videoUrl.trim(),
    status: v.status,
    assignedTo: v.assignedTo && v.assignedTo !== NONE ? v.assignedTo : null,
    startDate: dateForApi(v.startDate),
    dueDate: dateForApi(v.dueDate),
  }
  if (v.episodeNumber !== "") body.episodeNumber = Number(v.episodeNumber)
  return body
}

/** Assignable people: project members who are not studio viewers. */
function useAssigneeOptions(projectId, enabled, current) {
  const members = useProjectMembers(enabled ? projectId : null)
  const studio = useStudioMembers({ enabled })
  return useMemo(() => {
    const viewerIds = new Set((studio.data ?? []).filter((m) => m.role === "viewer").map((m) => String(m.userId)))
    const list = (members.data ?? [])
      .filter((m) => m.user && !viewerIds.has(String(m.userId)))
      .map((m) => ({ value: String(m.userId), label: m.user.name }))
    if (current?._id && !list.some((o) => o.value === String(current._id))) {
      list.push({ value: String(current._id), label: current.name ?? "Người dùng" })
    }
    return [{ value: NONE, label: "Chưa giao" }, ...list]
  }, [members.data, studio.data, current])
}

export function EpisodeFormDialog({ open, onOpenChange, projectId, projectCode, episode }) {
  const isEdit = Boolean(episode?._id)
  const detail = useEpisode(episode?._id, { enabled: open && isEdit })
  const source = isEdit ? detail.data : null
  const form = useForm({ resolver: zodResolver(episodeSchema), defaultValues: toFormValues(null) })
  const mutation = useSaveEpisode(projectId, episode?._id)
  const assigneeOptions = useAssigneeOptions(projectId, open, source?.assignedTo ?? episode?.assignedTo)

  // Create: reset on open. Edit: reset once the full episode (with script) arrives.
  const sourceId = source?._id
  useEffect(() => {
    if (!open) return
    if (!isEdit) form.reset(toFormValues(null))
    else if (source) form.reset(toFormValues(source))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEdit, sourceId])

  const onSubmit = (values) =>
    mutation.mutate(toPayload(values), {
      onSuccess: () => {
        toast.success(isEdit ? "Đã cập nhật tập phim." : "Đã tạo tập phim.")
        onOpenChange(false)
      },
      onError: (err) => {
        const code = err.response?.data?.code
        if (code === "EPISODE_NUMBER_TAKEN") form.setError("episodeNumber", { message: getErrorMessage(err) })
        else if (code === "INVALID_DATE_RANGE") form.setError("dueDate", { message: getErrorMessage(err) })
        else if (code === "INVALID_ASSIGNEE") form.setError("assignedTo", { message: getErrorMessage(err) })
        else if (!applyFieldErrors(err, form.setError)) toast.error(getErrorMessage(err))
      },
    })

  const loadingDetail = isEdit && detail.isPending
  const currentEpNum = form.watch("episodeNumber")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Sửa tập ${episode.episodeNumber}` : "Thêm tập phim"}</DialogTitle>
          <DialogDescription>{isEdit ? episode.title : "Bỏ trống số tập để tự động đánh số tiếp theo."}</DialogDescription>
        </DialogHeader>
        {isEdit && detail.isError ? (
          <p className="text-sm text-destructive">{getErrorMessage(detail.error)}</p>
        ) : loadingDetail ? (
          <div className="grid gap-3">
            <Skeleton className="h-8" />
            <Skeleton className="h-20" />
            <Skeleton className="h-32" />
          </div>
        ) : (
          <form id="episode-form" className="grid gap-3 sm:grid-cols-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
            {projectCode && (
              <div className="sm:col-span-4 flex items-center justify-between rounded-lg border border-border/70 bg-muted/30 px-3.5 py-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Mã chuẩn hóa:</span>
                  <span className="font-mono font-bold text-foreground">
                    {projectCode}-E{String(currentEpNum || "??").padStart(2, "0")}
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground italic">Tự động gắn mã theo dự án</span>
              </div>
            )}
            <TextField form={form} name="episodeNumber" label="Số tập" type="number" min={0} inputMode="numeric" placeholder="Tự động" />
            <TextField form={form} name="title" label="Tên tập" required autoComplete="off" className="sm:col-span-3" />
            <SelectField form={form} name="status" label="Trạng thái" options={options.episodeStatus} className="sm:col-span-2" />
            <SelectField form={form} name="assignedTo" label="Phụ trách" options={assigneeOptions} className="sm:col-span-2" />
            <TextField form={form} name="startDate" label="Ngày bắt đầu" type="date" className="sm:col-span-2" />
            <TextField form={form} name="dueDate" label="Hạn chót" type="date" className="sm:col-span-2" />
            <TextareaField form={form} name="description" label="Mô tả" rows={2} className="sm:col-span-4" />
            <TextareaField form={form} name="script" label="Kịch bản" rows={8} className="sm:col-span-4" />
            <div className="sm:col-span-2">
              <FileUpload
                label="Ảnh bìa tập phim"
                type="image"
                folder="covers"
                value={form.watch("coverUrl")}
                onChange={(url) => form.setValue("coverUrl", url, { shouldValidate: true })}
                hint="Kéo thả ảnh hoặc dán URL."
              />
            </div>
            <div className="sm:col-span-2">
              <FileUpload
                label="File Video tập phim"
                type="video"
                folder="videos"
                value={form.watch("videoUrl")}
                onChange={(url) => form.setValue("videoUrl", url, { shouldValidate: true })}
                hint="Tải video lên Cloudflare R2 hoặc dán URL (MP4, WebM)."
              />
            </div>
          </form>
        )}
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button type="submit" size="sm" form="episode-form" disabled={mutation.isPending || loadingDetail}>
            {mutation.isPending && <Spinner />}
            {isEdit ? "Lưu" : "Thêm tập"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
