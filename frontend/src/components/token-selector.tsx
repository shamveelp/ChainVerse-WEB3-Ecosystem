"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Star } from 'lucide-react'
import { useState } from "react"

interface Token {
  symbol: string
  name: string
  balance: string
  price: string
  icon: string
  color: string
}

interface TokenSelectorProps {
  isOpen: boolean
  onClose: () => void
  tokens: Token[]
  onSelect: (token: Token) => void
  title: string
}

export default function TokenSelector({ isOpen, onClose, tokens, onSelect, title }: TokenSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredTokens = tokens.filter(token =>
    token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const popularTokens = tokens.slice(0, 4)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search tokens..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-900 border-slate-600 text-white placeholder-slate-400"
          />
        </div>

        {/* Popular Tokens */}
        {!searchQuery && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium text-slate-300">Popular</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {popularTokens.map((token) => (
                <Button
                  key={token.symbol}
                  variant="ghost"
                  onClick={() => onSelect(token)}
                  className="flex items-center gap-2 p-3 h-auto bg-slate-900/50 hover:bg-slate-700 rounded-xl"
                >
                  <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${token.color} flex items-center justify-center text-sm`}>
                    {token.icon}
                  </div>
                  <span className="font-medium">{token.symbol}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Token List */}
        <div className="space-y-1 max-h-80 overflow-y-auto">
          {filteredTokens.map((token) => (
            <Button
              key={token.symbol}
              variant="ghost"
              onClick={() => onSelect(token)}
              className="w-full flex items-center justify-between p-4 h-auto hover:bg-slate-700 rounded-xl"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${token.color} flex items-center justify-center text-lg`}>
                  {token.icon}
                </div>
                <div className="text-left">
                  <div className="font-semibold">{token.symbol}</div>
                  <div className="text-sm text-slate-400">{token.name}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">{token.balance}</div>
                <div className="text-sm text-slate-400">{token.price}</div>
              </div>
            </Button>
          ))}
        </div>

        {filteredTokens.length === 0 && (
          <div className="text-center py-8 text-slate-400">
            <p>No tokens found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
