"use client"

import { useEffect, useMemo, useState } from "react"
import { getAdminMarketCoins, toggleAdminCoinListing, addCoinFromTopList } from "@/services/admin/adminMarketApiService"
import type { MarketCoin } from "@/services/marketApiService"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/admin/ui/table"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Loader2, Search, PlusCircle } from "lucide-react"
import { useDebounce } from "@/hooks/useDebounce"
import { fetchBinanceData } from "@/services/market/binance-api"
import type { CryptoData } from "@/services/market/binance-api"

const MarketManagePage = () => {
  const [coins, setCoins] = useState<MarketCoin[]>([])
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 300)
  const [showOnlyListed, setShowOnlyListed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [topCoins, setTopCoins] = useState<CryptoData[]>([])
  const [addingSymbol, setAddingSymbol] = useState<string | null>(null)

  const fetchCoins = async () => {
    try {
      setLoading(true)
      setError(null)

      const includeUnlisted = !showOnlyListed
      const res = await getAdminMarketCoins(page, limit, debouncedSearch, includeUnlisted)
      setCoins(res.coins)
      setTotalPages(res.totalPages || 1)
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load market coins")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCoins()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch, showOnlyListed])

  useEffect(() => {
    const loadTopCoins = async () => {
      try {
        const data = await fetchBinanceData()
        setTopCoins(data.slice(0, 10))
      } catch (err) {
        // Fail silently – admin table still works
      }
    }

    loadTopCoins()
  }, [])

  const stats = useMemo(() => {
    const total = coins.length
    const listed = coins.filter((c) => c.isListed).length
    const unlisted = total - listed
    return { total, listed, unlisted }
  }, [coins])

  const handleToggle = async (coin: MarketCoin) => {
    try {
      setToggling(coin.contractAddress)
      const updated = await toggleAdminCoinListing(coin.contractAddress, !coin.isListed)

      setCoins((prev) =>
        prev.map((c) => (c.contractAddress === updated.contractAddress ? updated : c))
      )
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to update listing status")
    } finally {
      setToggling(null)
    }
  }

  const handleAddFromTop = async (c: CryptoData) => {
    try {
      setAddingSymbol(c.symbol)
      setError(null)
      await addCoinFromTopList({
        symbol: c.symbol,
        name: c.name,
        priceUSD: Number.parseFloat(c.price.replace(/,/g, "")),
        volume24h: c.volume,
        marketCap: c.marketCap,
        network: "binance",
      })
      await fetchCoins()
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to add coin to market")
    } finally {
      setAddingSymbol(null)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-2xl font-bold">Market Management</CardTitle>
            <p className="text-sm text-muted-foreground">
              Curate exactly which coins appear on the user market — with instant search and listing control.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline">Total: {stats.total}</Badge>
              <Badge variant="outline">Listed: {stats.listed}</Badge>
              <Badge variant="outline">Unlisted: {stats.unlisted}</Badge>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, symbol or ticker"
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button
              type="button"
              variant={showOnlyListed ? "default" : "outline"}
              size="sm"
              onClick={() => setShowOnlyListed((prev) => !prev)}
            >
              {showOnlyListed ? "Showing listed only" : "Show listed only"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 text-sm text-red-500">
              {error}
            </div>
          )}

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Network</TableHead>
                  <TableHead>Price (USD)</TableHead>
                  <TableHead>Listed</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && coins.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin inline-block mr-2" />
                      Loading coins...
                    </TableCell>
                  </TableRow>
                ) : coins.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No coins found.
                    </TableCell>
                  </TableRow>
                ) : (
                  coins.map((coin) => (
                    <TableRow key={coin._id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{coin.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {coin.ticker}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{coin.symbol}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{coin.network}</Badge>
                      </TableCell>
                      <TableCell>
                        {coin.priceUSD != null ? `$${coin.priceUSD.toFixed(4)}` : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={coin.isListed ? "default" : "secondary"}>
                          {coin.isListed ? "Listed" : "Unlisted"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-3">
                          <span className="text-xs text-muted-foreground">
                            {coin.isListed ? "Visible in market" : "Hidden from market"}
                          </span>
                          <Switch
                            checked={coin.isListed}
                            disabled={toggling === coin.contractAddress}
                            onCheckedChange={() => handleToggle(coin)}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <span className="text-xs text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {topCoins.length > 0 && (
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">Top Global Coins</CardTitle>
              <p className="text-xs text-muted-foreground">
                Pick from live Binance top coins and add them to your market in one click.
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Coin</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>24h Change</TableHead>
                    <TableHead>Volume</TableHead>
                    <TableHead className="text-right">Add to Market</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topCoins.map((c) => (
                    <TableRow key={c.symbol}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{c.name}</span>
                          <span className="text-xs text-muted-foreground">{c.symbol}</span>
                        </div>
                      </TableCell>
                      <TableCell>${c.price}</TableCell>
                      <TableCell>
                        <Badge variant={c.isPositive ? "default" : "destructive"}>
                          {c.changePercent}
                        </Badge>
                      </TableCell>
                      <TableCell>{c.volume}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={addingSymbol === c.symbol}
                          onClick={() => handleAddFromTop(c)}
                        >
                          {addingSymbol === c.symbol ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <PlusCircle className="h-4 w-4 mr-1" />
                              Add
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default MarketManagePage
