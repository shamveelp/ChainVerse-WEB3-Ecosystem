export enum SuccessMessages {
    USER_REGISTERED = "User registered successfully",
    USER_LOGGED_IN = "User logged in successfully",
    USER_LOGGED_OUT = "User logged out successfully",
    EMAIL_VERIFIED = "Email verified successfully",
    OTP_SENT = "OTP sent successfully",
    PASSWORD_RESET = "Password reset successfully",
    ADMIN_LOGGED_IN = "Admin logged in successfully",
    ADMIN_LOGGED_OUT = "Admin logged out successfully"
}

export enum ErrorMessages {
    USER_ALREADY_EXISTS = "User already exists",
    INVALID_CREDENTIALS = "Invalid credentials",
    USER_NOT_FOUND = "User not found",
    INVALID_OTP = "Invalid or expired OTP",
    EMAIL_NOT_VERIFIED = "Email not verified",
    USER_BLOCKED = "User is blocked",
    USER_BANNED = "User is banned",
    INVALID_TOKEN = "Invalid token",
    TOKEN_EXPIRED = "Token expired",
    ADMIN_NOT_FOUND = "Admin not found",
    ADMIN_INACTIVE = "Admin account is inactive",
    SERVER_ERROR = "Internal server error",
    VALIDATION_ERROR = "Validation error",
    UNAUTHORIZED = "Unauthorized access"
}
