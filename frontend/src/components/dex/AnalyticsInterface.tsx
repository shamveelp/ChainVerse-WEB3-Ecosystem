'use client';

import { BarChart3, TrendingUp, TrendingDown, DollarSign, Users, Activity } from 'lucide-react';

export default function AnalyticsInterface() {
  const topTokens = [
    { symbol: 'ETH', name: 'Ethereum', price: '$2,847.92', change: '+5.67%', volume: '$4.7M', isPositive: true },
    { symbol: 'CoinA', name: 'Coin Alpha', price: '$0.847', change: '+2.34%', volume: '$1.2M', isPositive: true },
    { symbol: 'CoinB', name: 'Coin Beta', price: '$1.234', change: '-1.23%', volume: '$890K', isPositive: false },
  ];

  const topPairs = [
    { pair: 'ETH/CoinA', volume: '$2.3M', apy: '24.5%', liquidity: '$12.4M' },
    { pair: 'ETH/CoinB', volume: '$1.8M', apy: '18.7%', liquidity: '$8.9M' },
    { pair: 'CoinA/CoinB', volume: '$945K', apy: '31.2%', liquidity: '$4.2M' },
  ];

  return (
    <div className="space-y-6">
      {/* Market Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm mb-1">Total Volume (24h)</p>
              <p className="text-2xl font-bold text-white">$8.9M</p>
              <p className="text-emerald-400 text-sm flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                +12.5%
              </p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm mb-1">Total Liquidity</p>
              <p className="text-2xl font-bold text-white">$28.9M</p>
              <p className="text-emerald-400 text-sm flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                +5.2%
              </p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm mb-1">Active Traders</p>
              <p className="text-2xl font-bold text-white">3,847</p>
              <p className="text-emerald-400 text-sm flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                +8.9%
              </p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm mb-1">Transactions</p>
              <p className="text-2xl font-bold text-white">12,456</p>
              <p className="text-emerald-400 text-sm flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                +15.3%
              </p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <Activity className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Top Tokens */}
      <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-blue-400" />
          Top Tokens
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-slate-400 text-sm">
                <th className="text-left pb-4">Token</th>
                <th className="text-right pb-4">Price</th>
                <th className="text-right pb-4">24h Change</th>
                <th className="text-right pb-4">Volume</th>
              </tr>
            </thead>
            <tbody className="space-y-2">
              {topTokens.map((token, index) => (
                <tr key={index} className="border-t border-slate-700/50">
                  <td className="py-3">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">
                        {token.symbol.charAt(0)}
                      </div>
                      <div>
                        <p className="text-white font-medium">{token.symbol}</p>
                        <p className="text-slate-400 text-sm">{token.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-right py-3">
                    <p className="text-white font-medium">{token.price}</p>
                  </td>
                  <td className="text-right py-3">
                    <p className={`font-medium flex items-center justify-end ${token.isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                      {token.isPositive ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {token.change}
                    </p>
                  </td>
                  <td className="text-right py-3">
                    <p className="text-white font-medium">{token.volume}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Trading Pairs */}
      <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center">
          <BarChart3 className="h-5 w-5 mr-2 text-blue-400" />
          Top Trading Pairs
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {topPairs.map((pair, index) => (
            <div key={index} className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
              <h4 className="text-white font-bold mb-3">{pair.pair}</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Volume (24h):</span>
                  <span className="text-white font-medium">{pair.volume}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">APY:</span>
                  <span className="text-emerald-400 font-medium">{pair.apy}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Liquidity:</span>
                  <span className="text-white font-medium">{pair.liquidity}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}