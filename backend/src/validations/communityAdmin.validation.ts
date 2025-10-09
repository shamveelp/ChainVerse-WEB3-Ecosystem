import { z } from 'zod';

export const CreateCommunitySchema = z.object({
  communityName: z
    .string()
    .min(3, 'Community name must be at least 3 characters')
    .max(50, 'Community name must be at most 50 characters')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Community name can only contain letters, numbers, spaces, hyphens, and underscores'),
  
  email: z
    .string()
    .email('Please provide a valid email address')
    .toLowerCase(),
  
  username: z
    .string()
    .min(4, 'Username must be at least 4 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  
  walletAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Please provide a valid Ethereum wallet address'),
  
  description: z
    .string()
    .min(50, 'Description must be at least 50 characters')
    .max(500, 'Description must be at most 500 characters'),
  
  category: z
    .string()
    .min(2, 'Category is required'),
  
  whyChooseUs: z
    .string()
    .min(30, 'Why choose us must be at least 30 characters')
    .max(300, 'Why choose us must be at most 300 characters'),
  
  rules: z
    .array(z.string().min(1, 'Rule cannot be empty'))
    .min(1, 'At least one rule is required')
    .max(10, 'Maximum 10 rules allowed'),
  
  socialLinks: z.object({
    twitter: z.string().optional(),
    discord: z.string().optional(),
    telegram: z.string().optional(),
    website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  }).optional(),
  
  logo: z.string().optional(),
  banner: z.string().optional(),
});

export const SetPasswordSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      'Password must contain at least one uppercase letter, lowercase letter, number, and special character'
    ),
});

export const LoginSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const VerifyOTPSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  otp: z.string().length(6, 'OTP must be exactly 6 digits').regex(/^\d{6}$/, 'OTP must contain only numbers'),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
});

export const ResetPasswordSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      'Password must contain at least one uppercase letter, lowercase letter, number, and special character'
    ),
});

export const CheckEmailSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
});

export const CheckUsernameSchema = z.object({
  username: z
    .string()
    .min(4, 'Username must be at least 4 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
});

export const UpdateCommunitySchema = z.object({
  communityName: z.string().min(3).max(50).optional(),
  description: z.string().min(50).max(500).optional(),
  category: z.string().min(2).optional(),
  socialLinks: z.object({
    twitter: z.string().optional(),
    discord: z.string().optional(),
    telegram: z.string().optional(),
    website: z.string().url().optional().or(z.literal('')),
  }).optional(),
  logo: z.string().optional(),
  banner: z.string().optional(),
  settings: z.object({
    isPublic: z.boolean().optional(),
    allowInvites: z.boolean().optional(),
    moderationEnabled: z.boolean().optional(),
    autoApprove: z.boolean().optional(),
    requireEmailVerification: z.boolean().optional(),
  }).optional(),
});

export type CreateCommunityInput = z.infer<typeof CreateCommunitySchema>;
export type SetPasswordInput = z.infer<typeof SetPasswordSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type VerifyOTPInput = z.infer<typeof VerifyOTPSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export type CheckEmailInput = z.infer<typeof CheckEmailSchema>;
export type CheckUsernameInput = z.infer<typeof CheckUsernameSchema>;
export type UpdateCommunityInput = z.infer<typeof UpdateCommunitySchema>;