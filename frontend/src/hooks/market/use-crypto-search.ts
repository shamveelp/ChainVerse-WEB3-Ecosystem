"use client"

import { useState, useMemo, useCallback } from "react"
import type { CryptoDataWithChanges } from "@/hooks/market/use-crypto-data"

export type SortOption = "name" | "price" | "change" | "volume" | "marketCap"
export type SortDirection = "asc" | "desc"

export function useCryptoSearch(data: CryptoDataWithChanges[]) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("marketCap")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [showOnlyPositive, setShowOnlyPositive] = useState(false)

  const parseVolumeToNumber = useCallback((volume: string): number => {
    const num = Number.parseFloat(volume.replace(/[^0-9.]/g, ""))
    if (volume.includes("B")) return num * 1e9
    if (volume.includes("M")) return num * 1e6
    if (volume.includes("K")) return num * 1e3
    return num
  }, [])

  const filteredAndSortedData = useMemo(() => {
    let filtered = data

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (crypto) =>
          crypto.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          crypto.symbol.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Apply positive change filter
    if (showOnlyPositive) {
      filtered = filtered.filter((crypto) => crypto.isPositive)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: number
      let bValue: number

      switch (sortBy) {
        case "name":
          return sortDirection === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)

        case "price":
          aValue = Number.parseFloat(a.price.replace(/,/g, ""))
          bValue = Number.parseFloat(b.price.replace(/,/g, ""))
          break

        case "change":
          aValue = Number.parseFloat(a.changePercent.replace(/[+%]/g, ""))
          bValue = Number.parseFloat(b.changePercent.replace(/[+%]/g, ""))
          break

        case "volume":
          aValue = parseVolumeToNumber(a.volume)
          bValue = parseVolumeToNumber(b.volume)
          break

        case "marketCap":
          aValue = parseVolumeToNumber(a.marketCap)
          bValue = parseVolumeToNumber(b.marketCap)
          break

        default:
          return 0
      }

      return sortDirection === "asc" ? aValue - bValue : bValue - aValue
    })

    return filtered
  }, [data, searchTerm, sortBy, sortDirection, showOnlyPositive, parseVolumeToNumber])

  const toggleSort = useCallback(
    (option: SortOption) => {
      if (sortBy === option) {
        setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
      } else {
        setSortBy(option)
        setSortDirection("desc")
      }
    },
    [sortBy],
  )

  const memoizedSetSearchTerm = useCallback((term: string) => {
    setSearchTerm(term)
  }, [])

  return {
    searchTerm,
    setSearchTerm: memoizedSetSearchTerm,
    sortBy,
    sortDirection,
    showOnlyPositive,
    setShowOnlyPositive,
    toggleSort,
    filteredData: filteredAndSortedData,
    resultCount: filteredAndSortedData.length,
    totalCount: data.length,
  }
}
