import { Navigate, Outlet, useLocation } from "react-router"
import { Spinner } from "@/components/ui/spinner"
import { useAuth, usePermissions } from "@/features/auth/auth-context"
import { ErrorState } from "@/components/shared/ErrorState"
import PendingApprovalPage from "@/features/auth/pages/PendingApprovalPage"

function FullScreenLoader() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background text-muted-foreground">
      <Spinner className="size-6" />
    </div>
  )
}

export function ProtectedRoute() {
  const { status, membershipStatus } = useAuth()
  const location = useLocation()
  if (status === "loading") return <FullScreenLoader />
  if (status !== "authenticated") return <Navigate to="/login" replace state={{ from: location }} />
  if (membershipStatus === "pending") return <PendingApprovalPage />
  return <Outlet />
}

export function GuestRoute() {
  const { status } = useAuth()
  if (status === "loading") return <FullScreenLoader />
  if (status === "authenticated") return <Navigate to="/dashboard" replace />
  return <Outlet />
}

/** Hides a page from roles that may not use it (the API enforces the same rule). */
export function RequirePermission({ permission, children }) {
  const perms = usePermissions()
  if (!perms[permission]) {
    return (
      <ErrorState
        title="Không có quyền truy cập"
        description="Trang này chỉ dành cho chủ sở hữu và quản trị viên studio."
      />
    )
  }
  return children
}
