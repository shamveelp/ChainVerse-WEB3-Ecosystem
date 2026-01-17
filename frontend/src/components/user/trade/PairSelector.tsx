"use client";

import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

interface Coin {
  name: string;
  symbol: string;
  contractAddress: string;
  logoUrl?: string;
  isComingSoon?: boolean;
}

interface PairSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectToken: (token: Coin) => void;
  currentToken?: Coin | null;
  title: string;
}

export default function PairSelector({ isOpen, onClose, onSelectToken, currentToken, title }: PairSelectorProps) {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Static coins (Sepolia, KUKA, and fake "coming soon" coins)
  const staticCoins: Coin[] = [
    {
      name: 'Ethereum',
      symbol: 'ETH',
      contractAddress: 'ETH',
    },
    {
      name: 'KUKA Coin',
      symbol: 'KUKA',
      contractAddress: '0x556156751F9c85F1973284A07E60E796BC032B1F',
    },
    {
      name: 'Bitcoin',
      symbol: 'BTC',
      contractAddress: 'BTC_COMING_SOON',
      isComingSoon: true,
    },
    {
      name: 'USD Coin',
      symbol: 'USDC',
      contractAddress: 'USDC_COMING_SOON',
      isComingSoon: true,
    },
    {
      name: 'Dai Stablecoin',
      symbol: 'DAI',
      contractAddress: 'DAI_COMING_SOON',
      isComingSoon: true,
    },
  ];

  useEffect(() => {
    if (isOpen) {
      fetchCoins();
    }
  }, [isOpen]);

  const fetchCoins = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dex/pairs');

      // Check if response is OK and content-type is JSON
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Response is not JSON');
      }

      const data = await response.json();

      if (data.success) {
        const uniqueTokens = new Map<string, Coin>();

        // Add tokens from API
        data.data.forEach((pair: { token0: Coin; token1: Coin }) => {
          if (!uniqueTokens.has(pair.token0.symbol)) {
            uniqueTokens.set(pair.token0.symbol, {
              name: pair.token0.name,
              symbol: pair.token0.symbol,
              contractAddress: pair.token0.contractAddress,
              logoUrl: pair.token0.logoUrl,
            });
          }
          if (!uniqueTokens.has(pair.token1.symbol)) {
            uniqueTokens.set(pair.token1.symbol, {
              name: pair.token1.name,
              symbol: pair.token1.symbol,
              contractAddress: pair.token1.contractAddress,
              logoUrl: pair.token1.logoUrl,
            });
          }
        });

        // Combine API coins with static coins, prioritizing API coins
        const apiCoins = Array.from(uniqueTokens.values());
        const mergedCoins = [
          ...apiCoins,
          ...staticCoins.filter(
            (staticCoin) => !apiCoins.some((apiCoin) => apiCoin.symbol === staticCoin.symbol)
          ),
        ];
        setCoins(mergedCoins);
      } else {
        // Fallback to static coins if API data is not successful
        setCoins(staticCoins);
      }
    } catch (error: unknown) {
      console.error('Error fetching coins:', error);
      // Fallback to static coins on error
      setCoins(staticCoins);
    } finally {
      setLoading(false);
    }
  };

  const filteredCoins = coins.filter(coin =>
    coin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coin.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectToken = (token: Coin) => {
    if (!token.isComingSoon) {
      onSelectToken(token);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search tokens..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Token List */}
        <div className="overflow-y-auto max-h-96">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-400">Loading tokens...</p>
            </div>
          ) : (
            <div className="p-2">
              {filteredCoins.map((coin) => (
                <button
                  key={coin.contractAddress}
                  onClick={() => handleSelectToken(coin)}
                  disabled={coin.isComingSoon || currentToken?.contractAddress === coin.contractAddress}
                  className="w-full p-4 rounded-lg hover:bg-gray-700 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {coin.symbol.substring(0, 2)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{coin.name}</p>
                      <p className="text-gray-400 text-sm">{coin.symbol}</p>
                    </div>
                    {coin.isComingSoon ? (
                      <div className="text-yellow-400 text-sm">Coming Soon</div>
                    ) : currentToken?.contractAddress === coin.contractAddress ? (
                      <div className="text-blue-400 text-sm">Selected</div>
                    ) : null}
                  </div>
                </button>
              ))}

              {filteredCoins.length === 0 && (
                <div className="p-8 text-center text-gray-400">
                  {searchTerm ? 'No tokens found matching your search.' : 'No tokens available.'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}