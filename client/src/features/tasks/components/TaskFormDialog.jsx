import { useEffect, useMemo } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Field, SelectField, TextareaField, TextField } from "@/components/shared/FormField"
import { SimpleSelect } from "@/components/shared/SimpleSelect"
import { useEpisodeOptions, useProjectOptions } from "@/hooks/use-lookups"
import { applyFieldErrors, getErrorMessage } from "@/lib/api/axios"
import { options } from "@/lib/constants/labels"
import { formatDateTime, toDateInput } from "@/lib/utils/format"
import { dateForApi } from "@/features/projects/lib/project-utils"
import { useAssigneeOptions } from "../hooks/use-assignee-options"
import { useSaveTask, useTask } from "../hooks/use-tasks"
import { taskSchema } from "../schemas"
import { AssigneesEditor } from "./AssigneesEditor"
import { AssignmentManager } from "./AssignmentManager"

const NONE = "none"
const typeOptions = [{ value: NONE, label: "Không phân loại" }, ...options.taskTypes]
const TOAST_CODES = ["INVALID_ASSIGNEE", "LEAD_EXISTS", "ALREADY_ASSIGNED"]

const idOf = (v) => (v && typeof v === "object" ? v._id : v) ?? ""

const toFormValues = (t, defaults = {}) => ({
  projectId: String(idOf(t?.projectId) || defaults.projectId || ""),
  episodeId: String(idOf(t?.episodeId) || defaults.episodeId || NONE),
  title: t?.title ?? "",
  description: t?.description ?? "",
  type: t?.type ?? NONE,
  status: t?.status ?? defaults.status ?? "todo",
  priority: t?.priority ?? "medium",
  startDate: toDateInput(t?.startDate),
  dueDate: toDateInput(t?.dueDate),
  assignees: [],
})

function toPayload(v, isEdit) {
  const body = {
    episodeId: v.episodeId && v.episodeId !== NONE ? v.episodeId : null,
    title: v.title.trim(),
    description: v.description.trim(),
    type: v.type && v.type !== NONE ? v.type : null,
    status: v.status,
    priority: v.priority,
    startDate: dateForApi(v.startDate),
    dueDate: dateForApi(v.dueDate),
  }
  if (!isEdit) {
    body.projectId = v.projectId
    body.assignees = v.assignees.filter((a) => a.userId)
  }
  return body
}

/**
 * Create / edit a task.
 * - `task`: row to edit (omit to create)
 * - `projectId`: fixes the project when creating (e.g. from a project page)
 * - `defaults`: optional initial values for creation, e.g. { status: "review", episodeId }
 */
export function TaskFormDialog({ open, onOpenChange, task, projectId: fixedProjectId, defaults }) {
  const isEdit = Boolean(task?._id)
  const detail = useTask(task?._id, { enabled: open && isEdit })
  const source = isEdit ? detail.data : null
  const permissions = source?.permissions ?? { canEdit: true, canManage: true }

  const form = useForm({ resolver: zodResolver(taskSchema), defaultValues: toFormValues(null) })
  const projectId = useWatch({ control: form.control, name: "projectId" })
  const projects = useProjectOptions()
  const episodes = useEpisodeOptions(open ? projectId : null)
  const assignees = useAssigneeOptions(open)
  const mutation = useSaveTask(task?._id)

  const sourceId = source?._id
  useEffect(() => {
    if (!open) return
    if (!isEdit) form.reset(toFormValues(null, { ...defaults, projectId: fixedProjectId ?? defaults?.projectId }))
    else if (source) form.reset(toFormValues(source))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEdit, sourceId])

  const projectOptions = useMemo(() => {
    const list = projects.data ?? []
    const current = source?.project ?? task?.project
    if (current?._id && !list.some((o) => o.value === String(current._id))) {
      return [...list, { value: String(current._id), label: `${current.code} · ${current.title}` }]
    }
    return list
  }, [projects.data, source, task])
  const episodeOptions = [{ value: NONE, label: "Không thuộc tập nào" }, ...(episodes.data ?? [])]

  const onSubmit = (values) =>
    mutation.mutate(toPayload(values, isEdit), {
      onSuccess: () => {
        toast.success(isEdit ? "Đã cập nhật công việc." : "Đã tạo công việc.")
        onOpenChange(false)
      },
      onError: (err) => {
        const code = err.response?.data?.code
        if (TOAST_CODES.includes(code)) toast.error(getErrorMessage(err))
        else if (code === "EPISODE_PROJECT_MISMATCH") form.setError("episodeId", { message: getErrorMessage(err) })
        else if (code === "INVALID_DATE_RANGE") form.setError("dueDate", { message: getErrorMessage(err) })
        else if (!applyFieldErrors(err, form.setError)) toast.error(getErrorMessage(err))
      },
    })

  const loadingDetail = isEdit && detail.isPending
  const projectError = form.formState.errors.projectId?.message
  const projectLocked = isEdit || Boolean(fixedProjectId)
  const readOnly = isEdit && !permissions.canEdit

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Chi tiết công việc" : "Tạo công việc"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? source
                ? `Cập nhật ${formatDateTime(source.updatedAt)}${source.createdBy?.name ? ` · Tạo bởi ${source.createdBy.name}` : ""}`
                : task.title
              : "Giao việc cho một hoặc nhiều người, tối đa một người phụ trách chính."}
          </DialogDescription>
        </DialogHeader>

        {isEdit && detail.isError ? (
          <p className="text-sm text-destructive">{getErrorMessage(detail.error)}</p>
        ) : loadingDetail ? (
          <div className="grid gap-3">
            <Skeleton className="h-8" />
            <Skeleton className="h-8" />
            <Skeleton className="h-24" />
          </div>
        ) : (
          <>
            <form id="task-form" className="grid gap-3 sm:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)} noValidate>
              <Field label="Dự án" required error={projectError}>
                {(id) => (
                  <Controller
                    control={form.control}
                    name="projectId"
                    render={({ field }) => (
                      <SimpleSelect
                        id={id}
                        value={field.value}
                        onChange={(v) => {
                          field.onChange(v)
                          form.setValue("episodeId", NONE)
                        }}
                        options={projectOptions}
                        placeholder={projects.isPending ? "Đang tải..." : "Chọn dự án"}
                        disabled={projectLocked || readOnly}
                        aria-invalid={Boolean(projectError)}
                      />
                    )}
                  />
                )}
              </Field>
              <SelectField
                form={form}
                name="episodeId"
                label="Tập phim"
                options={episodeOptions}
                disabled={!projectId || readOnly}
                placeholder={projectId ? "Chọn tập" : "Chọn dự án trước"}
              />
              <TextField form={form} name="title" label="Tiêu đề" required autoComplete="off" className="sm:col-span-2" disabled={readOnly} />
              <TextareaField form={form} name="description" label="Mô tả" rows={3} className="sm:col-span-2" disabled={readOnly} />
              <div className="grid gap-3 sm:col-span-2 sm:grid-cols-3">
                <SelectField form={form} name="type" label="Loại" options={typeOptions} disabled={readOnly} />
                <SelectField form={form} name="status" label="Trạng thái" options={options.taskStatus} disabled={readOnly} />
                <SelectField form={form} name="priority" label="Ưu tiên" options={options.priority} disabled={readOnly} />
              </div>
              <TextField form={form} name="startDate" label="Ngày bắt đầu" type="date" disabled={readOnly} />
              <TextField form={form} name="dueDate" label="Hạn chót" type="date" disabled={readOnly} />
              {!isEdit && (
                <div className="sm:col-span-2">
                  <AssigneesEditor form={form} assigneeOptions={assignees.options} loading={assignees.isLoading} />
                </div>
              )}
            </form>
            {isEdit && source && (
              <>
                <Separator />
                <AssignmentManager
                  taskId={source._id}
                  assignments={source.assignments}
                  assigneeOptions={assignees.options}
                  loading={assignees.isLoading}
                  disabled={!permissions.canManage}
                />
              </>
            )}
          </>
        )}

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            {readOnly ? "Đóng" : "Hủy"}
          </Button>
          {!readOnly && (
            <Button type="submit" size="sm" form="task-form" disabled={mutation.isPending || loadingDetail || (isEdit && detail.isError)}>
              {mutation.isPending && <Spinner />}
              {isEdit ? "Lưu" : "Tạo công việc"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
