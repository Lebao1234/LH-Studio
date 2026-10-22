import { Card } from "@/components/ui/card"
import { StatStrip } from "@/components/shared/StatStrip"
import { percent } from "@/lib/utils/format"

function ProgressRow({ label, done, total }) {
  const value = percent(done, total)
  return (
    <div className="grid gap-2">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span>{label}</span>
        <span className="tabular text-muted-foreground">
          {done}/{total}
          <span className="ml-2 font-medium text-foreground">{value}%</span>
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-foreground/8" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <div className="h-full rounded-full bg-primary" style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

export function ProjectOverviewTab({ project }) {
  const episodes = project.episodes ?? { total: 0, completed: 0 }
  const tasks = project.tasks ?? { total: 0, open: 0, done: 0 }

  return (
    <div className="grid gap-4">
      <StatStrip
        items={[
          { key: "episodes", label: "Tập phim", value: episodes.total, hint: `${episodes.completed} đã hoàn thành` },
          { key: "open", label: "Công việc đang mở", value: tasks.open, hint: `Trên tổng ${tasks.total} việc`, tone: tasks.open > 0 ? "info" : "default" },
          { key: "done", label: "Công việc đã xong", value: tasks.done, tone: "success" },
          { key: "members", label: "Thành viên", value: project.members?.length ?? 0 },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Card className="gap-3 px-5">
          <h2 className="font-heading text-sm font-semibold">Mô tả</h2>
          {project.description ? (
            <p className="max-w-[70ch] text-sm leading-relaxed whitespace-pre-line text-muted-foreground">{project.description}</p>
          ) : (
            <p className="text-sm text-muted-foreground">Chưa có mô tả. Thêm tóm tắt cốt truyện hoặc ghi chú sản xuất bằng nút Sửa dự án.</p>
          )}
        </Card>

        <Card className="gap-4 px-5">
          <h2 className="font-heading text-sm font-semibold">Tiến độ</h2>
          <ProgressRow label="Tập phim hoàn thành" done={episodes.completed} total={episodes.total} />
          <ProgressRow label="Công việc hoàn thành" done={tasks.done} total={tasks.total} />
        </Card>
      </div>
    </div>
  )
}
