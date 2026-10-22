import { useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { SelectField } from "@/components/shared/FormField"
import { useStudioMembers } from "@/hooks/use-lookups"
import { applyFieldErrors, getErrorMessage } from "@/lib/api/axios"
import { options, STUDIO_ROLES } from "@/lib/constants/labels"
import { useAddProjectMember } from "../hooks/use-projects"
import { projectMemberSchema } from "../schemas"

export function AddProjectMemberDialog({ open, onOpenChange, projectId, existingUserIds = [] }) {
  const form = useForm({ resolver: zodResolver(projectMemberSchema), defaultValues: { userId: "", role: "member" } })
  const studioMembers = useStudioMembers({ enabled: open })
  const mutation = useAddProjectMember(projectId)

  useEffect(() => {
    if (open) form.reset({ userId: "", role: "member" })
  }, [open, form])

  const candidates = useMemo(() => {
    const taken = new Set(existingUserIds.map(String))
    return (studioMembers.data ?? [])
      .filter((m) => m.status === "active" && m.user && !taken.has(String(m.userId)))
      .map((m) => ({ value: String(m.userId), label: `${m.user.name} · ${STUDIO_ROLES[m.role]?.label ?? m.role}` }))
  }, [studioMembers.data, existingUserIds])

  const onSubmit = (values) =>
    mutation.mutate(values, {
      onSuccess: () => {
        toast.success("Đã thêm thành viên vào dự án.")
        onOpenChange(false)
      },
      onError: (err) => {
        if (!applyFieldErrors(err, form.setError)) toast.error(getErrorMessage(err))
      },
    })

  const noCandidates = studioMembers.isSuccess && candidates.length === 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thêm thành viên dự án</DialogTitle>
          <DialogDescription>Chọn từ các thành viên đang hoạt động của studio.</DialogDescription>
        </DialogHeader>
        {studioMembers.isError ? (
          <p className="text-sm text-destructive">{getErrorMessage(studioMembers.error)}</p>
        ) : noCandidates ? (
          <p className="text-sm text-muted-foreground">Tất cả thành viên studio đã có trong dự án.</p>
        ) : (
          <form id="add-project-member" className="grid gap-3" onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <SelectField
              form={form}
              name="userId"
              label="Thành viên"
              required
              options={candidates}
              placeholder={studioMembers.isPending ? "Đang tải..." : "Chọn thành viên"}
              disabled={studioMembers.isPending}
            />
            <SelectField form={form} name="role" label="Vai trò trong dự án" options={options.projectRoles} />
          </form>
        )}
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button type="submit" size="sm" form="add-project-member" disabled={mutation.isPending || noCandidates}>
            {mutation.isPending && <Spinner />}
            Thêm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
