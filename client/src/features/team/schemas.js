import { z } from "zod"
import { INVITE_ROLES } from "./constants"

export const inviteMemberSchema = z.object({
  email: z.string().trim().min(1, "Vui lòng nhập email.").pipe(z.email("Email không hợp lệ.")),
  name: z
    .string()
    .trim()
    .max(100, "Tên tối đa 100 ký tự.")
    .refine((v) => !v || v.length >= 2, "Tên tối thiểu 2 ký tự."),
  role: z.enum(INVITE_ROLES, "Vui lòng chọn vai trò."),
})

export const memberRoleSchema = z.object({
  role: z.enum(["owner", "admin", "member", "viewer"], "Vui lòng chọn vai trò."),
})
