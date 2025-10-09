export const COMMUNITY_ADMIN_ROUTES = {
  // Auth routes
  GET_STARTED: '/comms-admin/auth/get-started',
  LOGIN: '/comms-admin/login',
  FORGOT_PASSWORD: '/comms-admin/auth/forgot-password',
  VERIFY_OTP: '/comms-admin/auth/verify-otp',
  RESET_PASSWORD: '/comms-admin/auth/reset-password',
  
  // Registration flow
  CREATE_COMMUNITY: '/comms-admin/auth/create-community',
  SET_PASSWORD: '/comms-admin/auth/set-password',
  COMMUNITY_VERIFY_OTP: '/comms-admin/auth/community-verify-otp',
  APPLICATION_SUBMITTED: '/comms-admin/auth/application-submitted',
  
  // Dashboard routes
  DASHBOARD: '/comms-admin',
  FEED: '/comms-admin/feed',
  PROFILE: '/comms-admin/profile',
  MEMBERS: '/comms-admin/members',
  CHAINCAST: '/comms-admin/chaincast',
  QUESTS: '/comms-admin/quests',
  SETTINGS: '/comms-admin/settings',
  PREMIUM: '/comms-admin/premium',
} as const

export type CommunityAdminRoutes = typeof COMMUNITY_ADMIN_ROUTES[keyof typeof COMMUNITY_ADMIN_ROUTES]