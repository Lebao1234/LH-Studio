import { useState } from "react"
import { PlusIcon, XIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { SimpleSelect } from "@/components/shared/SimpleSelect"
import { UserCell } from "@/components/shared/UserAvatar"
import { getErrorMessage } from "@/lib/api/axios"
import { options as labelOptions } from "@/lib/constants/labels"
import { useAssignmentMutations } from "../hooks/use-tasks"

const ONE_LEAD = "Công việc đã có người phụ trách chính. Hãy đổi người đó thành Hỗ trợ trước."
const notifyError = (err) => toast.error(getErrorMessage(err))

/** Assignments of an EXISTING task; every change is applied immediately through the assignment endpoints. */
export function AssignmentManager({ taskId, assignments = [], assigneeOptions, loading, disabled }) {
  const { add, setRole, remove } = useAssignmentMutations(taskId)
  const [draft, setDraft] = useState({ userId: "", role: "contributor" })
  const hasLead = assignments.some((a) => a.role === "lead")
  const assigned = new Set(assignments.map((a) => String(a.userId)))
  const available = assigneeOptions.filter((o) => !assigned.has(o.value))
  const busy = add.isPending || setRole.isPending || remove.isPending

  const changeRole = (a, role) => {
    if (role === a.role) return
    if (role === "lead" && hasLead) return toast.error(ONE_LEAD)
    setRole.mutate({ userId: String(a.userId), role }, { onSuccess: () => toast.success("Đã đổi vai trò."), onError: notifyError })
  }

  const submitAdd = () => {
    if (!draft.userId) return toast.error("Chọn người cần giao.")
    if (draft.role === "lead" && hasLead) return toast.error(ONE_LEAD)
    add.mutate(draft, {
      onSuccess: () => {
        toast.success("Đã giao việc.")
        setDraft({ userId: "", role: "contributor" })
      },
      onError: notifyError,
    })
  }

  return (
    <div className="grid gap-2">
      <Label className="flex items-center gap-2 text-xs text-muted-foreground">
        Người thực hiện {busy && <Spinner className="size-3" />}
      </Label>
      {assignments.length === 0 && <p className="text-xs text-muted-foreground">Chưa giao cho ai.</p>}
      <ul className="grid gap-1.5">
        {assignments.map((a) => (
          <li key={String(a.userId)} className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <UserCell user={a.user} />
            </div>
            <SimpleSelect
              aria-label={`Vai trò của ${a.user?.name ?? "người thực hiện"}`}
              size="sm"
              className="w-36 shrink-0"
              value={a.role}
              onChange={(role) => changeRole(a, role)}
              options={labelOptions.assignmentRoles}
              disabled={disabled || busy}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Bỏ giao ${a.user?.name ?? ""}`}
              disabled={disabled || busy}
              onClick={() => remove.mutate(String(a.userId), { onSuccess: () => toast.success("Đã bỏ giao."), onError: notifyError })}
            >
              <XIcon />
            </Button>
          </li>
        ))}
      </ul>
      {!disabled && (
        <div className="flex items-center gap-2">
          <SimpleSelect
            aria-label="Chọn người để giao"
            size="sm"
            className="flex-1"
            value={draft.userId}
            onChange={(userId) => setDraft((d) => ({ ...d, userId }))}
            options={available}
            placeholder={loading ? "Đang tải..." : available.length ? "Thêm người..." : "Không còn ai để giao"}
            disabled={loading || !available.length}
          />
          <SimpleSelect
            aria-label="Vai trò người được giao"
            size="sm"
            className="w-36 shrink-0"
            value={draft.role}
            onChange={(role) => setDraft((d) => ({ ...d, role }))}
            options={labelOptions.assignmentRoles}
          />
          <Button type="button" variant="outline" size="icon-sm" aria-label="Giao việc" disabled={busy || !draft.userId} onClick={submitAdd}>
            <PlusIcon />
          </Button>
        </div>
      )}
    </div>
  )
}
