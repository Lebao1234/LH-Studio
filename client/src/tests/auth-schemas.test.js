import { describe, expect, it } from "vitest"
import { changePasswordSchema, loginSchema, registerSchema } from "@/features/auth/schemas"

describe("Client Auth Form Schemas (Zod)", () => {
  describe("loginSchema", () => {
    it("accepts valid email and password", () => {
      const result = loginSchema.safeParse({
        email: "owner@lhstudio.dev",
        password: "Passw0rd!secure",
      })
      expect(result.success).toBe(true)
    })

    it("rejects invalid email format", () => {
      const result = loginSchema.safeParse({
        email: "not-an-email",
        password: "Passw0rd!secure",
      })
      expect(result.success).toBe(false)
      expect(result.error.issues[0].message).toBe("Email không hợp lệ.")
    })

    it("rejects empty password", () => {
      const result = loginSchema.safeParse({
        email: "owner@lhstudio.dev",
        password: "",
      })
      expect(result.success).toBe(false)
      expect(result.error.issues[0].message).toBe("Vui lòng nhập mật khẩu.")
    })
  })

  describe("registerSchema", () => {
    it("accepts standard registration with matching passwords", () => {
      const result = registerSchema.safeParse({
        name: "Lê Hoàng",
        email: "lehoang@lhstudio.dev",
        password: "Password123",
        confirmPassword: "Password123",
        mode: "standard",
      })
      expect(result.success).toBe(true)
    })

    it("rejects password shorter than 8 characters", () => {
      const result = registerSchema.safeParse({
        name: "Lê Hoàng",
        email: "lehoang@lhstudio.dev",
        password: "Pass1",
        confirmPassword: "Pass1",
      })
      expect(result.success).toBe(false)
      expect(result.error.issues.some((i) => i.message.includes("tối thiểu 8 ký tự"))).toBe(true)
    })

    it("rejects password without numbers", () => {
      const result = registerSchema.safeParse({
        name: "Lê Hoàng",
        email: "lehoang@lhstudio.dev",
        password: "PasswordOnlyLetters",
        confirmPassword: "PasswordOnlyLetters",
      })
      expect(result.success).toBe(false)
      expect(result.error.issues.some((i) => i.message.includes("phải có cả chữ và số"))).toBe(true)
    })

    it("rejects mismatched confirmPassword", () => {
      const result = registerSchema.safeParse({
        name: "Lê Hoàng",
        email: "lehoang@lhstudio.dev",
        password: "Password123",
        confirmPassword: "DifferentPassword123",
      })
      expect(result.success).toBe(false)
      expect(result.error.issues.some((i) => i.message.includes("Mật khẩu xác nhận không khớp"))).toBe(true)
    })

    it("validates invite token requirement when mode is invite", () => {
      const invalid = registerSchema.safeParse({
        name: "Lê Hoàng",
        email: "lehoang@lhstudio.dev",
        password: "Password123",
        confirmPassword: "Password123",
        mode: "invite",
        inviteToken: "short",
      })
      expect(invalid.success).toBe(false)

      const valid = registerSchema.safeParse({
        name: "Lê Hoàng",
        email: "lehoang@lhstudio.dev",
        password: "Password123",
        confirmPassword: "Password123",
        mode: "invite",
        inviteToken: "long_valid_invite_token_12345",
      })
      expect(valid.success).toBe(true)
    })

    it("validates bootstrap token requirement when mode is bootstrap", () => {
      const invalid = registerSchema.safeParse({
        name: "Lê Hoàng",
        email: "lehoang@lhstudio.dev",
        password: "Password123",
        confirmPassword: "Password123",
        mode: "bootstrap",
        bootstrapToken: "short_token",
      })
      expect(invalid.success).toBe(false)

      const valid = registerSchema.safeParse({
        name: "Lê Hoàng",
        email: "lehoang@lhstudio.dev",
        password: "Password123",
        confirmPassword: "Password123",
        mode: "bootstrap",
        bootstrapToken: "bootstrap_token_16_characters_min",
      })
      expect(valid.success).toBe(true)
    })
  })

  describe("changePasswordSchema", () => {
    it("validates new password strength and matching confirmation", () => {
      const valid = changePasswordSchema.safeParse({
        currentPassword: "OldPassword123",
        newPassword: "NewStrongPassword456",
        confirmPassword: "NewStrongPassword456",
      })
      expect(valid.success).toBe(true)

      const mismatch = changePasswordSchema.safeParse({
        currentPassword: "OldPassword123",
        newPassword: "NewStrongPassword456",
        confirmPassword: "MismatchPassword456",
      })
      expect(mismatch.success).toBe(false)
    })
  })
})
