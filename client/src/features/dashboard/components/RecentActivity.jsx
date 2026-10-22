import { Link } from "react-router"
import { ClapperboardIcon, FilmIcon, HistoryIcon, ListTodoIcon, MegaphoneIcon } from "lucide-react"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { EmptyState } from "@/components/shared/EmptyState"
import { EPISODE_STATUS, PLATFORMS, POST_STATUS, PROJECT_STATUS, TASK_STATUS } from "@/lib/constants/labels"
import { formatDateTime, formatRelative } from "@/lib/utils/format"
import { ListSkeleton, WidgetCard } from "./WidgetCard"

const KINDS = {
  project: { label: "Dự án", icon: ClapperboardIcon, map: PROJECT_STATUS, to: (a) => `/projects/${a.id}` },
  episode: {
    label: "Tập",
    icon: FilmIcon,
    map: EPISODE_STATUS,
    to: (a) => (a.project?._id ? `/projects/${a.project._id}` : null),
  },
  task: { label: "Công việc", icon: ListTodoIcon, map: TASK_STATUS, to: () => "/tasks" },
  post: { label: "Bài đăng", icon: MegaphoneIcon, map: POST_STATUS, to: () => "/posts" },
}

const ACTIONS = { created: "Tạo mới", updated: "Cập nhật" }

function subtitle(item, kind) {
  const parts = [kind.label, ACTIONS[item.action] ?? item.action]
  if (item.project?.code) parts.push(item.project.code)
  if (item.channel?.name) parts.push(`${item.channel.name}${item.channel.platform ? ` · ${PLATFORMS[item.channel.platform]?.label ?? item.channel.platform}` : ""}`)
  return parts.filter(Boolean).join(" · ")
}

function ActivityRow({ item }) {
  const kind = KINDS[item.kind] ?? KINDS.task
  const Icon = kind.icon
  const to = kind.to(item)
  const content = (
    <>
      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-foreground/8 text-foreground/80">
        <Icon className="size-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{item.title}</p>
        <p className="truncate text-xs text-muted-foreground">{subtitle(item, kind)}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <StatusBadge map={kind.map} value={item.status} />
        <time dateTime={item.at} title={formatDateTime(item.at)} className="text-[11px] text-muted-foreground">
          {formatRelative(item.at)}
        </time>
      </div>
    </>
  )
  const cls = "flex items-center gap-3 rounded-lg px-2 py-2"
  return (
    <li>
      {to ? (
        <Link to={to} className={`${cls} outline-none transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring/50`}>
          {content}
        </Link>
      ) : (
        <div className={cls}>{content}</div>
      )}
    </li>
  )
}

export function RecentActivity({ query, className }) {
  const items = query.data?.recentActivity ?? []
  return (
    <WidgetCard
      title="Hoạt động gần đây"
      description="Các bản ghi sản xuất vừa được tạo hoặc cập nhật"
      query={query}
      isEmpty={!items.length}
      empty={<EmptyState icon={HistoryIcon} title="Chưa có hoạt động" className="border-0 py-6" />}
      skeleton={<ListSkeleton rows={6} />}
      className={className}
      contentClassName="px-1.5"
    >
      <ul className="grid gap-0.5 sm:grid-cols-2 sm:gap-x-2">
        {items.map((item) => (
          <ActivityRow key={`${item.kind}-${item.id}`} item={item} />
        ))}
      </ul>
    </WidgetCard>
  )
}
