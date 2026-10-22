import { z } from "zod"

const password = z
  .string()
  .min(8, "Mật khẩu tối thiểu 8 ký tự.")
  .max(128, "Mật khẩu tối đa 128 ký tự.")
  .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), "Mật khẩu phải có cả chữ và số.")

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Vui lòng nhập email.").pipe(z.email("Email không hợp lệ.")),
  password: z.string().min(1, "Vui lòng nhập mật khẩu."),
})

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Tên tối thiểu 2 ký tự.").max(100),
    email: z.string().trim().min(1, "Vui lòng nhập email.").pipe(z.email("Email không hợp lệ.")),
    password,
    confirmPassword: z.string().min(1, "Vui lòng nhập lại mật khẩu."),
    mode: z.enum(["invite", "bootstrap", "standard"]).default("standard"),
    inviteToken: z.string().optional(),
    bootstrapToken: z.string().optional(),
    studioName: z.string().trim().max(120).optional(),
  })
  .refine((d) => d.password === d.confirmPassword, { path: ["confirmPassword"], message: "Mật khẩu xác nhận không khớp." })
  .refine((d) => d.mode !== "invite" || (d.inviteToken?.length ?? 0) >= 10, { path: ["inviteToken"], message: "Cần mã mời hợp lệ." })
  .refine((d) => d.mode !== "bootstrap" || (d.bootstrapToken?.length ?? 0) >= 16, { path: ["bootstrapToken"], message: "Cần mã khởi tạo hợp lệ." })

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại."),
    newPassword: password,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, { path: ["confirmPassword"], message: "Mật khẩu xác nhận không khớp." })
