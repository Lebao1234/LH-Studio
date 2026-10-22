import { z } from "zod"

const dateOrder = (v) => !v.startDate || !v.dueDate || v.dueDate >= v.startDate
const urlOrEmpty = z
  .string()
  .trim()
  .max(2048)
  .refine((v) => v === "" || /^https?:\/\//i.test(v) || v.startsWith("/"), "URL phải bắt đầu bằng http(s):// hoặc đường dẫn hợp lệ")

export const projectSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập mã dự án.")
      .regex(/^[A-Za-z0-9][A-Za-z0-9_-]{0,29}$/, 'Mã chỉ gồm chữ, số, "-" hoặc "_" (tối đa 30 ký tự).'),
    category: z.string().optional(),
    title: z.string().trim().min(1, "Vui lòng nhập tên dự án.").max(200, "Tối đa 200 ký tự."),
    description: z.string().max(5000, "Tối đa 5000 ký tự."),
    coverUrl: urlOrEmpty,
    status: z.string().min(1),
    priority: z.string(),
    startDate: z.string(),
    dueDate: z.string(),
  })
  .refine(dateOrder, { path: ["dueDate"], message: "Hạn chót phải sau ngày bắt đầu." })

export const projectMemberSchema = z.object({
  userId: z.string().min(1, "Vui lòng chọn thành viên."),
  role: z.string().min(1),
})
