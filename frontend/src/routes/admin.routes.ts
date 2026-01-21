export const ADMIN_ROUTES = {
  // Auth routes
  LOGIN: '/admin/login',
  FORGOT_PASSWORD: '/admin/forgot-password',
  VERIFY_RESET_OTP: '/admin/verify-reset-otp',
  RESET_PASSWORD: '/admin/reset-password',

  // Dashboard routes
  DASHBOARD: '/admin',
  USERS: '/admin/users',
  USER_MANAGEMENT: '/admin/user-management',
  WALLET_MANAGEMENT: '/admin/wallet-management',
  POINTS_CONVERSION: '/admin/points-conversion',
  CVC_MANAGEMENT: '/management',

  // Market
  MARKET_MANAGEMENT: '/admin/market-management',

  // DEX
  DEX_MANAGEMENT: '/admin/dex-management',
  BUY_CRYPTO_MANAGEMENT: '/admin/buy-crypto-management',

  // NFT
  NFT_MARKETPLACE_MANAGEMENT: '/admin/nft-marketplace-management',
  NFT_MARKETPLACE_ENQUIRIES: '/admin/nft-marketplace-enquiries',

  // Community
  COMMUNITY_REQUESTS: '/admin/community-requests',
  COMMUNITY_MANAGEMENT: '/admin/community-management',
  COMMUNITY_POSTS: '/admin/community-posts',
  COMMUNITIES: '/admin/communities',
  SETTINGS: '/admin/settings',
  PROFILE: '/admin/profile',
  SUPPORT: '/admin/support',
} as const

export type AdminRoutes = typeof ADMIN_ROUTES[keyof typeof ADMIN_ROUTES]