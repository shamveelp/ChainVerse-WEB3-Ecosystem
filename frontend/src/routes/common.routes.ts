export const COMMON_ROUTES = {
  HOME: '/',
  TERMS: '/terms',
  PRIVACY: '/privacy',
  ABOUT: '/about',
  MARKET: '/user/market',

  // Trade
  SWAP: '/trade/swap',
  BRIDGE: '/trade/bridge',
  BUY: '/trade/buy',
  LIQUIDITY: '/trade/liquidity',
  
  // NFT
  


} as const

export type CommonRoutes = typeof COMMON_ROUTES[keyof typeof COMMON_ROUTES]