"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Wallet, TrendingUp, Calendar, Users, Download, Eye, ChevronLeft, ChevronRight, Loader2, RefreshCw, Shield } from "lucide-react";
import { getAllWallets, getWalletStats, exportWalletData } from "@/services/adminApiService";

interface WalletData {
  address: string;
  lastConnected: string;
  connectionCount: number;
  createdAt: string;
}

interface WalletStats {
  totalWallets: number;
  activeToday: number;
  activeThisWeek: number;
  activeThisMonth: number;
}

export default function WalletManagement() {
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [stats, setStats] = useState<WalletStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const walletsPerPage = 20;
  const router = useRouter();

  useEffect(() => {
    fetchWallets();
    fetchStats();
  }, [currentPage, searchTerm]);

  const fetchWallets = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAllWallets(currentPage, walletsPerPage, searchTerm);
      if (response.success) {
        setWallets(response.data.wallets || []);
        setTotalPages(Math.ceil(response.data.total / walletsPerPage) || 1);
      } else {
        throw new Error(response.error || "Failed to fetch wallets");
      }
    } catch (error) {
      const err = error as Error;
      console.error("Error fetching wallets:", err);
      setError(err.message || "Failed to fetch wallets. Please try again.");
      setWallets([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await getWalletStats();
      if (response.success) {
        setStats(response.data);
      } else {
        throw new Error(response.error || "Failed to fetch wallet stats");
      }
    } catch (error) {
      const err = error as Error;
      console.error("Error fetching wallet stats:", err);
      setError(err.message || "Failed to fetch wallet stats.");
    }
  };

  const handleExportData = async () => {
    try {
      const response = await exportWalletData();
      if (response.success) {
        const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `wallet-data-${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        throw new Error(response.error || "Failed to export wallet data");
      }
    } catch (error) {
      const err = error as Error;
      console.error("Error exporting data:", err);
      setError(err.message || "Failed to export wallet data.");
    }
  };

  const handleSearch = () => {
    setSearchTerm(searchInput.trim());
    setCurrentPage(1);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleViewWallet = (address: string) => {
    router.push(`/admin/wallet-management/${address}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const truncateAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const getPaginationButtons = () => {
    const buttons = [];
    const maxButtons = 5;
    const halfMax = Math.floor(maxButtons / 2);
    let startPage = Math.max(1, currentPage - halfMax);
    const endPage = Math.min(totalPages, startPage + maxButtons - 1);
    if (endPage - startPage < maxButtons - 1) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(i);
    }
    return buttons;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-600 bg-clip-text text-transparent flex items-center gap-3">
            <Wallet className="h-8 w-8 text-cyan-400" />
            Wallet Management
          </h1>
          <p className="text-slate-400 text-lg">
            Monitor and manage all Web3 ecosystem wallets
          </p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-2xl font-bold text-white">{stats?.totalWallets.toLocaleString() || 0}</p>
            <p className="text-sm text-slate-400">Total Wallets</p>
          </div>
          <Button
            onClick={fetchWallets}
            variant="outline"
            className="bg-slate-800/50 border-slate-600/50 hover:bg-slate-700/50 hover:border-cyan-400/50 text-slate-300 hover:text-cyan-400"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50">
            <CardContent className="p-6 flex items-center">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Wallet className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-400">Total Wallets</p>
                <p className="text-2xl font-bold text-white">{stats.totalWallets}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50">
            <CardContent className="p-6 flex items-center">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-400">Active Today</p>
                <p className="text-2xl font-bold text-white">{stats.activeToday}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50">
            <CardContent className="p-6 flex items-center">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-400">Active This Week</p>
                <p className="text-2xl font-bold text-white">{stats.activeThisWeek}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50">
            <CardContent className="p-6 flex items-center">
              <div className="p-3 bg-orange-500/20 rounded-lg">
                <Users className="h-6 w-6 text-orange-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-400">Active This Month</p>
                <p className="text-2xl font-bold text-white">{stats.activeThisMonth}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Export */}
      <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex-1 relative group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-cyan-400/70 group-focus-within:text-cyan-400 transition-colors" />
              <Input
                placeholder="Search wallet addresses..."
                value={searchInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10 bg-slate-800/50 border-slate-600/50 text-slate-100 placeholder:text-slate-500 focus:border-cyan-400/50 focus:ring-cyan-400/20 backdrop-blur-sm transition-all duration-300"
              />
              <div className="absolute inset-0 rounded-md bg-gradient-to-r from-cyan-400/0 via-cyan-400/5 to-cyan-400/0 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
            </div>
            <div className="flex gap-4">
              <Button
                onClick={handleSearch}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold px-6 transition-all duration-300 shadow-lg hover:shadow-cyan-400/25"
              >
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
              <Button
                onClick={handleExportData}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold px-6 transition-all duration-300 shadow-lg hover:shadow-cyan-400/25"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wallets Table */}
      <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50">
        <CardHeader className="border-b border-slate-700/50">
          <CardTitle className="text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-cyan-400" />
              Web3 Wallets Registry
            </div>
            <div className="text-sm text-slate-400 font-normal">
              {loading ? "Loading..." : `Showing ${((currentPage - 1) * walletsPerPage) + 1} - ${Math.min(currentPage * walletsPerPage, stats?.totalWallets || 0)} of ${stats?.totalWallets || 0} wallets`}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-400 mx-auto" />
                <span className="text-slate-400">Loading blockchain wallets...</span>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12 space-y-4">
              <Shield className="h-12 w-12 text-red-400 mx-auto" />
              <p className="text-red-400 mb-4">{error}</p>
              <Button
                onClick={fetchWallets}
                className="bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          ) : wallets.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <Wallet className="h-12 w-12 text-slate-600 mx-auto" />
              <p className="text-slate-400">
                {searchTerm ? `No wallets found matching "${searchTerm}"` : "No wallets found in the ecosystem"}
              </p>
              {searchTerm && (
                <Button
                  onClick={() => {
                    setSearchInput("");
                    setSearchTerm("");
                    setCurrentPage(1);
                  }}
                  variant="outline"
                  className="bg-slate-800/50 border-slate-600/50 hover:bg-slate-700/50"
                >
                  Clear Search
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700/50 bg-slate-800/30">
                      <th className="text-left py-4 px-6 text-slate-400 font-medium">Wallet Address</th>
                      <th className="text-left py-4 px-6 text-slate-400 font-medium">Last Connected</th>
                      <th className="text-left py-4 px-6 text-slate-400 font-medium">Connections</th>
                      <th className="text-left py-4 px-6 text-slate-400 font-medium">First Connected</th>
                      <th className="text-left py-4 px-6 text-slate-400 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wallets.map((wallet) => (
                      <tr
                        key={wallet.address}
                        className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors group"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-400 to-purple-600 flex items-center justify-center text-slate-900 font-bold">
                              {wallet.address.charAt(2).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-white font-medium">{truncateAddress(wallet.address)}</p>
                              <p className="text-xs text-slate-400 font-mono">{wallet.address}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <p className="text-slate-300 text-sm">{formatDate(wallet.lastConnected)}</p>
                        </td>
                        <td className="py-4 px-6">
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            {wallet.connectionCount}
                          </Badge>
                        </td>
                        <td className="py-4 px-6">
                          <p className="text-slate-300 text-sm">{formatDate(wallet.createdAt)}</p>
                        </td>
                        <td className="py-4 px-6">
                          <Button
                            variant="outline"
                            onClick={() => handleViewWallet(wallet.address)}
                            className="bg-slate-800/50 border-slate-600/50 hover:bg-slate-700/50 hover:border-cyan-400/50 text-slate-300 hover:text-cyan-400 transition-all duration-300"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-6 border-t border-slate-700/50 bg-slate-800/20">
                  <div className="text-sm text-slate-400">
                    Page {currentPage} of {totalPages} • Total {stats?.totalWallets || 0} wallets
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="bg-slate-800/50 border-slate-600/50 hover:bg-slate-700/50 hover:border-cyan-400/50 text-slate-300 hover:text-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {getPaginationButtons().map((pageNum) => (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          onClick={() => setCurrentPage(pageNum)}
                          className={
                            currentPage === pageNum
                              ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
                              : "bg-slate-800/50 border-slate-600/50 hover:bg-slate-700/50 hover:border-cyan-400/50 text-slate-300 hover:text-cyan-400"
                          }
                          size="sm"
                        >
                          {pageNum}
                        </Button>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="bg-slate-800/50 border-slate-600/50 hover:bg-slate-700/50 hover:border-cyan-400/50 text-slate-300 hover:text-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}