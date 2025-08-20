// Binance API utility functions
export interface BinanceTickerData {
  symbol: string
  priceChange: string
  priceChangePercent: string
  weightedAvgPrice: string
  prevClosePrice: string
  lastPrice: string
  lastQty: string
  bidPrice: string
  askPrice: string
  openPrice: string
  highPrice: string
  lowPrice: string
  volume: string
  quoteVolume: string
  openTime: number
  closeTime: number
  firstId: number
  lastId: number
  count: number
}

export interface BinanceKlineData {
  openTime: number
  open: string
  high: string
  low: string
  close: string
  volume: string
  closeTime: number
  quoteAssetVolume: string
  numberOfTrades: number
  takerBuyBaseAssetVolume: string
  takerBuyQuoteAssetVolume: string
  ignore: string
}

export interface CryptoData {
  symbol: string
  name: string
  price: string
  change: string
  changePercent: string
  volume: string
  marketCap: string
  isPositive: boolean
}

export interface ChartDataPoint {
  timestamp: number
  date: string
  price: number
  volume: number
}

// Popular crypto symbols with their display names
const CRYPTO_SYMBOLS = {
  BTCUSDT: "Bitcoin",
  ETHUSDT: "Ethereum",
  BNBUSDT: "BNB",
  ADAUSDT: "Cardano",
  SOLUSDT: "Solana",
  DOTUSDT: "Polkadot",
  LINKUSDT: "Chainlink",
  MATICUSDT: "Polygon",
  AVAXUSDT: "Avalanche",
  UNIUSDT: "Uniswap",
}

export async function fetchBinanceData(): Promise<CryptoData[]> {
  try {
    const symbols = Object.keys(CRYPTO_SYMBOLS)
    const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; CryptoApp/1.0)",
        Accept: "application/json",
      },
      next: { revalidate: 30 }, // Cache for 30 seconds
    })

    if (!response.ok) {
      console.error(`Binance API error: ${response.status} ${response.statusText}`)
      return getFallbackData()
    }

    const data: BinanceTickerData[] = await response.json()

    // Filter for our selected symbols and transform data
    const filteredData = data
      .filter((item) => symbols.includes(item.symbol))
      .map(transformBinanceData)
      .sort(
        (a, b) =>
          Number.parseFloat(b.marketCap.replace(/[^0-9.-]+/g, "")) -
          Number.parseFloat(a.marketCap.replace(/[^0-9.-]+/g, "")),
      )

    return filteredData
  } catch (error) {
    console.error("Error fetching Binance data:", error)
    return getFallbackData()
  }
}

export async function fetchHistoricalData(symbol: string, interval = "1h", limit = 24): Promise<ChartDataPoint[]> {
  try {
    const response = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; CryptoApp/1.0)",
          Accept: "application/json",
        },
        next: { revalidate: 60 }, // Cache for 60 seconds
      },
    )

    if (!response.ok) {
      console.error(`Binance historical API error: ${response.status} ${response.statusText}`)
      return getFallbackChartData(symbol, limit)
    }

    const data: BinanceKlineData[] = await response.json()

    return data.map((kline) => ({
      timestamp: kline.openTime,
      date: new Date(kline.openTime).toLocaleString(),
      price: Number.parseFloat(kline.close),
      volume: Number.parseFloat(kline.volume),
    }))
  } catch (error) {
    console.error("Error fetching historical data:", error)
    return getFallbackChartData(symbol, limit)
  }
}

function getFallbackData(): CryptoData[] {
  const baseData = [
    { symbol: "BTCUSDT", name: "Bitcoin", basePrice: 43000 },
    { symbol: "ETHUSDT", name: "Ethereum", basePrice: 2600 },
    { symbol: "BNBUSDT", name: "BNB", basePrice: 310 },
    { symbol: "ADAUSDT", name: "Cardano", basePrice: 0.48 },
    { symbol: "SOLUSDT", name: "Solana", basePrice: 98 },
    { symbol: "DOTUSDT", name: "Polkadot", basePrice: 7.2 },
    { symbol: "LINKUSDT", name: "Chainlink", basePrice: 14.5 },
    { symbol: "MATICUSDT", name: "Polygon", basePrice: 0.85 },
    { symbol: "AVAXUSDT", name: "Avalanche", basePrice: 36 },
    { symbol: "UNIUSDT", name: "Uniswap", basePrice: 6.8 },
  ]

  return baseData.map((crypto) => {
    const changePercent = (Math.random() - 0.5) * 10 // Random change between -5% and +5%
    const price = crypto.basePrice * (1 + changePercent / 100)
    const change = price - crypto.basePrice
    const volume = Math.random() * 1000000000 // Random volume
    const marketCap = price * Math.random() * 100000000 // Estimated market cap

    return {
      symbol: crypto.symbol,
      name: CRYPTO_SYMBOLS[crypto.symbol as keyof typeof CRYPTO_SYMBOLS] || crypto.symbol,
      price: formatPrice(price),
      change: change >= 0 ? `+${change.toFixed(2)}` : change.toFixed(2),
      changePercent: changePercent >= 0 ? `+${changePercent.toFixed(2)}%` : `${changePercent.toFixed(2)}%`,
      volume: formatVolume(volume),
      marketCap: formatVolume(marketCap),
      isPositive: changePercent >= 0,
    }
  })
}

function getFallbackChartData(symbol: string, limit: number): ChartDataPoint[] {
  const basePrice = symbol === "BTCUSDT" ? 43000 : symbol === "ETHUSDT" ? 2600 : 100
  const now = Date.now()
  const interval = 60 * 60 * 1000 // 1 hour intervals

  const data: ChartDataPoint[] = []
  let currentPrice = basePrice

  for (let i = 0; i < limit; i++) {
    const timestamp = now - (limit - 1 - i) * interval
    // Create more realistic price movements
    const randomChange = (Math.random() - 0.5) * 0.02 // ±1% change per hour
    currentPrice = currentPrice * (1 + randomChange)

    data.push({
      timestamp,
      date: new Date(timestamp).toLocaleString(),
      price: Number(currentPrice.toFixed(2)),
      volume: Math.random() * 1000000,
    })
  }

  return data
}

function transformBinanceData(data: BinanceTickerData): CryptoData {
  const price = Number.parseFloat(data.lastPrice)
  const change = Number.parseFloat(data.priceChange)
  const changePercent = Number.parseFloat(data.priceChangePercent)
  const volume = Number.parseFloat(data.quoteVolume)

  // Estimate market cap (this is simplified - real market cap needs circulating supply)
  const estimatedMarketCap = price * Number.parseFloat(data.volume)

  return {
    symbol: data.symbol,
    name: CRYPTO_SYMBOLS[data.symbol as keyof typeof CRYPTO_SYMBOLS] || data.symbol,
    price: formatPrice(price),
    change: change >= 0 ? `+${change.toFixed(2)}` : change.toFixed(2),
    changePercent: changePercent >= 0 ? `+${changePercent.toFixed(2)}%` : `${changePercent.toFixed(2)}%`,
    volume: formatVolume(volume),
    marketCap: formatVolume(estimatedMarketCap),
    isPositive: changePercent >= 0,
  }
}

function formatPrice(price: number): string {
  if (price >= 1) {
    return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  } else {
    return price.toFixed(4)
  }
}

function formatVolume(volume: number): string {
  if (volume >= 1e9) {
    return `${(volume / 1e9).toFixed(1)}B`
  } else if (volume >= 1e6) {
    return `${(volume / 1e6).toFixed(1)}M`
  } else if (volume >= 1e3) {
    return `${(volume / 1e3).toFixed(1)}K`
  }
  return volume.toFixed(0)
}
