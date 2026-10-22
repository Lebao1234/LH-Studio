import { ArrowLeftIcon, PencilIcon, Trash2Icon } from "lucide-react"
import { Link } from "react-router"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { PRIORITY, PROJECT_ROLES, PROJECT_STATUS } from "@/lib/constants/labels"
import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/utils/format"
import { isProjectOverdue, projectCategoryName } from "../lib/project-utils"
import { ProjectCover } from "./ProjectCover"

function Meta({ label, children, className }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("mt-0.5 truncate text-sm", className)}>{children}</p>
    </div>
  )
}

export function ProjectHeader({ project, canEdit, canDelete, onEdit, onDelete }) {
  const overdue = isProjectOverdue(project)
  const category = projectCategoryName(project)

  return (
    <header className="grid gap-4">
      <Link
        to="/projects"
        className="inline-flex w-fit items-center gap-1.5 rounded-md text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeftIcon className="size-4" aria-hidden /> Dự án phim
      </Link>

      <div className="grid gap-5 sm:grid-cols-[minmax(0,13rem)_1fr] sm:items-start lg:grid-cols-[minmax(0,16rem)_1fr]">
        <ProjectCover project={project} size="hero" className="aspect-[16/9] w-full max-w-sm overflow-hidden rounded-xl ring-1 ring-foreground/10" />

        <div className="grid min-w-0 gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="font-mono text-xs text-muted-foreground">
                {project.code}
                {category && <span className="font-sans"> / {category}</span>}
              </p>
              <h1 className="mt-1 font-heading text-2xl leading-tight font-semibold break-words sm:text-3xl">{project.title}</h1>
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <StatusBadge map={PROJECT_STATUS} value={project.status} />
                {project.priority && <StatusBadge map={PRIORITY} value={project.priority} />}
                {project.myProjectRole && (
                  <StatusBadge map={PROJECT_ROLES} value={project.myProjectRole}>
                    Vai trò của bạn: {PROJECT_ROLES[project.myProjectRole]?.label ?? project.myProjectRole}
                  </StatusBadge>
                )}
              </div>
            </div>
            {(canEdit || canDelete) && (
              <div className="flex shrink-0 gap-2">
                {canEdit && (
                  <Button variant="outline" onClick={onEdit}>
                    <PencilIcon /> Sửa dự án
                  </Button>
                )}
                {canDelete && (
                  <Button variant="destructive" onClick={onDelete}>
                    <Trash2Icon /> Xóa
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:max-w-xl sm:grid-cols-3">
            <Meta label="Bắt đầu">{formatDate(project.startDate)}</Meta>
            <Meta label="Hạn chót" className={cn(overdue && "font-medium text-destructive")}>
              {formatDate(project.dueDate)}
              {overdue && ", quá hạn"}
            </Meta>
            <Meta label={project.completedAt ? "Hoàn thành" : "Cập nhật"}>{formatDate(project.completedAt ?? project.updatedAt)}</Meta>
          </div>
        </div>
      </div>
    </header>
  )
}
