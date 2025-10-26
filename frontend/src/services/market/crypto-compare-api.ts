// CryptoCompare API utility functions
export interface CryptoCompareHistoricalData {
  Response: string
  Message: string
  HasWarning: boolean
  Type: number
  RateLimit: object
  Data: {
    Aggregated: boolean
    TimeFrom: number
    TimeTo: number
    Data: Array<{
      time: number
      high: number
      low: number
      open: number
      volumefrom: number
      volumeto: number
      close: number
      conversionType: string
      conversionSymbol: string
    }>
  }
}

export interface ChartDataPoint {
  timestamp: number
  date: string
  price: number
  volume: number
}

// CryptoCompare symbol mapping
const CRYPTOCOMPARE_SYMBOLS = {
  BTCUSDT: "BTC",
  ETHUSDT: "ETH",
  BNBUSDT: "BNB",
  ADAUSDT: "ADA",
  SOLUSDT: "SOL",
  DOTUSDT: "DOT",
  LINKUSDT: "LINK",
  MATICUSDT: "MATIC",
  AVAXUSDT: "AVAX",
  UNIUSDT: "UNI",
}

export async function fetchCryptoCompareHistoricalData(
  symbol: string,
  interval = "1h",
  limit = 24,
): Promise<ChartDataPoint[]> {
  try {
    const cryptoCompareSymbol =
      CRYPTOCOMPARE_SYMBOLS[symbol as keyof typeof CRYPTOCOMPARE_SYMBOLS] || symbol.replace("USDT", "")

    let endpoint = "histohour"
    let limitParam = limit

    if (interval === "1d" || interval === "24h") {
      endpoint = "histoday"
      limitParam = Math.min(limit, 30) // Max 30 days for daily data
    } else if (interval === "1w" || interval === "7d") {
      endpoint = "histoday"
      limitParam = Math.min(limit * 7, 200) // Convert weeks to days
    }

    const apiKey = process.env.CRYPTO_COMPARE_API
    if (!apiKey) {
      console.warn("CRYPTO_COMPARE_API key not found, using fallback data")
      return getFallbackChartData(symbol, limit)
    }

    const url = `https://min-api.cryptocompare.com/data/v2/${endpoint}?fsym=${cryptoCompareSymbol}&tsym=USD&limit=${limitParam}&api_key=${apiKey}`

    

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; CryptoApp/1.0)",
        Accept: "application/json",
      },
      next: { revalidate: 60 }, // Cache for 60 seconds
    })

    if (!response.ok) {
      console.error(`CryptoCompare API error: ${response.status} ${response.statusText}`)
      return getFallbackChartData(symbol, limit)
    }

    const data: CryptoCompareHistoricalData = await response.json()

    if (data.Response === "Error") {
      console.error("CryptoCompare API error:", data.Message)
      return getFallbackChartData(symbol, limit)
    }

    

    return data.Data.Data.map((point) => ({
      timestamp: point.time * 1000, // Convert to milliseconds
      date: new Date(point.time * 1000).toLocaleString(),
      price: point.close,
      volume: point.volumeto,
    }))
  } catch (error) {
    console.error("Error fetching CryptoCompare historical data:", error)
    return getFallbackChartData(symbol, limit)
  }
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
