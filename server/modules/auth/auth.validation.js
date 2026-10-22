import { z } from 'zod';

export const email = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .pipe(z.email('Email không hợp lệ.'));

export const password = z
  .string()
  .min(8, 'Mật khẩu tối thiểu 8 ký tự.')
  .max(128, 'Mật khẩu tối đa 128 ký tự.')
  .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), 'Mật khẩu phải có cả chữ và số.');

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Tên tối thiểu 2 ký tự.').max(100),
    email,
    password,
    confirmPassword: z.string(),
    inviteToken: z.string().trim().min(10).max(200).optional(),
    bootstrapToken: z.string().trim().min(16).max(200).optional(),
    studioName: z.string().trim().min(2).max(120).optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Mật khẩu xác nhận không khớp.',
  })
  .refine((d) => !(d.inviteToken && d.bootstrapToken), {
    path: ['inviteToken'],
    message: 'Không thể dùng cùng lúc mã mời và mã khởi tạo.',
  });

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Vui lòng nhập mật khẩu.').max(128),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1).max(128),
    newPassword: password,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Mật khẩu xác nhận không khớp.',
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    path: ['newPassword'],
    message: 'Mật khẩu mới phải khác mật khẩu hiện tại.',
  });

export const invitationTokenParams = z.object({ token: z.string().trim().min(10).max(200) });
