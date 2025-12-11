"use client"

import { useEffect, useMemo, useState } from "react"
import {
  getAdminMarketCoins,
  toggleAdminCoinListing,
  addCoinFromTopList,
  deleteAdminCoin,
} from "@/services/admin/adminMarketApiService"
import type { MarketCoin } from "@/types/user/market.types"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/admin/ui/table"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Loader2, Search, PlusCircle, Trash2, ArrowUpDown } from "lucide-react"
import { useDebounce } from "@/hooks/useDebounce"
import { fetchBinanceData } from "@/services/market/binance-api"
import type { CryptoData } from "@/services/market/binance-api"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type SortField = "createdAt" | "price" | "marketCap" | "name"
type SortDirection = "asc" | "desc"

const sortFieldOptions: { label: string; value: SortField }[] = [
  { label: "Newest", value: "createdAt" },
  { label: "Name", value: "name" },
  { label: "Price", value: "price" },
  { label: "Market Cap", value: "marketCap" },
]

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
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [topCoins, setTopCoins] = useState<CryptoData[]>([])
  const [addingSymbol, setAddingSymbol] = useState<string | null>(null)
  const [topSearch, setTopSearch] = useState("")
  const [sortField, setSortField] = useState<SortField>("createdAt")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

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
        const data = await fetchBinanceData({ symbols: null, limit: 100 })
        setTopCoins(data)
      } catch {
        // ignore
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

  const sortedCoins = useMemo(() => {
    const parseNumber = (value: string | number | undefined) => {
      if (value == null) return 0
      if (typeof value === "number") return value
      const cleaned = value.replace(/[^0-9.-]+/g, "")
      const num = Number.parseFloat(cleaned)
      return Number.isNaN(num) ? 0 : num
    }

    return [...coins].sort((a, b) => {
      if (sortField === "name") {
        return sortDirection === "asc"
          ? (a.name || "").localeCompare(b.name || "")
          : (b.name || "").localeCompare(a.name || "")
      }

      let aValue = 0
      let bValue = 0
      switch (sortField) {
        case "price":
          aValue = a.priceUSD ?? parseNumber(a.marketCap)
          bValue = b.priceUSD ?? parseNumber(b.marketCap)
          break
        case "marketCap":
          aValue = parseNumber(a.marketCap)
          bValue = parseNumber(b.marketCap)
          break
        case "createdAt":
        default:
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
          break
      }

      return sortDirection === "asc" ? aValue - bValue : bValue - aValue
    })
  }, [coins, sortField, sortDirection])

  const existingSymbols = useMemo(
    () => new Set(coins.map((c) => c.symbol?.toUpperCase())),
    [coins],
  )

  const filteredTopCoins = useMemo(() => {
    const term = topSearch.trim().toLowerCase()
    let list = topCoins
    if (term) {
      list = list.filter(
        (coin) =>
          coin.name.toLowerCase().includes(term) ||
          coin.symbol.toLowerCase().includes(term),
      )
    }
    return list.slice(0, 25)
  }, [topCoins, topSearch])

  const handleToggle = async (coin: MarketCoin) => {
    try {
      setToggling(coin.contractAddress)
      const updated = await toggleAdminCoinListing(coin.contractAddress, !coin.isListed)
      setCoins((prev) =>
        prev.map((c) => (c.contractAddress === updated.contractAddress ? updated : c)),
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

  const handleDelete = async (coin: MarketCoin) => {
    const confirmed = window.confirm(`Delete ${coin.name} from market?`)
    if (!confirmed) return
    try {
      setDeleting(coin.contractAddress)
      setError(null)
      await deleteAdminCoin(coin.contractAddress)
      await fetchCoins()
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to delete coin")
    } finally {
      setDeleting(null)
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
          <div className="flex flex-wrap items-center gap-4">
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
            <div className="flex items-center gap-2">
              <Select value={sortField} onValueChange={(value: SortField) => setSortField(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {sortFieldOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))}
              >
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && <div className="mb-4 text-sm text-red-500">{error}</div>}

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
                {loading && sortedCoins.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center">
                      <Loader2 className="mr-2 inline-block h-5 w-5 animate-spin" />
                      Loading coins...
                    </TableCell>
                  </TableRow>
                ) : sortedCoins.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      No coins found.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedCoins.map((coin) => (
                    <TableRow key={coin._id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{coin.name}</span>
                          <span className="text-xs text-muted-foreground">{coin.ticker}</span>
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
                          <Switch
                            checked={coin.isListed}
                            disabled={toggling === coin.contractAddress}
                            onCheckedChange={() => handleToggle(coin)}
                          />
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={deleting === coin.contractAddress}
                            onClick={() => handleDelete(coin)}
                          >
                            {deleting === coin.contractAddress ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Trash2 className="mr-1 h-4 w-4" />
                                Delete
                              </>
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex items-center justify-between">
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
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg font-semibold">Top Global Coins</CardTitle>
              <p className="text-xs text-muted-foreground">
                Search the live Binance feed and add coins to your market instantly.
              </p>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search global coins..."
                className="pl-8"
                value={topSearch}
                onChange={(e) => setTopSearch(e.target.value)}
              />
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
                  {filteredTopCoins.map((c) => {
                    const alreadyAdded = existingSymbols.has(c.symbol.toUpperCase())
                    return (
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
                          {alreadyAdded ? (
                            <Badge variant="outline">Added</Badge>
                          ) : (
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
                                  <PlusCircle className="mr-1 h-4 w-4" />
                                  Add
                                </>
                              )}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
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
