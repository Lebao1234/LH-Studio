import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery } from "@tanstack/react-query"
import { Link, useNavigate, useSearchParams } from "react-router"
import { AlertCircleIcon, LockIcon, MailIcon, UserIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Field, TextField } from "@/components/shared/FormField"
import { authApi } from "@/lib/api/auth.api"
import { applyFieldErrors, getErrorMessage } from "@/lib/api/axios"
import { useAuth } from "../auth-context"
import { AuthShell } from "../components/AuthShell"
import { PasswordInput } from "../components/PasswordInput"
import { registerSchema } from "../schemas"

export default function RegisterPage() {
  const [params] = useSearchParams()
  const inviteToken = params.get("invite") || ""
  const { register: registerAccount } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState(null)

  const status = useQuery({ queryKey: ["auth", "registration-status"], queryFn: authApi.registrationStatus, retry: false })
  const invitation = useQuery({
    queryKey: ["auth", "invitation", inviteToken],
    queryFn: () => authApi.previewInvitation(inviteToken),
    enabled: Boolean(inviteToken),
    retry: false,
  })

  const mode = inviteToken ? "invite" : status.data?.bootstrapAvailable ? "bootstrap" : "standard"

  const form = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "", mode, inviteToken, bootstrapToken: "", studioName: "" },
  })
  const { errors, isSubmitting } = form.formState

  useEffect(() => form.setValue("mode", mode), [form, mode])
  useEffect(() => {
    if (invitation.data) {
      form.setValue("email", invitation.data.email)
      if (invitation.data.name) form.setValue("name", invitation.data.name)
    }
  }, [form, invitation.data])

  const onSubmit = async ({ mode: m, confirmPassword, inviteToken: inv, bootstrapToken, studioName, ...rest }) => {
    setServerError(null)
    const body = {
      ...rest,
      confirmPassword,
      ...(m === "invite" ? { inviteToken: inv } : m === "bootstrap" ? { bootstrapToken, studioName: studioName || undefined } : { studioName: studioName || undefined }),
    }
    try {
      await registerAccount(body)
      toast.success("Chào mừng bạn đến với LH Studio!")
      navigate("/dashboard", { replace: true })
    } catch (err) {
      if (!applyFieldErrors(err, form.setError)) setServerError(getErrorMessage(err, "Đăng ký thất bại."))
    }
  }

  const isLoading = status.isLoading || (Boolean(inviteToken) && invitation.isLoading)

  return (
    <AuthShell
      title={mode === "bootstrap" ? "Khởi tạo Studio" : "Tạo tài khoản mới"}
      description={
        mode === "bootstrap"
          ? "Tạo tài khoản chủ sở hữu đầu tiên bằng mã khởi tạo từ máy chủ."
          : mode === "invite"
          ? "Đăng ký tài khoản theo lời mời tham gia studio."
          : "Nhập thông tin bên dưới để đăng ký tài khoản thành viên."
      }
      footer={
        <>
          Đã có tài khoản?{" "}
          <Link to="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
            Đăng nhập
          </Link>
        </>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground" role="status">
          <Spinner /> Đang kiểm tra trạng thái đăng ký...
        </div>
      ) : inviteToken && invitation.isError ? (
        <div role="alert" className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
          {getErrorMessage(invitation.error, "Lời mời không hợp lệ hoặc đã hết hạn.")}
        </div>
      ) : (
        <form className="grid gap-3.5" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          {serverError && (
            <div role="alert" className="flex items-start gap-2 rounded-xl bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
              <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          {mode === "bootstrap" && (
            <>
              <TextField form={form} name="bootstrapToken" label="Mã khởi tạo (BOOTSTRAP_TOKEN)" placeholder="Dán mã từ file .env máy chủ" className="[&_input]:h-10 [&_input]:rounded-xl" />
              <TextField form={form} name="studioName" label="Tên Studio" placeholder="LH Studio" className="[&_input]:h-10 [&_input]:rounded-xl" />
            </>
          )}

          <Field label="Họ và tên" error={errors.name?.message}>
            {(id) => (
              <div className="relative flex items-center">
                <UserIcon className="pointer-events-none absolute left-3.5 size-4 text-muted-foreground" />
                <Input
                  id={id}
                  placeholder="Nguyễn Văn A"
                  autoComplete="name"
                  aria-invalid={Boolean(errors.name)}
                  className="h-10 pl-10 rounded-xl"
                  {...form.register("name")}
                />
              </div>
            )}
          </Field>

          <Field label="Email" error={errors.email?.message}>
            {(id) => (
              <div>
                <div className="relative flex items-center">
                  <MailIcon className="pointer-events-none absolute left-3.5 size-4 text-muted-foreground" />
                  <Input
                    id={id}
                    type="email"
                    placeholder="m@example.com"
                    autoComplete="email"
                    disabled={mode === "invite" && Boolean(invitation.data?.email)}
                    aria-invalid={Boolean(errors.email)}
                    className="h-10 pl-10 rounded-xl"
                    {...form.register("email")}
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Chúng tôi sẽ dùng email này để liên hệ và không chia sẻ cho bất kỳ ai.
                </p>
              </div>
            )}
          </Field>

          {/* Side-by-side Password and Confirm Password matching the template image */}
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Mật khẩu" error={errors.password?.message}>
                {(id) => (
                  <PasswordInput
                    id={id}
                    icon={LockIcon}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    invalid={Boolean(errors.password)}
                    className="h-10 rounded-xl"
                    {...form.register("password")}
                  />
                )}
              </Field>

              <Field label="Xác nhận mật khẩu" error={errors.confirmPassword?.message}>
                {(id) => (
                  <PasswordInput
                    id={id}
                    icon={LockIcon}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    invalid={Boolean(errors.confirmPassword)}
                    className="h-10 rounded-xl"
                    {...form.register("confirmPassword")}
                  />
                )}
              </Field>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Mật khẩu phải có độ dài tối thiểu từ 8 ký tự.
            </p>
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting}
            className="mt-2 h-11 w-full rounded-xl font-semibold shadow-xs transition-transform active:scale-[0.99]"
          >
            {isSubmitting && <Spinner />}
            {isSubmitting ? "Đang xử lý..." : "Tạo tài khoản"}
          </Button>
        </form>
      )}
    </AuthShell>
  )
}
