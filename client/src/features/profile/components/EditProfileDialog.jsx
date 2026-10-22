import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { KeyRoundIcon, UserIcon, PhoneIcon, ImageIcon } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { authApi } from "@/lib/api/auth.api"
import { getErrorMessage } from "@/lib/api/axios"
import { useAuth } from "@/features/auth/auth-context"
import { ChangePasswordDialog } from "@/features/auth/components/ChangePasswordDialog"

export function EditProfileDialog({ open, onOpenChange }) {
  const { user, reloadMe } = useAuth()
  const [pwOpen, setPwOpen] = useState(false)
  const [serverError, setServerError] = useState(null)

  const form = useForm({
    defaultValues: {
      name: user?.name || "",
      phone: user?.phone || "",
      avatarUrl: user?.avatarUrl || "",
    },
  })
  const { register, handleSubmit, formState: { isSubmitting } } = form

  const onSubmit = async (values) => {
    setServerError(null)
    try {
      await authApi.updateProfile({
        name: values.name.trim(),
        phone: values.phone?.trim() || undefined,
        avatarUrl: values.avatarUrl?.trim() || undefined,
      })
      await reloadMe()
      toast.success("Đã cập nhật hồ sơ thành công!")
      onOpenChange(false)
    } catch (err) {
      setServerError(getErrorMessage(err, "Không thể cập nhật hồ sơ."))
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Chỉnh sửa hồ sơ</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin cá nhân của bạn trong hệ thống LH Studio.
            </DialogDescription>
          </DialogHeader>

          {serverError && (
            <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="prof-name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Họ và tên
              </Label>
              <div className="relative flex items-center">
                <UserIcon className="absolute left-3 size-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="prof-name"
                  className="pl-9 h-10 rounded-xl"
                  placeholder="Họ và tên của bạn"
                  {...register("name", { required: true })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="prof-phone" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Số điện thoại
              </Label>
              <div className="relative flex items-center">
                <PhoneIcon className="absolute left-3 size-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="prof-phone"
                  className="pl-9 h-10 rounded-xl"
                  placeholder="0987 654 321"
                  {...register("phone")}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="prof-avatar" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                URL Ảnh đại diện
              </Label>
              <div className="relative flex items-center">
                <ImageIcon className="absolute left-3 size-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="prof-avatar"
                  className="pl-9 h-10 rounded-xl"
                  placeholder="https://example.com/avatar.jpg"
                  {...register("avatarUrl")}
                />
              </div>
            </div>

            <div className="pt-2 border-t border-border/60">
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start gap-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground"
                onClick={() => setPwOpen(true)}
              >
                <KeyRoundIcon className="size-3.5" /> Đổi mật khẩu tài khoản
              </Button>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button type="button" variant="ghost" className="rounded-xl" onClick={() => onOpenChange(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting} className="rounded-xl font-semibold">
                {isSubmitting && <Spinner />}
                {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ChangePasswordDialog open={pwOpen} onOpenChange={setPwOpen} />
    </>
  )
}

