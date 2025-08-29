import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email format").nonempty("Email is required"),
  password: z.string().nonempty("Password is required"),
});

export const registerSchema = z.object({
  username: z
    .string()
    .min(4, "Username must be at least 4 characters long")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
    .nonempty("Username is required"),
  name: z
    .string()
    .min(2, "Name must be at least 2 characters long")
    .nonempty("Name is required"),
  email: z.string().email("Invalid email format").nonempty("Email is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    )
    .nonempty("Password is required"),
  referralCode: z
    .string()
    .optional()
    .refine(
      (value) => !value || /^[a-zA-Z0-9]{8}$/.test(value),
      {
        message: "Referral code must be 8 characters long and contain only letters and numbers",
      }
    ),
});

export const verifyOtpSchema = z.object({
  username: z
    .string()
    .min(4, "Username must be at least 4 characters long")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
    .nonempty("Username is required"),
  name: z
    .string()
    .min(2, "Name must be at least 2 characters long")
    .nonempty("Name is required"),
  email: z.string().email("Invalid email format").nonempty("Email is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    )
    .nonempty("Password is required"),
  otp: z.string().length(6, "OTP must be 6 digits").regex(/^\d{6}$/, "OTP must be numeric"),
  referralCode: z
    .string()
    .optional()
    .refine(
      (value) => !value || /^[a-zA-Z0-9]{8}$/.test(value),
      {
        message: "Referral code must be 8 characters long and contain only letters and numbers",
      }
    ),
});

export const checkUsernameSchema = z.object({
  username: z
    .string()
    .min(4, "Username must be at least 4 characters long")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
    .nonempty("Username is required"),
});