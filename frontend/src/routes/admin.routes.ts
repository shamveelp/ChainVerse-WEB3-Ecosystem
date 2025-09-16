export const ADMIN_ROUTES = {
  // Auth routes
  LOGIN: '/admin/login',
  FORGOT_PASSWORD: '/admin/forgot-password',
  VERIFY_RESET_OTP: '/admin/verify-reset-otp',
  RESET_PASSWORD: '/admin/reset-password',
  
  // Dashboard routes
  DASHBOARD: '/admin',
  USERS: '/admin/users',
  COMMUNITIES: '/admin/communities',
  SETTINGS: '/admin/settings',
} as const

export type AdminRoutes = typeof ADMIN_ROUTES[keyof typeof ADMIN_ROUTES]