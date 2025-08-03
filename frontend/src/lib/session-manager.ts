import { v4 as uuidv4 } from "uuid"

interface OtpSession {
  email: string
  type: "register" | "forgot-password"
}

interface ResetTokenSession {
  email: string
  resetToken: string
}

interface PasswordResetTokenData {
  token: string
}

const OTP_SESSION_PREFIX = "otp_session_"
const RESET_TOKEN_PREFIX = "reset_token_"
const PASSWORD_RESET_TOKEN_PREFIX = "password_reset_token_"

export const sessionManager = {
  generateSessionId: (): string => {
    return uuidv4()
  },

  // For OTP verification (registration/forgot password initial request)
  storeOtpSession: (sessionId: string, email: string, type: OtpSession["type"]) => {
    sessionStorage.setItem(`${OTP_SESSION_PREFIX}${sessionId}`, JSON.stringify({ email, type }))
  },
  getOtpSession: (sessionId: string): OtpSession | null => {
    const stored = sessionStorage.getItem(`${OTP_SESSION_PREFIX}${sessionId}`)
    return stored ? JSON.parse(stored) : null
  },
  clearOtpSession: (sessionId: string) => {
    sessionStorage.removeItem(`${OTP_SESSION_PREFIX}${sessionId}`)
  },

  // For storing the initial reset token received from forgot-password API
  storeResetToken: (sessionId: string, resetToken: string, email: string) => {
    sessionStorage.setItem(`${RESET_TOKEN_PREFIX}${sessionId}`, JSON.stringify({ email, resetToken }))
  },
  getResetToken: (sessionId: string): ResetTokenSession | null => {
    const stored = sessionStorage.getItem(`${RESET_TOKEN_PREFIX}${sessionId}`)
    return stored ? JSON.parse(stored) : null
  },
  clearResetToken: (sessionId: string) => {
    sessionStorage.removeItem(`${RESET_TOKEN_PREFIX}${sessionId}`)
  },

  // For storing the passwordResetToken received after verifying forgot-password OTP
  storePasswordResetToken: (sessionId: string, token: string) => {
    sessionStorage.setItem(`${PASSWORD_RESET_TOKEN_PREFIX}${sessionId}`, JSON.stringify({ token }))
  },
  getPasswordResetToken: (sessionId: string): string | null => {
    const stored = sessionStorage.getItem(`${PASSWORD_RESET_TOKEN_PREFIX}${sessionId}`)
    return stored ? (JSON.parse(stored) as PasswordResetTokenData).token : null
  },
  clearPasswordResetToken: (sessionId: string) => {
    sessionStorage.removeItem(`${PASSWORD_RESET_TOKEN_PREFIX}${sessionId}`)
  },
}
