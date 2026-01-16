import { z } from "zod";

// User registration validation
export const registerSchema = z.object({
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  email: z.string().email("Invalid email format"),
  password: z.string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password must be at most 100 characters"),
  name: z.string()
    .min(1, "Name is required")
    .max(50, "Name must be at most 50 characters")
    .optional(),
});

// User login validation
export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

// Update profile validation
export const updateProfileSchema = z.object({
  name: z.string()
    .min(1, "Name cannot be empty")
    .max(50, "Name must be at most 50 characters")
    .optional(),
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
    .optional(),
  phone: z.string()
    .regex(/^\+?[\d\s\-()]+$/, "Invalid phone number format")
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number must be at most 15 digits")
    .optional()
    .or(z.literal("")),
  profilePic: z.string().url("Invalid URL format").optional(),
});

// Check username validation
export const checkUsernameSchema = z.object({
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
});

// OTP validation
export const otpSchema = z.object({
  email: z.string().email("Invalid email format"),
  otp: z.string().length(6, "OTP must be 6 digits"),
});

// Forgot password validation
export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
});

// Reset password validation
export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z.string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password must be at most 100 characters"),
});

// Change password validation
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string()
    .min(6, "New password must be at least 6 characters")
    .max(100, "New password must be at most 100 characters"),
});

// Google login validation
export const googleLoginSchema = z.object({
  token: z.string().min(1, "Google token is required"),
});