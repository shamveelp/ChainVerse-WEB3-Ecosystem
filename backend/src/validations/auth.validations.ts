import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Invalid email format').nonempty('Email is required'),
  password: z.string().nonempty('Password is required'),
})

export const registerSchema = z.object({
  username: z
    .string()
    .min(4, 'Username must be at least 4 characters long')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .nonempty('Username is required'),
  email: z.string().email('Invalid email format').nonempty('Email is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    )
    .nonempty('Password is required'),
})

export const verifyOtpSchema = z.object({
  username: z
    .string()
    .min(4, 'Username must be at least 4 characters long')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .nonempty('Username is required'),
  email: z.string().email('Invalid email format').nonempty('Email is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    )
    .nonempty('Password is required'),
  otp: z.string().length(6, 'OTP code must be 6 digits'),
})

export const checkUsernameSchema = z.object({
  username: z
    .string()
    .min(4, 'Username must be at least 4 characters long')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .nonempty('Username is required'),
})
