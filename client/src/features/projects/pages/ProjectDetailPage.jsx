import { useState } from "react"
import { FolderXIcon } from "lucide-react"
import { Link, useNavigate, useParams } from "react-router"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { EmptyState } from "@/components/shared/EmptyState"
import { ErrorState } from "@/components/shared/ErrorState"
import { usePermissions } from "@/features/auth/auth-context"
import { EpisodesTab } from "@/features/episodes/components/EpisodesTab"
import { TasksPanel } from "@/features/tasks/components/TasksPanel"
import { useUrlFilters } from "@/hooks/use-url-filters"
import { getErrorMessage } from "@/lib/api/axios"
import { ProjectFormDialog } from "../components/ProjectFormDialog"
import { ProjectHeader } from "../components/ProjectHeader"
import { ProjectMembersTab } from "../components/ProjectMembersTab"
import { ProjectOverviewTab } from "../components/ProjectOverviewTab"
import { useDeleteProject, useProject } from "../hooks/use-projects"
import { projectPermissions } from "../lib/project-utils"

const TABS = ["overview", "episodes", "tasks", "members"]

function DetailSkeleton() {
  return (
    <div className="grid gap-5" aria-busy="true">
      <Skeleton className="h-4 w-24" />
      <div className="grid gap-5 sm:grid-cols-[13rem_1fr] lg:grid-cols-[16rem_1fr]">
        <Skeleton className="aspect-[16/9] w-full rounded-xl" />
        <div className="grid content-start gap-3">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-5 w-48" />
        </div>
      </div>
      <Skeleton className="h-9 w-80" />
      <Skeleton className="h-24 rounded-xl" />
    </div>
  )
}

export default function ProjectDetailPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const perms = usePermissions()
  const [{ tab }, setFilter] = useUrlFilters({ tab: "overview" })
  const query = useProject(projectId)
  const remove = useDeleteProject()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  if (query.isPending) return <DetailSkeleton />
  if (query.isError) {
    if (query.error?.response?.status === 404) {
      return (
        <EmptyState
          icon={FolderXIcon}
          title="Không tìm thấy dự án"
          description="Dự án không tồn tại hoặc bạn không có quyền truy cập."
          action={<Button size="sm" variant="outline" nativeButton={false} render={<Link to="/projects" />}>Về danh sách dự án</Button>}
        />
      )
    }
    return <ErrorState error={query.error} onRetry={query.refetch} />
  }

  const project = query.data
  const can = projectPermissions(perms, project.myProjectRole)
  const activeTab = TABS.includes(tab) ? tab : "overview"

  const confirmDelete = () =>
    remove.mutate(project._id, {
      onSuccess: () => {
        toast.success("Đã xóa dự án.")
        setDeleteOpen(false)
        navigate("/projects", { replace: true })
      },
      onError: (err) => {
        // e.g. PROJECT_HAS_FINANCE: the server explains to cancel instead of deleting.
        toast.error(getErrorMessage(err), { duration: 6000 })
        setDeleteOpen(false)
      },
    })

  return (
    <div className="grid gap-6">
      <ProjectHeader
        project={project}
        canEdit={can.canEditProject}
        canDelete={can.canDeleteProject}
        onEdit={() => setEditOpen(true)}
        onDelete={() => setDeleteOpen(true)}
      />

      <Tabs value={activeTab} onValueChange={(v) => setFilter("tab", v)} className="gap-4">
        <div className="-mx-4 overflow-x-auto border-b border-foreground/10 px-4 sm:mx-0 sm:px-0">
          <TabsList variant="line">
            <TabsTrigger value="overview" className="px-3 after:bg-primary">Tổng quan</TabsTrigger>
            <TabsTrigger value="episodes" className="px-3 after:bg-primary">
              Tập phim <span className="text-xs text-muted-foreground tabular">{project.episodes?.total ?? 0}</span>
            </TabsTrigger>
            <TabsTrigger value="tasks" className="px-3 after:bg-primary">
              Công việc <span className="text-xs text-muted-foreground tabular">{project.tasks?.open ?? 0}</span>
            </TabsTrigger>
            <TabsTrigger value="members" className="px-3 after:bg-primary">
              Thành viên <span className="text-xs text-muted-foreground tabular">{project.members?.length ?? 0}</span>
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="overview">
          <ProjectOverviewTab project={project} />
        </TabsContent>
        <TabsContent value="episodes">
          <EpisodesTab projectId={project._id} projectCode={project.code} canWrite={can.canWriteEpisodes} canDelete={can.canDeleteEpisodes} />
        </TabsContent>
        <TabsContent value="tasks">
          <TasksPanel projectId={project._id} canCreate={can.canCreateTasks} />
        </TabsContent>
        <TabsContent value="members">
          <ProjectMembersTab projectId={project._id} canManage={can.canManageMembers} />
        </TabsContent>
      </Tabs>

      {can.canEditProject && <ProjectFormDialog open={editOpen} onOpenChange={setEditOpen} project={project} />}
      {can.canDeleteProject && (
        <ConfirmDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          title={`Xóa dự án ${project.code}?`}
          description="Toàn bộ tập phim, công việc và thành viên dự án sẽ bị xóa. Bài đăng được giữ lại. Không thể hoàn tác."
          confirmLabel="Xóa dự án"
          pending={remove.isPending}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  )
}
