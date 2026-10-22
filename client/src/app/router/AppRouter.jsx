import { lazy, Suspense } from "react"
import { Navigate, Route, Routes } from "react-router"
import { Skeleton } from "@/components/ui/skeleton"
import { AppLayout } from "@/app/layouts/AppLayout"
import { GuestRoute, ProtectedRoute, RequirePermission } from "./guards"
import LoginPage from "@/features/auth/pages/LoginPage"
import RegisterPage from "@/features/auth/pages/RegisterPage"

const DashboardPage = lazy(() => import("@/features/dashboard/pages/DashboardPage"))
const ProjectsPage = lazy(() => import("@/features/projects/pages/ProjectsPage"))
const ProjectDetailPage = lazy(() => import("@/features/projects/pages/ProjectDetailPage"))
const TasksPage = lazy(() => import("@/features/tasks/pages/TasksPage"))
const PostsPage = lazy(() => import("@/features/posts/pages/PostsPage"))
const CalendarPage = lazy(() => import("@/features/calendar/pages/CalendarPage"))
const TeamPage = lazy(() => import("@/features/team/pages/TeamPage"))
const FinancePage = lazy(() => import("@/features/finance/pages/FinancePage"))
const ProfilePage = lazy(() => import("@/features/profile/pages/ProfilePage"))

function PageFallback() {
  return (
    <div className="grid gap-4">
      <Skeleton className="h-8 w-56" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-72" />
    </div>
  )
}

function NotFound() {
  return (
    <div className="py-20 text-center">
      <p className="text-4xl font-semibold">404</p>
      <p className="mt-2 text-sm text-muted-foreground">Không tìm thấy trang.</p>
    </div>
  )
}

export function AppRouter() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route
          element={
            <Suspense fallback={<PageFallback />}>
              <AppLayout />
            </Suspense>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Suspense fallback={<PageFallback />}><DashboardPage /></Suspense>} />
          <Route path="/projects" element={<Suspense fallback={<PageFallback />}><ProjectsPage /></Suspense>} />
          <Route path="/projects/:projectId" element={<Suspense fallback={<PageFallback />}><ProjectDetailPage /></Suspense>} />
          <Route path="/tasks" element={<Suspense fallback={<PageFallback />}><TasksPage /></Suspense>} />
          <Route path="/posts" element={<Suspense fallback={<PageFallback />}><PostsPage /></Suspense>} />
          <Route path="/calendar" element={<Suspense fallback={<PageFallback />}><CalendarPage /></Suspense>} />
          <Route path="/team" element={<Suspense fallback={<PageFallback />}><TeamPage /></Suspense>} />
          <Route
            path="/finance"
            element={
              <RequirePermission permission="canSeeFinance">
                <Suspense fallback={<PageFallback />}>
                  <FinancePage />
                </Suspense>
              </RequirePermission>
            }
          />
          <Route path="/profile" element={<Suspense fallback={<PageFallback />}><ProfilePage /></Suspense>} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  )
}
