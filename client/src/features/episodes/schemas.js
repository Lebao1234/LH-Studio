import { z } from "zod"

const urlOrEmpty = z
  .string()
  .trim()
  .max(2048)
  .refine((v) => v === "" || /^https?:\/\//i.test(v) || v.startsWith("/"), "URL phải bắt đầu bằng http(s):// hoặc đường dẫn hợp lệ")

export const episodeSchema = z
  .object({
    episodeNumber: z
      .string()
      .trim()
      .refine((v) => v === "" || (/^\d+$/.test(v) && Number(v) <= 100_000), "Số tập phải là số nguyên ≥ 0."),
    title: z.string().trim().min(1, "Vui lòng nhập tên tập.").max(200, "Tối đa 200 ký tự."),
    description: z.string().max(5000, "Tối đa 5000 ký tự."),
    script: z.string().max(100_000, "Kịch bản quá dài."),
    coverUrl: urlOrEmpty,
    videoUrl: urlOrEmpty,
    status: z.string().min(1),
    assignedTo: z.string(),
    startDate: z.string(),
    dueDate: z.string(),
  })
  .refine((v) => !v.startDate || !v.dueDate || v.dueDate >= v.startDate, {
    path: ["dueDate"],
    message: "Hạn chót phải sau ngày bắt đầu.",
  })
