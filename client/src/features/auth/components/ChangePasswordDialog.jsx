import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { Field } from "@/components/shared/FormField"
import { authApi } from "@/lib/api/auth.api"
import { applyFieldErrors, getErrorMessage } from "@/lib/api/axios"
import { changePasswordSchema } from "../schemas"
import { PasswordInput } from "./PasswordInput"

export function ChangePasswordDialog({ open, onOpenChange }) {
  const form = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  })
  const { errors } = form.formState

  const mutation = useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: () => {
      toast.success("Đã đổi mật khẩu. Các thiết bị khác đã bị đăng xuất.")
      form.reset()
      onOpenChange(false)
    },
    onError: (err) => {
      if (err.response?.data?.code === "INVALID_CURRENT_PASSWORD") {
        form.setError("currentPassword", { message: "Mật khẩu hiện tại không đúng." })
      } else if (!applyFieldErrors(err, form.setError)) toast.error(getErrorMessage(err))
    },
  })

  const pw = (name, label, autoComplete) => (
    <Field label={label} error={errors[name]?.message}>
      {(id) => <PasswordInput id={id} autoComplete={autoComplete} invalid={Boolean(errors[name])} {...form.register(name)} />}
    </Field>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Đổi mật khẩu</DialogTitle>
          <DialogDescription>Sau khi đổi, các phiên đăng nhập khác sẽ bị thu hồi.</DialogDescription>
        </DialogHeader>
        <form id="change-password" className="grid gap-3" onSubmit={form.handleSubmit((v) => mutation.mutate(v))} noValidate>
          {pw("currentPassword", "Mật khẩu hiện tại", "current-password")}
          {pw("newPassword", "Mật khẩu mới", "new-password")}
          {pw("confirmPassword", "Nhập lại mật khẩu mới", "new-password")}
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button type="submit" form="change-password" disabled={mutation.isPending}>
            {mutation.isPending && <Spinner />}
            Lưu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
