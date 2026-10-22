import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { SelectField, TextField } from "@/components/shared/FormField"
import { applyFieldErrors, getErrorMessage } from "@/lib/api/axios"
import { options } from "@/lib/constants/labels"
import { channelStatusOptions } from "../constants"
import { channelDefaults, channelSchema } from "../schemas"
import { useSaveChannel } from "../hooks/use-channel-mutations"
import { useStickyValue } from "@/features/posts/hooks/use-sticky-value"

/** Create / edit a publishing channel (owner/admin only). Pass `channel` to edit. */
export function ChannelFormDialog({ open, onOpenChange, channel }) {
  const shown = useStickyValue(open, channel)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <ChannelForm channel={shown} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

function ChannelForm({ channel, onDone }) {
  const isEdit = Boolean(channel)
  const form = useForm({ resolver: zodResolver(channelSchema), defaultValues: channelDefaults(channel) })
  const mutation = useSaveChannel()

  const onSubmit = (values) => {
    const body = isEdit ? values : Object.fromEntries(Object.entries(values).filter(([, v]) => v !== ""))
    mutation.mutate(
      { id: channel?._id ?? channel?.id, body },
      {
        onSuccess: () => {
          toast.success(isEdit ? "Đã cập nhật kênh." : "Đã thêm kênh.")
          onDone()
        },
        onError: (err) => {
          if (!applyFieldErrors(err, form.setError)) toast.error(getErrorMessage(err))
        },
      },
    )
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEdit ? "Sửa kênh" : "Thêm kênh"}</DialogTitle>
        <DialogDescription>Kênh dùng để lập kế hoạch và ghi nhận bài đăng. V1 chưa kết nối tự động với nền tảng.</DialogDescription>
      </DialogHeader>
      <form id="channel-form" className="grid gap-3 sm:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <SelectField form={form} name="platform" label="Nền tảng" required options={options.platforms} />
        <SelectField form={form} name="status" label="Trạng thái" options={channelStatusOptions} />
        <TextField form={form} name="name" label="Tên kênh" required className="sm:col-span-2" autoComplete="off" />
        <TextField form={form} name="handle" label="Handle" placeholder="@lhstudio" autoComplete="off" />
        <TextField form={form} name="platformChannelId" label="ID kênh trên nền tảng" autoComplete="off" />
        <TextField form={form} name="channelUrl" label="URL kênh" placeholder="https://" className="sm:col-span-2" inputMode="url" />
        <TextField form={form} name="avatarUrl" label="URL ảnh đại diện" placeholder="https://" className="sm:col-span-2" inputMode="url" />
      </form>
      <DialogFooter>
        <Button variant="outline" size="sm" onClick={onDone}>
          Hủy
        </Button>
        <Button type="submit" size="sm" form="channel-form" disabled={mutation.isPending}>
          {mutation.isPending && <Spinner />}
          {isEdit ? "Lưu" : "Thêm kênh"}
        </Button>
      </DialogFooter>
    </>
  )
}
