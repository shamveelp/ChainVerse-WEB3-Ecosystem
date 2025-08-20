import { NextResponse } from "next/server"
import { fetchCryptoCompareHistoricalData } from "@/services/market/crypto-compare-api"

export async function GET(request: Request, { params }: { params: Promise<{ symbol: string }> }) {
  try {
    const { searchParams } = new URL(request.url)
    const interval = searchParams.get("interval") || "1h"
    const limit = Number.parseInt(searchParams.get("limit") || "24")

    const resolvedParams = await params
    const data = await fetchCryptoCompareHistoricalData(resolvedParams.symbol, interval, limit)
    return NextResponse.json(data)
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Failed to fetch historical data" }, { status: 500 })
  }
}
