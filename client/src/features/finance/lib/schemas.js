import { z } from "zod"

const amount = (requiredMsg) =>
  z
    .string()
    .regex(/^\d{1,16}$/, requiredMsg)
    .refine((v) => BigInt(v) > 0n, "Số tiền phải lớn hơn 0.")

export const transactionSchema = z.object({
  title: z.string().trim().min(1, "Vui lòng nhập nội dung.").max(200, "Tối đa 200 ký tự."),
  description: z.string().max(5000, "Tối đa 5000 ký tự."),
  type: z.enum(["income", "expense"]),
  categoryId: z.string().min(1, "Vui lòng chọn danh mục."),
  projectId: z.string(),
  totalAmount: amount("Vui lòng nhập tổng tiền."),
  status: z.enum(["planned", "pending", "partially_paid", "paid", "cancelled"]),
  expectedDate: z.string(),
})

export const paymentSchema = z.object({
  amount: amount("Vui lòng nhập số tiền."),
  paidAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Vui lòng chọn ngày thanh toán."),
  method: z.enum(["bank_transfer", "cash", "other"]),
  referenceNumber: z.string().trim().max(100, "Tối đa 100 ký tự."),
  note: z.string().trim().max(1000, "Tối đa 1000 ký tự."),
})

export const reversalSchema = z.object({
  reason: z.string().trim().min(3, "Vui lòng nhập lý do điều chỉnh (ít nhất 3 ký tự).").max(500, "Tối đa 500 ký tự."),
})

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Vui lòng nhập tên.").max(120),
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9][A-Z0-9_-]{0,39}$/, "Chỉ gồm chữ, số, “-” hoặc “_”."),
  type: z.enum(["income", "expense"]),
})
