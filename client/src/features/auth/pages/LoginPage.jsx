import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useLocation, useNavigate } from "react-router"
import { AlertCircleIcon, LockIcon, MailIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Field } from "@/components/shared/FormField"
import { getErrorMessage } from "@/lib/api/axios"
import { useAuth } from "../auth-context"
import { AuthShell } from "../components/AuthShell"
import { PasswordInput } from "../components/PasswordInput"
import { loginSchema } from "../schemas"

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [serverError, setServerError] = useState(null)

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })
  const { errors, isSubmitting } = form.formState

  const onSubmit = async (values) => {
    setServerError(null)
    try {
      await login(values)
      navigate(location.state?.from?.pathname || "/dashboard", { replace: true })
    } catch (err) {
      setServerError(getErrorMessage(err, "Đăng nhập thất bại."))
    }
  }

  return (
    <AuthShell
      title="Đăng nhập tài khoản"
      description="Nhập email và mật khẩu bên dưới để tiếp tục"
      footer={
        <>
          Chưa có tài khoản?{" "}
          <Link to="/register" className="font-semibold text-primary underline-offset-4 hover:underline">
            Tạo tài khoản
          </Link>
        </>
      }
    >
      <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        {serverError && (
          <div role="alert" className="flex items-start gap-2 rounded-xl bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
            <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

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
                  autoFocus
                  aria-invalid={Boolean(errors.email)}
                  className="h-10.5 rounded-xl pl-10"
                  {...form.register("email")}
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Chúng tôi sẽ dùng email này để liên hệ và không chia sẻ cho bất kỳ ai.
              </p>
            </div>
          )}
        </Field>

        <Field label="Mật khẩu" error={errors.password?.message}>
          {(id) => (
            <PasswordInput
              id={id}
              icon={LockIcon}
              placeholder="••••••••"
              autoComplete="current-password"
              invalid={Boolean(errors.password)}
              className="h-10.5 rounded-xl"
              {...form.register("password")}
            />
          )}
        </Field>

        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          className="mt-2 h-11 w-full rounded-xl font-semibold shadow-xs transition-transform active:scale-[0.99]"
        >
          {isSubmitting && <Spinner />}
          {isSubmitting ? "Đang xử lý..." : "Đăng nhập"}
        </Button>
      </form>
    </AuthShell>
  )
}
