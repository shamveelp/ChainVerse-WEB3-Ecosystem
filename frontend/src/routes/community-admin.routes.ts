export const COMMUNITY_ADMIN_ROUTES = {
  // Auth routes
  GET_STARTED: '/comms-admin/get-started',
  LOGIN: '/comms-admin/login',
  FORGOT_PASSWORD: '/comms-admin/forgot-password',
  VERIFY_OTP: '/comms-admin/verify-otp',
  RESET_PASSWORD: '/comms-admin/reset-password',
  
  // Registration flow
  CREATE_COMMUNITY: '/comms-admin/create-community',
  SET_PASSWORD: '/comms-admin/set-password',
  COMMUNITY_VERIFY_OTP: '/comms-admin/community-verify-otp',
  APPLICATION_SUBMITTED: '/comms-admin/application-submitted',
  
  // Dashboard routes
  DASHBOARD: '/comms-admin/dashboard',
  COMMUNITY_SETTINGS: '/comms-admin/settings',
  MEMBERS: '/comms-admin/members',
  ANALYTICS: '/comms-admin/analytics',
} as const

export type CommunityAdminRoutes = typeof COMMUNITY_ADMIN_ROUTES[keyof typeof COMMUNITY_ADMIN_ROUTES]