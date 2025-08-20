import { NextResponse } from "next/server"
import { fetchBinanceData } from "@/services/market/binance-api"

export async function GET() {
  try {
    const data = await fetchBinanceData()
    return NextResponse.json(data)
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Failed to fetch cryptocurrency data" }, { status: 500 })
  }
}
