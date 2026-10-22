import { Link } from "react-router"
import { BellIcon, PlusIcon, ArrowRightIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ProductionReminders({ tasks = [] }) {
  // Use tasks from database or fallback to realistic video production workflow reminders
  const reminders = [
    {
      id: "rem-1",
      priority: "Low",
      color: "bg-emerald-500",
      textColor: "text-emerald-600 dark:text-emerald-400",
      bgLight: "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/50 dark:border-emerald-900/40",
      time: "Hôm nay, 14:00",
      text: tasks[0]?.name || "Duyệt kịch bản phân cảnh tập 04",
      tag: tasks[0]?.stage || "Kịch bản",
    },
    {
      id: "rem-2",
      priority: "Medium",
      color: "bg-amber-500",
      textColor: "text-amber-600 dark:text-amber-400",
      bgLight: "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-900/40",
      time: "Hôm nay, 16:30",
      text: tasks[1]?.name || "Kiểm tra render AI & dựng audio lồng tiếng",
      tag: tasks[1]?.stage || "Dựng phim",
    },
    {
      id: "rem-3",
      priority: "High",
      color: "bg-rose-500",
      textColor: "text-rose-600 dark:text-rose-400",
      bgLight: "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200/50 dark:border-rose-900/40",
      time: "Ngày mai, 09:00",
      text: tasks[2]?.name || "Xuất bản video teaser lên YouTube & TikTok",
      tag: tasks[2]?.stage || "Hậu kỳ & Lịch đăng",
    },
  ]

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BellIcon className="size-4 text-indigo-600 dark:text-indigo-400" />
          <h3 className="font-heading text-sm font-bold text-foreground">
            Reminder (Nhắc việc sản xuất)
          </h3>
        </div>

        <Link to="/tasks">
          <Button variant="outline" size="xs" className="h-7 gap-1 rounded-lg text-xs font-medium">
            <PlusIcon className="size-3" />
            Set Reminder
          </Button>
        </Link>
      </div>

      {/* 3 Priority Cards matching image */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-auto">
        {reminders.map((rem) => (
          <div
            key={rem.id}
            className={`rounded-xl border p-3 flex flex-col justify-between transition-all hover:shadow-xs ${rem.bgLight}`}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className={`size-2 rounded-full ${rem.color}`} />
                <span className={`text-[11px] font-bold uppercase tracking-wider ${rem.textColor}`}>
                  {rem.priority}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1 font-medium">
                {rem.time}
              </p>
              <p className="text-xs font-semibold text-foreground mt-2 line-clamp-2 leading-snug">
                {rem.text}
              </p>
            </div>

            <div className="mt-3">
              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-background border border-border/70 text-foreground">
                {rem.tag}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer link matching reference */}
      <div className="mt-4 pt-3 border-t border-border/50 flex justify-end">
        <Link
          to="/tasks"
          className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          <span>Xem tất cả công việc nhắc nhở ({tasks.length || 10})</span>
          <ArrowRightIcon className="size-3" />
        </Link>
      </div>
    </div>
  )
}

