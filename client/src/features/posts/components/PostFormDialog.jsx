import { useMemo } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { InfoIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { ErrorState } from "@/components/shared/ErrorState"
import { Field, SelectField, TextareaField, TextField } from "@/components/shared/FormField"
import { SimpleSelect } from "@/components/shared/SimpleSelect"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { usePermissions } from "@/features/auth/auth-context"
import { useChannels, useEpisodeOptions, useProjectOptions } from "@/hooks/use-lookups"
import { applyFieldErrors, getErrorMessage } from "@/lib/api/axios"
import { PLATFORMS, POST_STATUS, options } from "@/lib/constants/labels"
import { formatDateTime } from "@/lib/utils/format"
import { NONE, createBody, postSchema, scheduleInPast, toFormValues, updateBody } from "../schemas"
import { postIdOf, usePost, useSavePost } from "../hooks/use-posts"
import { useStickyValue } from "../hooks/use-sticky-value"

const FIELD_BY_CODE = {
  SCHEDULE_REQUIRED: "scheduledAt",
  SCHEDULE_IN_PAST: "scheduledAt",
  PUBLISHED_IN_FUTURE: "publishedAt",
  EPISODE_PROJECT_MISMATCH: "episodeId",
  EPISODE_REQUIRES_PROJECT: "episodeId",
  INVALID_CHANNEL: "channelId",
  CHANNEL_INACTIVE: "channelId",
}

// Server validation paths → form field names.
const mapPath = (path) => (path.startsWith("mediaUrls") ? "mediaUrlsText" : path)

/**
 * Create / edit a post. Reused by the calendar.
 * - `post`: an existing post (list row or calendar item); the full record is re-fetched.
 * - `defaultValues`: API-shaped prefill for a new post, e.g. `{ status: "scheduled", scheduledAt: iso }`.
 * Viewers get a read-only view.
 */
export function PostFormDialog({ open, onOpenChange, post, defaultValues }) {
  const shownPost = useStickyValue(open, post)
  const shownDefaults = useStickyValue(open, defaultValues)
  const close = () => onOpenChange(false)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
        {shownPost ? (
          <EditPostLoader post={shownPost} onDone={close} />
        ) : (
          <PostForm initialPost={shownDefaults} onDone={close} />
        )}
      </DialogContent>
    </Dialog>
  )
}

function EditPostLoader({ post, onDone }) {
  // List / calendar items may omit `content`, so always load the full record.
  const query = usePost(postIdOf(post))
  if (query.error) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>Bài viết</DialogTitle>
        </DialogHeader>
        <ErrorState error={query.error} onRetry={query.refetch} />
      </>
    )
  }
  if (!query.data) {
    return (
      <div className="grid gap-3" aria-busy="true">
        <Skeleton className="h-5 w-40" />
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-8" />
          ))}
        </div>
        <Skeleton className="h-24" />
      </div>
    )
  }
  return <PostForm post={query.data} onDone={onDone} />
}

function useChannelOptions(post) {
  const query = useChannels()
  const items = useMemo(() => {
    const list = query.data ?? []
    const currentId = post?.channelId ? String(post.channelId) : null
    const opts = list
      .filter((c) => c.status === "active" || String(c._id ?? c.id) === currentId)
      .map((c) => ({
        value: String(c._id ?? c.id),
        label: `${PLATFORMS[c.platform]?.label ?? c.platform} · ${c.name}${c.status !== "active" ? " (ngừng hoạt động)" : ""}`,
      }))
    if (currentId && !opts.some((o) => o.value === currentId) && post.channel) {
      opts.push({ value: currentId, label: `${PLATFORMS[post.channel.platform]?.label ?? ""} · ${post.channel.name}` })
    }
    return opts
  }, [query.data, post])
  return { options: items, isLoading: query.isLoading }
}

function withCurrent(opts, value, label) {
  if (!value || value === NONE || opts.some((o) => o.value === value) || !label) return opts
  return [...opts, { value, label }]
}

function PostForm({ post, initialPost, onDone }) {
  const { canWrite } = usePermissions()
  const isEdit = Boolean(post)
  const readOnly = !canWrite
  const initial = useMemo(() => toFormValues(post ?? initialPost), [post, initialPost])

  const form = useForm({ resolver: zodResolver(postSchema), defaultValues: initial })
  const { errors } = form.formState
  const [status, projectId] = useWatch({ control: form.control, name: ["status", "projectId"] })

  const channels = useChannelOptions(post)
  const projectsQuery = useProjectOptions()
  const hasProject = Boolean(projectId) && projectId !== NONE
  const episodesQuery = useEpisodeOptions(hasProject ? projectId : null)

  const projectOptions = [
    { value: NONE, label: "Không gắn dự án (độc lập)" },
    ...withCurrent(projectsQuery.data ?? [], post?.projectId ? String(post.projectId) : null, post?.project && `${post.project.code} · ${post.project.title}`),
  ]
  const episodeOptions = [
    { value: NONE, label: "Không gắn tập" },
    ...withCurrent(
      episodesQuery.data ?? [],
      post?.episodeId && String(post.projectId) === projectId ? String(post.episodeId) : null,
      post?.episode && `Tập ${post.episode.episodeNumber}: ${post.episode.title}`,
    ),
  ]

  const mutation = useSavePost()

  const onSubmit = (values) => {
    if (scheduleInPast(values, isEdit ? initial : null)) {
      form.setError("scheduledAt", { message: "Thời gian lên lịch phải ở tương lai." })
      return
    }
    const body = isEdit ? updateBody(values, initial) : createBody(values)
    if (isEdit && Object.keys(body).length === 0) {
      onDone()
      return
    }
    mutation.mutate(
      { id: postIdOf(post), body },
      {
        onSuccess: () => {
          toast.success(isEdit ? "Đã cập nhật bài viết." : "Đã tạo bài viết.")
          onDone()
        },
        onError: (err) => {
          const data = err.response?.data
          const field = FIELD_BY_CODE[data?.code]
          if (field) form.setError(field, { type: "server", message: data.message })
          else if (!applyFieldErrors(err, (path, e) => form.setError(mapPath(path), e))) toast.error(getErrorMessage(err))
        },
      },
    )
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          {readOnly ? "Chi tiết bài viết" : isEdit ? "Sửa bài viết" : "Tạo bài viết"}
          {isEdit && <StatusBadge map={POST_STATUS} value={post.status} />}
        </DialogTitle>
        <DialogDescription>
          {isEdit && post.publishedAt
            ? `Đã đăng lúc ${formatDateTime(post.publishedAt)}${post.publishedBy?.name ? ` · ${post.publishedBy.name}` : ""}.`
            : "Lên kế hoạch nội dung cho kênh. Bài viết có thể gắn dự án / tập phim hoặc để độc lập."}
        </DialogDescription>
      </DialogHeader>

      <form id="post-form" className="grid gap-3 sm:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <SelectField
          form={form}
          name="channelId"
          label="Kênh"
          required
          options={channels.options}
          placeholder={channels.isLoading ? "Đang tải..." : channels.options.length ? "Chọn kênh" : "Chưa có kênh hoạt động"}
          disabled={readOnly}
        />
        <SelectField
          form={form}
          name="status"
          label="Trạng thái"
          options={options.postStatus}
          disabled={readOnly}
          hint="Hệ thống không tự đăng lên nền tảng — chọn “Đã đăng” sau khi bạn đăng thủ công."
        />

        <Field label="Dự án" error={errors.projectId?.message} hint="Không bắt buộc.">
          {(id) => (
            <Controller
              control={form.control}
              name="projectId"
              render={({ field }) => (
                <SimpleSelect
                  id={id}
                  value={field.value}
                  options={projectOptions}
                  disabled={readOnly}
                  aria-invalid={Boolean(errors.projectId)}
                  onChange={(v) => {
                    field.onChange(v || NONE)
                    form.setValue("episodeId", NONE, { shouldDirty: true })
                  }}
                />
              )}
            />
          )}
        </Field>
        {hasProject ? (
          <SelectField
            form={form}
            name="episodeId"
            label="Tập phim"
            options={episodeOptions}
            placeholder={episodesQuery.isLoading ? "Đang tải..." : "Chọn tập"}
            disabled={readOnly}
            hint="Không bắt buộc."
          />
        ) : (
          <div className="hidden sm:block" aria-hidden />
        )}

        <TextField form={form} name="title" label="Tiêu đề" required className="sm:col-span-2" autoComplete="off" disabled={readOnly} />
        <TextareaField form={form} name="content" label="Nội dung / caption" className="sm:col-span-2" rows={4} disabled={readOnly} />

        <TextField
          form={form}
          name="scheduledAt"
          label="Thời gian lên lịch"
          type="datetime-local"
          required={status === "scheduled"}
          hint={status === "draft" ? "Bản nháp có ngày sẽ hiển thị trên lịch." : undefined}
          disabled={readOnly}
        />
        {status === "published" ? (
          <TextField
            form={form}
            name="publishedAt"
            label="Thời gian đã đăng"
            type="datetime-local"
            hint="Để trống: hệ thống ghi nhận thời điểm hiện tại."
            disabled={readOnly}
          />
        ) : (
          <div className="hidden sm:block" aria-hidden />
        )}

        <TextareaField
          form={form}
          name="mediaUrlsText"
          label="Media URL"
          placeholder={"https://...\nhttps://..."}
          hint="Mỗi dòng một URL (tối đa 20)."
          className="sm:col-span-2"
          rows={3}
          disabled={readOnly}
        />
        <TextField form={form} name="externalUrl" label="URL bài đăng" placeholder="https://" inputMode="url" disabled={readOnly} />
        <TextField form={form} name="externalPostId" label="ID bài trên nền tảng" autoComplete="off" disabled={readOnly} />
      </form>

      {!readOnly && !channels.isLoading && channels.options.length === 0 && (
        <p className="flex items-center gap-1.5 text-xs text-warning">
          <InfoIcon className="size-3.5" /> Chưa có kênh đang hoạt động. Quản trị viên cần thêm kênh ở tab “Kênh”.
        </p>
      )}

      <DialogFooter>
        <Button variant="outline" size="sm" onClick={onDone}>
          {readOnly ? "Đóng" : "Hủy"}
        </Button>
        {!readOnly && (
          <Button type="submit" size="sm" form="post-form" disabled={mutation.isPending}>
            {mutation.isPending && <Spinner />}
            {isEdit ? "Lưu" : "Tạo bài viết"}
          </Button>
        )}
      </DialogFooter>
    </>
  )
}
