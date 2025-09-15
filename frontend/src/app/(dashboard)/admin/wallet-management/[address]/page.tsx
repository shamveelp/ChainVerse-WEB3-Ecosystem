"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Wallet, Activity, Clock, Hash, ExternalLink, RefreshCw, Loader2, Shield } from "lucide-react";
import { getWalletDetails, getWalletTransactions, refreshWalletData } from "@/services/adminApiService";

interface WalletDetails {
  address: string;
  lastConnected: string;
  connectionCount: number;
  createdAt: string;
}

interface Transaction {
  transactionHash: string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  status: string;
  timestamp: string;
  network: string;
}

export default function WalletDetails() {
  const params = useParams();
  const address = params.address as string;
  const [wallet, setWallet] = useState<WalletDetails | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (address) {
      fetchWalletDetails();
      fetchTransactions();
    }
  }, [address]);

  const fetchWalletDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getWalletDetails(address);
      if (response.success) {
        setWallet(response.data);
      } else {
        throw new Error(response.error || "Failed to fetch wallet details");
      }
    } catch (err: any) {
      console.error("Error fetching wallet details:", err);
      setError(err.message || "Failed to fetch wallet details. Please try again.");
      setWallet(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      setTxLoading(true);
      const response = await getWalletTransactions(address);
      if (response.success) {
        setTransactions(response.data.transactions || []);
      } else {
        throw new Error(response.error || "Failed to fetch transactions");
      }
    } catch (err: any) {
      console.error("Error fetching transactions:", err);
      setError(err.message || "Failed to fetch transactions.");
    } finally {
      setTxLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const response = await refreshWalletData(address);
      if (response.success) {
        await Promise.all([fetchWalletDetails(), fetchTransactions()]);
      } else {
        throw new Error(response.error || "Failed to refresh wallet data");
      }
    } catch (err: any) {
      console.error("Error refreshing wallet data:", err);
      setError(err.message || "Failed to refresh wallet data.");
    } finally {
      setRefreshing(false);
    }
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

  const truncateHash = (hash: string) => {
    return `${hash.substring(0, 10)}...${hash.substring(hash.length - 8)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "failed":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900/80 p-6 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400 mx-auto" />
          <span className="text-slate-400">Loading wallet details...</span>
        </div>
      </div>
    );
  }

  if (!wallet || error) {
    return (
      <div className="min-h-screen bg-slate-900/80 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12 space-y-4">
            <Shield className="h-12 w-12 text-red-400 mx-auto" />
            <p className="text-red-400 mb-4">{error || "Wallet not found"}</p>
            <Link
              href="/admin/wallet-management"
              className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Wallet Management
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link
            href="/admin/wallet-management"
            className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Wallet Management
          </Link>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-600 bg-clip-text text-transparent flex items-center gap-3">
                <Wallet className="h-8 w-8 text-cyan-400" />
                Wallet Details
              </h1>
              <p className="text-slate-400 text-lg">
                Detailed information and transaction history for wallet {truncateHash(wallet.address)}
              </p>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
              className="bg-slate-800/50 border-slate-600/50 hover:bg-slate-700/50 hover:border-cyan-400/50 text-slate-300 hover:text-cyan-400 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Refresh Data
            </Button>
          </div>
        </div>

        {/* Wallet Info Card */}
        <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-4 bg-gradient-to-r from-cyan-400/20 to-blue-600/20 rounded-xl">
                <Wallet className="h-8 w-8 text-cyan-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-white mb-4">Wallet Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm font-medium text-slate-400 mb-1">Address</p>
                    <p className="text-sm text-slate-100 font-mono break-all">{wallet.address}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-400 mb-1">Total Connections</p>
                    <p className="text-lg font-semibold text-white">{wallet.connectionCount}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-400 mb-1">Last Connected</p>
                    <p className="text-sm text-slate-100">{formatDate(wallet.lastConnected)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-400 mb-1">First Connected</p>
                    <p className="text-sm text-slate-100">{formatDate(wallet.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions */}
        <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50">
          <CardHeader className="border-b border-slate-700/50">
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-cyan-400" />
              Transaction History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {txLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin text-cyan-400 mx-auto" />
                  <span className="text-slate-400">Loading transactions...</span>
                </div>
              </div>
            ) : transactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700/50 bg-slate-800/30">
                      <th className="text-left py-4 px-6 text-slate-400 font-medium">Transaction Hash</th>
                      <th className="text-left py-4 px-6 text-slate-400 font-medium">Pair</th>
                      <th className="text-left py-4 px-6 text-slate-400 font-medium">Amount</th>
                      <th className="text-left py-4 px-6 text-slate-400 font-medium">Status</th>
                      <th className="text-left py-4 px-6 text-slate-400 font-medium">Time</th>
                      <th className="text-left py-4 px-6 text-slate-400 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr
                        key={tx.transactionHash}
                        className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors group"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <Hash className="h-4 w-4 text-cyan-400" />
                            <span className="text-sm font-mono text-slate-100">
                              {truncateHash(tx.transactionHash)}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm text-slate-100">
                          {tx.fromToken} → {tx.toToken}
                        </td>
                        <td className="py-4 px-6 text-sm text-slate-100">
                          {tx.fromAmount} → {tx.toAmount}
                        </td>
                        <td className="py-4 px-6">
                          <Badge className={getStatusColor(tx.status)}>{tx.status}</Badge>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-1 text-sm text-slate-100">
                            <Clock className="h-4 w-4 text-cyan-400" />
                            {formatDate(tx.timestamp)}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <a
                            href={`https://sepolia.etherscan.io/tx/${tx.transactionHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors"
                          >
                            <ExternalLink className="h-4 w-4" />
                            View on Etherscan
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 space-y-4">
                <Activity className="h-12 w-12 text-slate-600 mx-auto" />
                <p className="text-slate-400">No transactions found for this wallet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}