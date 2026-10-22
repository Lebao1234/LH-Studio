import { z } from "zod"

const assignee = z.object({ userId: z.string().min(1, "Chọn người được giao."), role: z.enum(["lead", "contributor"]) })

export const taskSchema = z
  .object({
    projectId: z.string().min(1, "Vui lòng chọn dự án."),
    episodeId: z.string(),
    title: z.string().trim().min(1, "Vui lòng nhập tiêu đề.").max(200, "Tối đa 200 ký tự."),
    description: z.string().max(10_000, "Tối đa 10.000 ký tự."),
    type: z.string(),
    status: z.string().min(1),
    priority: z.string().min(1),
    startDate: z.string(),
    dueDate: z.string(),
    assignees: z
      .array(assignee)
      .max(20, "Tối đa 20 người.")
      .refine((list) => list.filter((a) => a.role === "lead").length <= 1, "Chỉ được có tối đa một người phụ trách chính.")
      .refine((list) => new Set(list.map((a) => a.userId)).size === list.length, "Mỗi người chỉ được giao một lần."),
  })
  .refine((v) => !v.startDate || !v.dueDate || v.dueDate >= v.startDate, {
    path: ["dueDate"],
    message: "Hạn chót phải sau ngày bắt đầu.",
  })
