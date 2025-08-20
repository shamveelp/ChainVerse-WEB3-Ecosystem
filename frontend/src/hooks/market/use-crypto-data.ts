"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import type { CryptoData } from "@/services/market/binance-api"

export interface CryptoDataWithChanges extends CryptoData {
  priceDirection?: "up" | "down" | "neutral"
  isUpdating?: boolean
}

export function useCryptoData() {
  const [data, setData] = useState<CryptoDataWithChanges[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLive, setIsLive] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const previousDataRef = useRef<CryptoDataWithChanges[]>([])
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchData = useCallback(async (isInitial = false) => {
    try {
      if (!isInitial) {
        // Mark all items as updating for visual feedback
        setData((prev) => prev.map((item) => ({ ...item, isUpdating: true })))
      } else {
        setLoading(true)
      }

      setError(null)
      const response = await fetch("/api/crypto")

      if (!response.ok) {
        throw new Error("Failed to fetch data")
      }

      const cryptoData: CryptoData[] = await response.json()

      // Compare with previous data to detect price changes
      const dataWithChanges: CryptoDataWithChanges[] = cryptoData.map((newItem) => {
        const previousItem = previousDataRef.current.find((prev) => prev.symbol === newItem.symbol)
        let priceDirection: "up" | "down" | "neutral" = "neutral"

        if (previousItem) {
          const newPrice = Number.parseFloat(newItem.price.replace(/,/g, ""))
          const oldPrice = Number.parseFloat(previousItem.price.replace(/,/g, ""))

          if (newPrice > oldPrice) {
            priceDirection = "up"
          } else if (newPrice < oldPrice) {
            priceDirection = "down"
          }
        }

        return {
          ...newItem,
          priceDirection,
          isUpdating: false,
        }
      })

      setData(dataWithChanges)
      previousDataRef.current = dataWithChanges
      setLastUpdate(new Date())
      setIsLive(true)

      // Clear price direction after animation
      setTimeout(() => {
        setData((prev) => prev.map((item) => ({ ...item, priceDirection: "neutral" })))
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      setIsLive(false)
    } finally {
      setLoading(false)
    }
  }, [])

  const startRealTimeUpdates = useCallback(() => {
    intervalRef.current = setInterval(() => fetchData(false), 10000)
  }, [fetchData])

  const stopRealTimeUpdates = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setIsLive(false)
  }, [])

  useEffect(() => {
    fetchData(true)
    startRealTimeUpdates()

    // Handle visibility change to pause/resume updates
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopRealTimeUpdates()
      } else {
        fetchData(false)
        startRealTimeUpdates()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      stopRealTimeUpdates()
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [fetchData, startRealTimeUpdates, stopRealTimeUpdates])

  return {
    data,
    loading,
    error,
    isLive,
    lastUpdate,
    refetch: () => fetchData(false),
    startUpdates: startRealTimeUpdates,
    stopUpdates: stopRealTimeUpdates,
  }
}
