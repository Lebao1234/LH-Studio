import { useState } from "react"
import { ClockIcon, LogOutIcon, RefreshCwIcon, ShieldCheckIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { UserAvatar } from "@/components/shared/UserAvatar"
import { useAuth } from "../auth-context"

export default function PendingApprovalPage() {
  const { user, studio, reloadMe, logout } = useAuth()
  const [checking, setChecking] = useState(false)

  const handleCheckStatus = async () => {
    setChecking(true)
    try {
      await reloadMe()
      toast.info("Đã cập nhật trạng thái. Tài khoản của bạn vẫn đang chờ quản trị viên phê duyệt.")
    } catch {
      toast.error("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.")
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-muted/40 p-4 md:p-8">
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-sm md:p-8">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400">
            <ClockIcon className="size-7 animate-pulse" />
          </div>

          <h1 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">
            Tài khoản đang chờ duyệt
          </h1>

          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Yêu cầu gia nhập <b>{studio?.name || "LH Studio"}</b> của bạn đã được ghi nhận. Vui lòng chờ Quản trị viên (Admin/Owner) phê duyệt để bắt đầu làm việc.
          </p>
        </div>

        {user && (
          <div className="mt-6 flex items-center gap-3 rounded-xl border bg-muted/30 p-3.5">
            <UserAvatar user={user} className="size-10" />
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
              Chờ duyệt
            </span>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2.5">
          <Button
            onClick={handleCheckStatus}
            disabled={checking}
            variant="default"
            className="w-full gap-2"
          >
            {checking ? <Spinner className="size-4" /> : <RefreshCwIcon className="size-4" />}
            Kiểm tra trạng thái
          </Button>

          <Button
            onClick={logout}
            variant="outline"
            className="w-full gap-2 text-muted-foreground hover:text-foreground"
          >
            <LogOutIcon className="size-4" />
            Đăng xuất
          </Button>
        </div>

        <div className="mt-6 border-t pt-4 text-center">
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
            <ShieldCheckIcon className="size-3.5 text-primary" />
            Không gian làm việc bảo mật nội bộ LH Studio
          </p>
        </div>
      </div>
    </div>
  )
}

