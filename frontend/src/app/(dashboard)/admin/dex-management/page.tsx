"use client";

import { useState, useEffect } from 'react';
import { Plus, Coins, TrendingUp, Activity, DollarSign, Search, Edit2, Trash2, ToggleLeft, ToggleRight, Wallet } from 'lucide-react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';

interface Coin {
  _id: string;
  name: string;
  symbol: string;
  ticker: string;
  contractAddress: string;
  decimals: number;
  totalSupply: string;
  circulatingSupply: string;
  isListed: boolean;
  priceUSD?: number;
  volume24h?: string;
  marketCap?: string;
  createdAt: string;
}

interface DexStats {
  totalCoins: number;
  listedCoins: number;
  totalTransactions: number;
  totalVolume: string;
  activeWallets: number;
}

interface CreateCoinData {
  name: string;
  symbol: string;
  ticker: string;
  totalSupply: string;
  decimals: number;
  description: string;
  logoUrl: string;
  website: string;
  twitter: string;
  telegram: string;
}

export default function DexManagement() {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [stats, setStats] = useState<DexStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  const [newCoin, setNewCoin] = useState<CreateCoinData>({
    name: '',
    symbol: '',
    ticker: '',
    totalSupply: '',
    decimals: 18,
    description: '',
    logoUrl: '',
    website: '',
    twitter: '',
    telegram: ''
  });

  useEffect(() => {
    fetchCoins();
    fetchStats();
  }, []);

  const fetchCoins = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/dex/coins?includeUnlisted=true');
      const data = await response.json();
      
      if (data.success) {
        setCoins(data.data);
      }
    } catch (error) {
      console.error('Error fetching coins:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/dex/stats');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleCreateCoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      setCreateLoading(true);
      const response = await fetch('/api/admin/dex/coins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCoin),
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Coin created successfully! You can now deploy it.');
        setShowCreateModal(false);
        setNewCoin({
          name: '',
          symbol: '',
          ticker: '',
          totalSupply: '',
          decimals: 18,
          description: '',
          logoUrl: '',
          website: '',
          twitter: '',
          telegram: ''
        });
        fetchCoins();
      } else {
        alert(data.error || 'Failed to create coin');
      }
    } catch (error) {
      console.error('Error creating coin:', error);
      alert('Error creating coin');
    } finally {
      setCreateLoading(false);
    }
  };

  const toggleCoinListing = async (contractAddress: string, currentStatus: boolean) => {
    try {
      const action = currentStatus ? 'unlist' : 'list';
      const response = await fetch(`/api/admin/dex/coins/${contractAddress}/${action}`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`Coin ${action}ed successfully`);
        fetchCoins();
      } else {
        alert(data.error || `Failed to ${action} coin`);
      }
    } catch (error) {
      console.error(`Error toggling coin listing:`, error);
      alert('Error updating coin status');
    }
  };

  const deleteCoin = async (contractAddress: string) => {
    if (!confirm('Are you sure you want to delete this coin? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/dex/coins/${contractAddress}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Coin deleted successfully');
        fetchCoins();
      } else {
        alert(data.error || 'Failed to delete coin');
      }
    } catch (error) {
      console.error('Error deleting coin:', error);
      alert('Error deleting coin');
    }
  };

  const filteredCoins = coins.filter(coin =>
    coin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coin.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coin.contractAddress.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">DEX Management</h1>
              <p className="text-gray-600">Manage coins, deployments, and DEX statistics</p>
            </div>
            <div className="flex items-center gap-4">
              {isConnected ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-2 bg-green-100 rounded-lg">
                    <Wallet className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-800">
                      {address?.substring(0, 6)}...{address?.substring(address.length - 4)}
                    </span>
                  </div>
                  <button
                    onClick={() => disconnect()}
                    className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => connect({ connector: injected() })}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Wallet className="h-4 w-4" />
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Coins className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Coins</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalCoins}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Listed Coins</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.listedCoins}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Activity className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Trades</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalTransactions}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Volume</p>
                  <p className="text-2xl font-bold text-gray-900">{parseFloat(stats.totalVolume).toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 bg-cyan-100 rounded-lg">
                  <Wallet className="h-6 w-6 text-cyan-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Wallets</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeWallets}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions Bar */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search coins..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create New Coin
            </button>
          </div>
        </div>

        {/* Coins Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">All Coins</h3>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading coins...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Coin
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contract Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Supply
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Decimals
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCoins.map((coin) => (
                    <tr key={coin._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Coins className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">{coin.name}</p>
                            <p className="text-xs text-gray-500">{coin.symbol}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm font-mono text-gray-900">
                          {coin.contractAddress ? 
                            `${coin.contractAddress.substring(0, 6)}...${coin.contractAddress.substring(coin.contractAddress.length - 4)}` 
                            : 'Not deployed'
                          }
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {parseInt(coin.totalSupply).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {coin.decimals}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          coin.isListed 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {coin.isListed ? 'Listed' : 'Unlisted'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(coin.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleCoinListing(coin.contractAddress, coin.isListed)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            disabled={!coin.contractAddress}
                          >
                            {coin.isListed ? (
                              <ToggleRight className="h-4 w-4" />
                            ) : (
                              <ToggleLeft className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => deleteCoin(coin.contractAddress)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  
                  {/* Add KUKA coin row */}
                  <tr className="hover:bg-gray-50 bg-blue-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                          <Coins className="h-4 w-4 text-yellow-600" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">KUKA Coin</p>
                          <p className="text-xs text-gray-500">KUKA</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-mono text-gray-900">0x556...B1F</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      1,000,000
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      18
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Listed
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      Original
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">System Coin</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
              
              {filteredCoins.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  {searchTerm ? 'No coins found matching your search.' : 'No coins created yet.'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Create Coin Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Create New Coin</h2>
                <p className="text-gray-600 mt-1">Define a new token for deployment</p>
              </div>
              
              <form onSubmit={handleCreateCoin} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Coin Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newCoin.name}
                      onChange={(e) => setNewCoin({...newCoin, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Bitcoin"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Symbol *
                    </label>
                    <input
                      type="text"
                      required
                      value={newCoin.symbol}
                      onChange={(e) => setNewCoin({...newCoin, symbol: e.target.value.toUpperCase()})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., BTC"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ticker *
                    </label>
                    <input
                      type="text"
                      required
                      value={newCoin.ticker}
                      onChange={(e) => setNewCoin({...newCoin, ticker: e.target.value.toUpperCase()})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., BTC"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Supply *
                    </label>
                    <input
                      type="number"
                      required
                      value={newCoin.totalSupply}
                      onChange={(e) => setNewCoin({...newCoin, totalSupply: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 1000000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Decimals
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="18"
                      value={newCoin.decimals}
                      onChange={(e) => setNewCoin({...newCoin, decimals: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Logo URL
                    </label>
                    <input
                      type="url"
                      value={newCoin.logoUrl}
                      onChange={(e) => setNewCoin({...newCoin, logoUrl: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newCoin.description}
                    onChange={(e) => setNewCoin({...newCoin, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe your token..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Website
                    </label>
                    <input
                      type="url"
                      value={newCoin.website}
                      onChange={(e) => setNewCoin({...newCoin, website: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Twitter
                    </label>
                    <input
                      type="text"
                      value={newCoin.twitter}
                      onChange={(e) => setNewCoin({...newCoin, twitter: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="@username"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telegram
                    </label>
                    <input
                      type="text"
                      value={newCoin.telegram}
                      onChange={(e) => setNewCoin({...newCoin, telegram: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="@channel"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {createLoading ? 'Creating...' : 'Create Coin'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}