import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router"
import {
  ChevronRightIcon,
  ClockIcon,
  FilmIcon,
  GlobeIcon,
  ListTodoIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { UserAvatar } from "@/components/shared/UserAvatar"
import { useAuth } from "@/features/auth/auth-context"
import { projectsApi } from "@/lib/api/projects.api"
import { tasksApi } from "@/lib/api/tasks.api"
import { studioApi } from "@/lib/api/studios.api"
import { PROJECT_STATUS, TASK_STATUS, STUDIO_ROLES } from "@/lib/constants/labels"
import { EditProfileDialog } from "../components/EditProfileDialog"

export default function ProfilePage() {
  const { user, studio, role } = useAuth()
  const [activeTab, setActiveTab] = useState("overview")
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  // Sync real data from API
  const projectsQuery = useQuery({
    queryKey: ["projects", { limit: 100 }],
    queryFn: () => projectsApi.list({ limit: 100 }),
  })

  const tasksQuery = useQuery({
    queryKey: ["tasks", { limit: 100 }],
    queryFn: () => tasksApi.list({ limit: 100 }),
  })

  const membersQuery = useQuery({
    queryKey: ["studios", "current", "members"],
    queryFn: () => studioApi.members(),
  })

  const projects = projectsQuery.data?.items ?? []
  const tasks = tasksQuery.data?.items ?? []
  const members = membersQuery.data ?? []

  const myTasks = tasks.filter((t) => t.assignments?.some((a) => a.userId === user?._id || a.user?._id === user?._id))
  const displayedTasks = myTasks.length > 0 ? myTasks : tasks.slice(0, 5)

  // Real activities generated from recent projects and tasks
  const recentActivities = [
    ...projects.slice(0, 3).map((p) => ({
      id: `proj-${p._id}`,
      type: "project",
      title: `Dự án "${p.name}"`,
      badge: p.status,
      badgeMap: PROJECT_STATUS,
      date: p.updatedAt || p.createdAt,
      desc: p.description || `Mã dự án ${p.code} • Phân loại: ${p.category || "Phim"}`,
      link: `/projects/${p._id}`,
      icon: FilmIcon,
      actionText: "Xem dự án",
    })),
    ...displayedTasks.slice(0, 3).map((t) => ({
      id: `task-${t._id}`,
      type: "task",
      title: `Công việc "${t.name}"`,
      badge: t.status,
      badgeMap: TASK_STATUS,
      date: t.updatedAt || t.createdAt,
      desc: `Giai đoạn: ${t.stage || "Hậu kỳ"} • Ưu tiên: ${t.priority || "Trung bình"}`,
      link: `/tasks`,
      icon: ListTodoIcon,
      actionText: "Chi tiết việc",
    })),
  ].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))

  return (
    <div className="space-y-6 pb-10">
      {/* Top Header Bar matching image 1 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Profile Page
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Thông tin cá nhân, hoạt động dự án và thành viên studio được đồng bộ trực tiếp.
          </p>
        </div>

        <Button
          onClick={() => setEditDialogOpen(true)}
          className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-all self-start sm:self-auto font-medium"
        >
          <SettingsIcon className="size-4" />
          Settings
        </Button>
      </div>

      {/* Navigation Tabs Pill Bar */}
      <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-xl w-fit border border-border/40">
        {[
          { id: "overview", label: "Overview" },
          { id: "projects", label: "Projects" },
          { id: "activities", label: "Activities" },
          { id: "members", label: "Members" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === tab.id
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)] xl:grid-cols-[380px_minmax(0,1fr)] gap-6 items-start">
        {/* Left Column: User Profile Card & Studio Info */}
        <div className="space-y-5">
          {/* Main User Profile Card */}
          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs flex flex-col items-center text-center relative overflow-hidden">
            {/* Ambient subtle decorative background top curve */}
            <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-indigo-500/10 via-primary/5 to-transparent pointer-events-none" />

            {/* Avatar with ring */}
            <div className="relative mt-2">
              <div className="size-28 rounded-full overflow-hidden ring-4 ring-background shadow-lg border border-border">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="size-full object-cover" />
                ) : (
                  <div className="size-full bg-primary/10 flex items-center justify-center text-primary font-bold text-3xl">
                    {user?.name ? user.name.slice(0, 2).toUpperCase() : "LH"}
                  </div>
                )}
              </div>
              <span className="absolute bottom-1 right-1 size-5 rounded-full bg-emerald-500 ring-2 ring-background" title="Đang hoạt động" />
            </div>

            {/* Name & Role Badge */}
            <div className="mt-4 flex items-center justify-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                {user?.name || "Thành viên"}
              </h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                {role ? STUDIO_ROLES[role] || role : "Pro"}
              </span>
            </div>

            <p className="mt-1 text-sm text-muted-foreground font-medium">
              {studio?.name || "LH Studio"} • Quản trị sản xuất
            </p>

            {/* Stats Box (Post/Tasks, Projects, Members) matching image 1 */}
            <div className="mt-6 w-full grid grid-cols-3 divide-x divide-border/60 rounded-xl bg-muted/40 py-3.5 px-2 border border-border/50 text-center">
              <div>
                <p className="text-lg font-bold text-foreground">
                  {tasksQuery.isLoading ? <Skeleton className="h-6 w-8 mx-auto" /> : tasks.length}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Tasks</p>
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">
                  {projectsQuery.isLoading ? <Skeleton className="h-6 w-8 mx-auto" /> : projects.length}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Projects</p>
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">
                  {membersQuery.isLoading ? <Skeleton className="h-6 w-8 mx-auto" /> : members.length || 1}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Members</p>
              </div>
            </div>

            {/* Contact Details matching reference */}
            <div className="mt-6 w-full space-y-3 pt-5 border-t border-border/60 text-left text-sm">
              <div className="flex items-center gap-3 text-muted-foreground">
                <MailIcon className="size-4 text-muted-foreground/80 shrink-0" />
                <span className="truncate text-foreground font-medium">{user?.email}</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <PhoneIcon className="size-4 text-muted-foreground/80 shrink-0" />
                <span className="text-foreground">{user?.phone || "(+84) Chưa cập nhật SĐT"}</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <MapPinIcon className="size-4 text-muted-foreground/80 shrink-0" />
                <span className="text-foreground">Việt Nam • {studio?.name || "LH Studio HQ"}</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <GlobeIcon className="size-4 text-muted-foreground/80 shrink-0" />
                <span className="truncate text-primary font-medium">https://lhstudio.vn</span>
              </div>
            </div>
          </div>

          {/* Studio Summary Card */}
          <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-sm font-semibold text-foreground">
                Không gian làm việc
              </h3>
              <span className="size-2 rounded-full bg-emerald-500" />
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">Studio</span>
                <span className="font-semibold text-foreground">{studio?.name || "LH Studio"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">Mã định danh</span>
                <span className="font-mono font-medium text-foreground">{studio?.code || "LHS"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">Quyền hạn</span>
                <span className="font-medium text-foreground">{STUDIO_ROLES[role] || "Thành viên"}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Ngày tham gia</span>
                <span className="text-foreground">
                  {user?.createdAt ? format(new Date(user.createdAt), "dd/MM/yyyy", { locale: vi }) : "Mới tham gia"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Latest Activity & Bottom Row */}
        <div className="space-y-6 min-w-0">
          {/* Latest Activity Card matching image 1 */}
          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <ClockIcon className="size-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-heading text-base font-bold text-foreground">
                  Latest Activity
                </h3>
              </div>
              <Link
                to="/projects"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
              >
                View All
              </Link>
            </div>

            {/* Activity Timeline */}
            <div className="space-y-6 relative before:absolute before:top-3 before:bottom-3 before:left-4 before:w-0.5 before:bg-border/60">
              {recentActivities.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 pl-8">Chưa có hoạt động dự án nào được ghi nhận.</p>
              ) : (
                recentActivities.slice(0, 4).map((act) => {
                  const Icon = act.icon
                  return (
                    <div key={act.id} className="relative flex items-start gap-4 pl-1">
                      {/* Timeline Node Icon */}
                      <div className="relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800">
                        <Icon className="size-3.5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">
                            {act.title}
                          </p>
                          {act.badge && act.badgeMap && (
                            <StatusBadge map={act.badgeMap} value={act.badge} />
                          )}
                        </div>

                        <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <ClockIcon className="size-3" />
                          <span>
                            {act.date ? format(new Date(act.date), "dd/MM/yyyy HH:mm", { locale: vi }) : "Gần đây"}
                          </span>
                        </div>

                        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                          {act.desc}
                        </p>

                        <div className="mt-2.5">
                          <Link to={act.link}>
                            <Button
                              variant="outline"
                              size="xs"
                              className="rounded-lg gap-1.5 border-border/80 hover:bg-muted font-medium text-xs"
                            >
                              {act.actionText}
                              <ChevronRightIcon className="size-3" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Bottom Row: 2 Cards side-by-side matching image 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card A: Transaction / Project History */}
            <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-heading text-sm font-bold text-foreground">
                    Dự án tham gia gần đây
                  </h4>
                  <Link to="/projects" className="text-xs text-muted-foreground hover:text-foreground">
                    Xem tất cả
                  </Link>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border/60 text-muted-foreground">
                        <th className="pb-2 font-medium">Dự án</th>
                        <th className="pb-2 font-medium">Trạng thái</th>
                        <th className="pb-2 font-medium text-right">Mã</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {projects.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="py-4 text-center text-muted-foreground">
                            Chưa có dự án nào
                          </td>
                        </tr>
                      ) : (
                        projects.slice(0, 4).map((p) => (
                          <tr key={p._id} className="hover:bg-muted/30 transition-colors">
                            <td className="py-2.5 font-medium truncate max-w-[120px]">
                              <Link to={`/projects/${p._id}`} className="hover:underline text-foreground">
                                {p.name}
                              </Link>
                            </td>
                            <td className="py-2.5">
                              <StatusBadge map={PROJECT_STATUS} value={p.status} />
                            </td>
                            <td className="py-2.5 text-right font-mono text-muted-foreground">
                              {p.code}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Card B: Connections / Studio Members matching image 1 */}
            <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <UsersIcon className="size-4 text-indigo-600 dark:text-indigo-400" />
                  <h4 className="font-heading text-sm font-bold text-foreground">
                    Thành viên Studio ({members.length})
                  </h4>
                </div>
                <Link to="/team" className="text-xs text-muted-foreground hover:text-foreground">
                  <ChevronRightIcon className="size-4" />
                </Link>
              </div>

              <div className="space-y-3.5">
                {members.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">Chưa có thành viên nào khác.</p>
                ) : (
                  members.slice(0, 4).map((m) => {
                    const u = m.user || m
                    return (
                      <div key={u._id || m._id} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <UserAvatar user={u} size="sm" />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-foreground truncate">
                              {u.name}
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate max-w-[130px]">
                              {u.email}
                            </p>
                          </div>
                        </div>

                        <Link to="/team">
                          <Button
                            size="xs"
                            className="h-7 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium"
                          >
                            Chi tiết
                          </Button>
                        </Link>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal Dialog */}
      <EditProfileDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} />
    </div>
  )
}
