import { toast } from "sonner"
import { SimpleSelect } from "@/components/shared/SimpleSelect"
import { getErrorMessage } from "@/lib/api/axios"
import { options, TASK_STATUS } from "@/lib/constants/labels"
import { cn } from "@/lib/utils"
import { useUpdateTaskStatus } from "../hooks/use-tasks"

const stop = (e) => e.stopPropagation()

/** Inline status changer; isolates clicks so it can live inside clickable rows/cards. */
export function TaskStatusSelect({ task, disabled, className }) {
  const mutation = useUpdateTaskStatus()
  const change = (status) => {
    if (!status || status === task.status) return
    mutation.mutate(
      { id: task._id, status },
      {
        onSuccess: () => toast.success(`Đã chuyển sang "${TASK_STATUS[status]?.label ?? status}".`),
        onError: (err) => toast.error(getErrorMessage(err)),
      },
    )
  }
  return (
    <div onClick={stop} onKeyDown={stop} className={cn("min-w-0", className)}>
      <SimpleSelect
        aria-label={`Trạng thái: ${task.title}`}
        size="sm"
        value={mutation.isPending ? mutation.variables?.status : task.status}
        onChange={change}
        options={options.taskStatus}
        disabled={disabled || mutation.isPending}
      />
    </div>
  )
}
