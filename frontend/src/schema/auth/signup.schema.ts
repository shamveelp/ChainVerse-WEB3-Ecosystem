import z from 'zod';

export const signupSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters long"),
    email: z.string().email("Invalid email address"),
    password: z.string()
        .min(8, "Password must be at least 8 characters long")
        .max(64, "Password must not exceed 64 characters")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[0-9]/, "Password must contain at least one number")
        .regex(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\\/?]/,"Password must contain at least one special character"),
    confirmPassword: z.string().min(8, "Confirm Password must be at least 8 characters long"),

})


export type SignupFormValues = z.infer<typeof signupSchema>;


