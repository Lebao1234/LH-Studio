import { z } from "zod"

const optionalUrl = z
  .string()
  .trim()
  .max(2048, "Tối đa 2048 ký tự.")
  .refine((v) => v === "" || /^https?:\/\//i.test(v), "URL phải bắt đầu bằng http(s)://")

export const channelSchema = z.object({
  platform: z.enum(["youtube", "tiktok", "facebook", "other"], { error: "Vui lòng chọn nền tảng." }),
  name: z.string().trim().min(1, "Vui lòng nhập tên kênh.").max(120, "Tối đa 120 ký tự."),
  handle: z.string().trim().max(120, "Tối đa 120 ký tự."),
  platformChannelId: z.string().trim().max(200, "Tối đa 200 ký tự."),
  channelUrl: optionalUrl,
  avatarUrl: optionalUrl,
  status: z.enum(["active", "inactive"]),
})

export const channelDefaults = (channel) => ({
  platform: channel?.platform ?? "youtube",
  name: channel?.name ?? "",
  handle: channel?.handle ?? "",
  platformChannelId: channel?.platformChannelId ?? "",
  channelUrl: channel?.channelUrl ?? "",
  avatarUrl: channel?.avatarUrl ?? "",
  status: channel?.status ?? "active",
})
