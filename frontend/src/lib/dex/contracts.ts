export const CONTRACTS = {
  coinA: '0xBcAA134722eb7307Ff50770bB3334eC4752f8067',
  coinB: '0x994f607b3601Ba8B01163e7BD038baf138Ed7a30',
  dex: '0x15e57a20cD6ABf16983CB6629Aa760D40ff8C232',
};

export const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function mint(address to, uint256 amount)'
];

export const DEX_ABI = [
  'function swapEthForTokens(address token, uint256 minTokens) payable',
  'function swapTokensForEth(address token, uint256 tokenAmount, uint256 minEth)',
  'function swapTokens(address tokenIn, address tokenOut, uint256 amountIn, uint256 minAmountOut)',
  'function addLiquidity(address token, uint256 tokenAmount) payable',
  'function removeLiquidity(address token, uint256 liquidityAmount)',
  'function addTokenLiquidity(uint256 coinAAmount, uint256 coinBAmount)',
  'function getPoolInfo() view returns (uint256, uint256, uint256, uint256, uint256, uint256)',
  'function getUserLiquidity(address token) view returns (uint256)',
  'function getTokenPoolUserLiquidity() view returns (uint256)',
  'function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) view returns (uint256)',
  'function pools(address token) view returns (uint256 ethReserve, uint256 tokenReserve, uint256 totalLiquidity)',
  'function tokenPool() view returns (uint256 coinAReserve, uint256 coinBReserve, uint256 totalLiquidity)',
  'event EthToTokenSwap(address indexed user, address indexed token, uint256 ethIn, uint256 tokensOut)',
  'event TokenToEthSwap(address indexed user, address indexed token, uint256 tokensIn, uint256 ethOut)',
  'event TokenToTokenSwap(address indexed user, uint256 tokenAIn, uint256 tokenBOut)',
  'event LiquidityAdded(address indexed user, address indexed token, uint256 ethAmount, uint256 tokenAmount)'
];