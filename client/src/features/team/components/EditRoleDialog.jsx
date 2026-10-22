import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { SelectField } from "@/components/shared/FormField"
import { UserCell } from "@/components/shared/UserAvatar"
import { usePermissions } from "@/features/auth/auth-context"
import { options } from "@/lib/constants/labels"
import { assignableRoles } from "../permissions"
import { memberRoleSchema } from "../schemas"
import { useUpdateMember } from "../hooks/use-team"

/** Mount with a `key` per member so the form starts from that member's role. */
function EditRoleForm({ member, onClose }) {
  const { isOwner, userId } = usePermissions()
  const form = useForm({ resolver: zodResolver(memberRoleSchema), defaultValues: { role: member.role } })

  const mutation = useUpdateMember({
    onSuccess: () => {
      toast.success("Đã cập nhật vai trò.")
      onClose()
    },
  })

  const isSelf = String(member.userId ?? member.user?._id) === String(userId)
  const roleOptions = assignableRoles(options.studioRoles, isOwner)

  const submit = form.handleSubmit(({ role }) => {
    if (role === member.role) return onClose()
    mutation.mutate({ id: member._id, role })
  })

  return (
    <>
      <UserCell user={member.user} subtitle={member.user?.email} />
      <form id="edit-member-role" className="grid gap-3" onSubmit={submit} noValidate>
        <SelectField
          form={form}
          name="role"
          label="Vai trò"
          required
          options={roleOptions}
          hint={isSelf ? "Bạn đang đổi vai trò của chính mình và có thể mất quyền quản lý đội ngũ." : undefined}
        />
      </form>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Hủy
        </Button>
        <Button type="submit" form="edit-member-role" disabled={mutation.isPending}>
          {mutation.isPending && <Spinner />}
          Lưu
        </Button>
      </DialogFooter>
    </>
  )
}

export function EditRoleDialog({ member, open, onOpenChange }) {
  return (
    <Dialog open={open && Boolean(member)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Đổi vai trò</DialogTitle>
          <DialogDescription>Vai trò quyết định quyền truy cập trong studio.</DialogDescription>
        </DialogHeader>
        {member && <EditRoleForm key={member._id} member={member} onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}
