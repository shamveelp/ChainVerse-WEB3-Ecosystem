"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown, ArrowUpDown, ArrowUp, ArrowDown, Filter } from "lucide-react"
import type { SortOption, SortDirection } from "@/hooks/market/use-crypto-search"

interface CryptoFiltersProps {
  sortBy: SortOption
  sortDirection: SortDirection
  showOnlyPositive: boolean
  onToggleSort: (option: SortOption) => void
  onTogglePositive: (value: boolean) => void
  resultCount: number
  totalCount: number
}

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "marketCap", label: "Market Cap" },
  { value: "price", label: "Price" },
  { value: "change", label: "24h Change" },
  { value: "volume", label: "Volume" },
  { value: "name", label: "Name" },
]

export function CryptoFilters({
  sortBy,
  sortDirection,
  showOnlyPositive,
  onToggleSort,
  onTogglePositive,
  resultCount,
  totalCount,
}: CryptoFiltersProps) {
  const currentSortLabel = sortOptions.find((option) => option.value === sortBy)?.label || "Market Cap"

  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filters:</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 bg-transparent">
              Sort by {currentSortLabel}
              {sortDirection === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {sortOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => onToggleSort(option.value)}
                className="flex items-center justify-between"
              >
                <span>{option.label}</span>
                {sortBy === option.value && <ArrowUpDown className="h-3 w-3 text-primary" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center space-x-2">
          <Switch id="positive-only" checked={showOnlyPositive} onCheckedChange={onTogglePositive} />
          <Label htmlFor="positive-only" className="text-sm">
            Gainers only
          </Label>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-xs">
          {resultCount} of {totalCount} coins
        </Badge>
      </div>
    </div>
  )
}
