import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { LockIcon, LockOpenIcon, SparklesIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { SelectField, TextareaField, TextField } from "@/components/shared/FormField"
import { FileUpload } from "@/components/shared/FileUpload"
import { applyFieldErrors, getErrorMessage } from "@/lib/api/axios"
import { projectsApi } from "@/lib/api/projects.api"
import { options } from "@/lib/constants/labels"
import { cn } from "@/lib/utils"
import { toDateInput } from "@/lib/utils/format"
import { dateForApi } from "@/features/projects/lib/project-utils"
import { useSaveProject } from "../hooks/use-projects"
import { projectSchema } from "../schemas"

const NONE = "none"
const priorityOptions = [{ value: NONE, label: "Không đặt" }, ...options.projectPriority]

const getFallbackCode = (cat = "KID") => {
  const now = new Date()
  const dd = String(now.getDate()).padStart(2, "0")
  const mm = String(now.getMonth() + 1).padStart(2, "0")
  return `${cat}-${dd}${mm}001`
}

const toFormValues = (p) => {
  const category = p?.category ?? (p?.code?.includes("-") ? p.code.split("-")[0] : "KID")
  return {
    category,
    code: p?.code ?? (p ? "" : getFallbackCode(category)),
    title: p?.title ?? "",
    description: p?.description ?? "",
    coverUrl: p?.coverUrl ?? "",
    status: p?.status ?? "planning",
    priority: p?.priority ?? NONE,
    startDate: toDateInput(p?.startDate),
    dueDate: toDateInput(p?.dueDate),
  }
}

const toPayload = (v) => ({
  category: v.category || "KID",
  code: v.code.trim().toUpperCase(),
  title: v.title.trim(),
  description: v.description.trim(),
  coverUrl: v.coverUrl.trim(),
  status: v.status,
  priority: v.priority && v.priority !== NONE ? v.priority : null,
  startDate: dateForApi(v.startDate),
  dueDate: dateForApi(v.dueDate),
})

/** Create (no `project`) or edit a project. `onSaved(project)` fires after success. */
export function ProjectFormDialog({ open, onOpenChange, project, onSaved }) {
  const isEdit = Boolean(project?._id)
  const form = useForm({ resolver: zodResolver(projectSchema), defaultValues: toFormValues(project) })
  const mutation = useSaveProject(project?._id)
  const [isCustomCode, setIsCustomCode] = useState(false)
  const [generatingCode, setGeneratingCode] = useState(false)

  const handleGenerateCode = async (category) => {
    const cat = category || form.getValues("category") || "KID"
    setGeneratingCode(true)
    try {
      const res = await projectsApi.nextCode(cat)
      // `res` is unwrapped by unwrap helper to { code, prefix, sequence }
      const nextCode = res?.code || res?.data?.code || (typeof res === "string" ? res : null)
      if (nextCode) {
        form.setValue("code", nextCode, { shouldValidate: true, shouldDirty: true })
      } else {
        throw new Error("Invalid code format")
      }
    } catch {
      // Fallback nếu API có lỗi hoặc offline
      form.setValue("code", getFallbackCode(cat), { shouldValidate: true, shouldDirty: true })
    } finally {
      setGeneratingCode(false)
    }
  }

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      const vals = toFormValues(project)
      form.reset(vals)
      setIsCustomCode(false)
      if (!isEdit && !project?.code) {
        handleGenerateCode(vals.category)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const currentCategory = form.watch("category") || "KID"
  const prevCategoryRef = useRef(currentCategory)

  // Auto-generate code when category changes in create mode
  useEffect(() => {
    if (open && !isEdit && !isCustomCode && prevCategoryRef.current !== currentCategory) {
      prevCategoryRef.current = currentCategory
      handleGenerateCode(currentCategory)
    } else {
      prevCategoryRef.current = currentCategory
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCategory, open, isEdit, isCustomCode])

  const onSubmit = (values) =>
    mutation.mutate(toPayload(values), {
      onSuccess: (saved) => {
        toast.success(isEdit ? "Đã cập nhật dự án." : "Đã tạo dự án.")
        onOpenChange(false)
        onSaved?.(saved)
      },
      onError: (err) => {
        if (err.response?.data?.code === "DUPLICATE_KEY") {
          form.setError("code", { message: "Mã dự án đã tồn tại trong studio." })
        } else if (err.response?.data?.code === "INVALID_DATE_RANGE") {
          form.setError("dueDate", { message: getErrorMessage(err) })
        } else if (!applyFieldErrors(err, form.setError)) toast.error(getErrorMessage(err))
      },
    })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Sửa dự án" : "Tạo dự án"}</DialogTitle>
          <DialogDescription>{isEdit ? project.title : "Dự án mới với mã chuẩn hóa theo thể loại."}</DialogDescription>
        </DialogHeader>
        <form id="project-form" className="grid gap-3 sm:grid-cols-3" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          {/* Thể loại & Mã chuẩn hóa */}
          <div className="sm:col-span-1">
            <SelectField
              form={form}
              name="category"
              label="Thể loại"
              options={options.projectCategories}
              onChange={(val) => {
                form.setValue("category", val)
                if (!isCustomCode && !isEdit) {
                  handleGenerateCode(val)
                }
              }}
            />
          </div>

          <div className="sm:col-span-2">
            <div className="flex items-center justify-between pb-1.5">
              <label className="text-xs font-medium text-foreground">
                Mã dự án <span className="text-destructive">*</span>
              </label>
              {!isEdit && (
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    className="h-6 px-1.5 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
                    onClick={() => handleGenerateCode(currentCategory)}
                    title="Tạo lại mã tự động"
                    disabled={generatingCode}
                  >
                    <SparklesIcon className={cn("size-3", generatingCode && "animate-spin")} />
                    <span>Sinh mã</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    className={cn(
                      "h-6 px-1.5 text-[11px] gap-1",
                      isCustomCode ? "text-amber-600 dark:text-amber-400 font-medium" : "text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => {
                      const nextMode = !isCustomCode
                      setIsCustomCode(nextMode)
                      if (!nextMode && !isEdit) {
                        handleGenerateCode(currentCategory)
                      }
                    }}
                    title={isCustomCode ? "Đang bật nhập tay tự do" : "Khóa tự động sinh"}
                  >
                    {isCustomCode ? <LockOpenIcon className="size-3 text-amber-500" /> : <LockIcon className="size-3" />}
                    <span>{isCustomCode ? "Nhập tay" : "Tự động"}</span>
                  </Button>
                </div>
              )}
            </div>
            <TextField
              form={form}
              name="code"
              placeholder={`VD: ${currentCategory}-1810001`}
              autoComplete="off"
              readOnly={!isCustomCode && !isEdit}
              className={cn("uppercase font-mono tracking-wide", !isCustomCode && !isEdit && "bg-muted/50 cursor-default")}
            />
          </div>

          <TextField form={form} name="title" label="Tên dự án" required autoComplete="off" className="sm:col-span-3" />
          <TextareaField form={form} name="description" label="Mô tả" rows={3} className="sm:col-span-3" />
          <div className="sm:col-span-3">
            <FileUpload
              label="Ảnh bìa dự án"
              type="image"
              folder="covers"
              value={form.watch("coverUrl")}
              onChange={(url) => form.setValue("coverUrl", url, { shouldValidate: true })}
              hint="Kéo thả ảnh lên hoặc dán link (tối đa 15MB)."
            />
          </div>
          <SelectField form={form} name="status" label="Trạng thái" options={options.projectStatus} className="sm:col-span-2" />
          <SelectField form={form} name="priority" label="Ưu tiên" options={priorityOptions} className="sm:col-span-1" />
          <div className="grid gap-3 sm:col-span-3 sm:grid-cols-2">
            <TextField form={form} name="startDate" label="Ngày bắt đầu" type="date" />
            <TextField form={form} name="dueDate" label="Hạn chót" type="date" />
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button type="submit" size="sm" form="project-form" disabled={mutation.isPending}>
            {mutation.isPending && <Spinner />}
            {isEdit ? "Lưu" : "Tạo dự án"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
