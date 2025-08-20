"use client"

import { CryptoCard } from "@/components/market/crypto-card"
import { useCryptoData } from "@/hooks/market/use-crypto-data"
import { useCryptoSearch } from "@/hooks/market/use-crypto-search"
import { CryptoFilters } from "@/components/market/crypto-filters"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { LiveStatusIndicator } from "@/components/market/live-status-indicator"
import { RefreshCw, Play, Pause } from "lucide-react"
import { useEffect } from "react"

interface CryptoGridProps {
  searchTerm: string
}

export function CryptoGrid({ searchTerm }: CryptoGridProps) {
  const { data, loading, error, isLive, lastUpdate, refetch, startUpdates, stopUpdates } = useCryptoData()

  const {
    sortBy,
    sortDirection,
    showOnlyPositive,
    setShowOnlyPositive,
    toggleSort,
    filteredData,
    resultCount,
    totalCount,
    setSearchTerm,
  } = useCryptoSearch(data)

  useEffect(() => {
    setSearchTerm(searchTerm)
  }, [searchTerm, setSearchTerm])

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Top Cryptocurrencies</h2>
        </div>
        <Alert>
          <AlertDescription className="flex items-center justify-between">
            <span>Failed to load cryptocurrency data: {error}</span>
            <Button variant="outline" size="sm" onClick={refetch}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Top Cryptocurrencies</h2>
        <div className="flex items-center gap-4">
          <LiveStatusIndicator isLive={isLive} lastUpdate={lastUpdate} />
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={isLive ? stopUpdates : startUpdates} className="h-8 px-2">
              {isLive ? (
                <>
                  <Pause className="h-4 w-4 mr-1" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-1" />
                  Resume
                </>
              )}
            </Button>
            <Button variant="ghost" size="sm" onClick={refetch} disabled={loading} className="h-8 w-8 p-0">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </div>

      {!loading && (
        <CryptoFilters
          sortBy={sortBy}
          sortDirection={sortDirection}
          showOnlyPositive={showOnlyPositive}
          onToggleSort={toggleSort}
          onTogglePositive={setShowOnlyPositive}
          resultCount={resultCount}
          totalCount={totalCount}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-[180px] w-full rounded-lg" />
            </div>
          ))
        ) : filteredData.length > 0 ? (
          filteredData.map((crypto) => <CryptoCard key={crypto.symbol} crypto={crypto} />)
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground text-lg">No cryptocurrencies found</p>
            <p className="text-sm text-muted-foreground mt-2">Try adjusting your search terms or filters</p>
          </div>
        )}
      </div>
    </div>
  )
}
