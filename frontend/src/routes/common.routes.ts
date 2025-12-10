export const COMMON_ROUTES = {
  HOME: '/',
  TERMS: '/terms',
  PRIVACY: '/privacy',
  ABOUT: '/about-us',
  MARKET: '/user/market',

  // Trade
  SWAP: '/trade/swap',
  BRIDGE: '/trade/bridge',
  BUY: '/trade/buy',
  LIQUIDITY: '/trade/liquidity',
  CHART: '/chart',

  // NFT



  // Footer / Misc
  GET_STARTED: '/get-started',
  HELP: '/help',
  DOCS: '/docs',
  CONTACT: '/contact',
  STATUS: '/status',
  BLOG: '/blog',
} as const

export type CommonRoutes = typeof COMMON_ROUTES[keyof typeof COMMON_ROUTES]