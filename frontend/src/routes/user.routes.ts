export const USER_ROUTES = {
  // Auth routes
  LOGIN: '/user/login',
  REGISTER: '/user/register',
  FORGOT_PASSWORD: '/user/forgot-password',
  VERIFY_OTP: '/user/verify-otp',
  RESET_PASSWORD: '/user/reset-password',

  // User dashboard routes
  DASHBOARD: '/user/dashboard',
  SETTINGS: '/user/settings',
  WALLET: '/user/wallet',
  TRADING: '/user/trading',
  PORTFOLIO: '/user/portfolio',
  QUESTS: '/user/quests',
  PROFILE_POINTS: '/my-profile/points',

  // community
  COMMUNITY: '/user/community',
  COMMUNITY_EXPLORE: '/user/community/explore',
  COMMUNITY_NOTIFICATIONS: '/user/community/notifications',
  COMMUNITY_MY_COMMUNITIES: '/user/community/communities',
  COMMUNITY_MESSAGES: '/user/community/messages',
  COMMUNITY_SETTINGS: '/user/community/settings',
  COMMUNITY_BOOKMARKS: '/user/community/bookmarks',

  // market
  MARKET: '/user/market',

  // nft trade
  NFT_MARKET: "/trade/nfts-marketplace",
  NFT_EXPLORE: "/trade/nfts-marketplace/explore",
  NFT_CREATE: "/trade/nfts-marketplace/create",
  NFT_PROFILE: "/trade/nfts-marketplace/profile",

  // trade
  SWAP: '/trade/swap',
  BRIDGE: '/trade/bridge',
  BUY: '/trade/buy',
  SELL: '/trade/sell',

  // 
  PROFILE: '/my-profile',



} as const

export type UserRoutes = typeof USER_ROUTES[keyof typeof USER_ROUTES]