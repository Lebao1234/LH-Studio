import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { CheckIcon, CopyIcon, InfoIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { SelectField, TextField } from "@/components/shared/FormField"
import { applyFieldErrors, getErrorMessage } from "@/lib/api/axios"
import { STUDIO_ROLES } from "@/lib/constants/labels"
import { formatDateTime } from "@/lib/utils/format"
import { INVITE_ROLES } from "../constants"
import { inviteMemberSchema } from "../schemas"
import { useInviteMember } from "../hooks/use-team"

const ROLE_OPTIONS = INVITE_ROLES.map((value) => ({ value, label: STUDIO_ROLES[value].label }))
const DEFAULTS = { email: "", name: "", role: "member" }

function InviteLink({ invitation, inviteUrl }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      toast.success("Đã sao chép đường dẫn mời.")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Không sao chép được. Hãy chọn và sao chép thủ công.")
    }
  }

  return (
    <div className="grid gap-3">
      <div className="flex gap-2 rounded-lg bg-info/10 p-3 text-xs text-info ring-1 ring-info/20">
        <InfoIcon className="mt-0.5 size-3.5 shrink-0" />
        <p>
          <strong className="font-medium">{invitation?.email}</strong> chưa có tài khoản. Hệ thống chưa gửi email tự động, hãy tự gửi đường dẫn
          bên dưới cho người được mời. Đường dẫn chỉ hiển thị <strong className="font-medium">một lần</strong>
          {invitation?.expiresAt ? ` và hết hạn lúc ${formatDateTime(invitation.expiresAt)}` : ""}.
        </p>
      </div>
      <div className="flex gap-2">
        <Input readOnly value={inviteUrl} aria-label="Đường dẫn mời" className="font-mono text-xs" onFocus={(e) => e.target.select()} />
        <Button type="button" variant="outline" onClick={copy} aria-label="Sao chép đường dẫn mời">
          {copied ? <CheckIcon /> : <CopyIcon />}
          {copied ? "Đã chép" : "Sao chép"}
        </Button>
      </div>
    </div>
  )
}

export function InviteMemberDialog({ open, onOpenChange }) {
  const [result, setResult] = useState(null)
  const form = useForm({ resolver: zodResolver(inviteMemberSchema), defaultValues: DEFAULTS })

  const close = (next) => {
    onOpenChange(next)
    if (!next) {
      // Drop the one-time link once the dialog is closed.
      setResult(null)
      form.reset(DEFAULTS)
    }
  }

  const mutation = useInviteMember({
    onSuccess: (data) => {
      if (data?.type === "invitation") {
        setResult(data)
        toast.success("Đã tạo lời mời.")
      } else {
        toast.success("Đã thêm thành viên vào studio.")
        close(false)
      }
    },
    onError: (err) => {
      if (err.response?.data?.code === "ALREADY_MEMBER") {
        form.setError("email", { message: "Người này đã là thành viên studio." })
      } else if (!applyFieldErrors(err, form.setError)) toast.error(getErrorMessage(err))
    },
  })

  const submit = form.handleSubmit(({ email, name, role }) => mutation.mutate({ email, role, ...(name ? { name } : {}) }))

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{result ? "Gửi lời mời" : "Mời thành viên"}</DialogTitle>
          <DialogDescription>
            {result
              ? "Sao chép đường dẫn và gửi cho người được mời để họ tạo tài khoản."
              : "Nếu email đã có tài khoản, người đó được thêm ngay vào studio. Nếu chưa, hệ thống tạo đường dẫn mời."}
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <InviteLink invitation={result.invitation} inviteUrl={result.inviteUrl} />
        ) : (
          <form id="invite-member" className="grid gap-3" onSubmit={submit} noValidate>
            <TextField form={form} name="email" label="Email" required type="email" autoComplete="off" placeholder="ten@example.com" />
            <TextField form={form} name="name" label="Tên hiển thị" hint="Không bắt buộc, dùng khi tạo lời mời." autoComplete="off" />
            <SelectField form={form} name="role" label="Vai trò" required options={ROLE_OPTIONS} />
          </form>
        )}

        <DialogFooter>
          {result ? (
            <Button onClick={() => close(false)}>Xong</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => close(false)}>
                Hủy
              </Button>
              <Button type="submit" form="invite-member" disabled={mutation.isPending}>
                {mutation.isPending && <Spinner />}
                Mời
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
