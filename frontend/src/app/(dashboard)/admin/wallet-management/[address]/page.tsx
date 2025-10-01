"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Wallet, 
  Activity, 
  Clock, 
  Hash, 
  ExternalLink, 
  RefreshCw, 
  Loader2, 
  Shield,
  Coins,
  Building,
  TrendingUp,
  Database,
  Globe,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { 
  getWalletDetails, 
  getWalletTransactions, 
  getWalletBlockchainTransactions,
  getWalletContractInteractions,
  refreshWalletData 
} from "@/services/adminApiService";

interface WalletDetails {
  address: string;
  lastConnected: string;
  connectionCount: number;
  createdAt: string;
  balance?: string;
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

interface BlockchainTransaction {
  hash: string;
  blockNumber: string;
  timeStamp: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasPrice: string;
  gasUsed: string;
  isError: string;
  contractAddress: string;
  functionName?: string;
  methodId?: string;
  input: string;
  transactionType: 'DEX' | 'NFT_MARKETPLACE' | 'TOKEN_A' | 'TOKEN_B' | 'OTHER';
}

interface ContractInteraction {
  contractAddress: string;
  contractName: string;
  transactionCount: number;
  transactions: BlockchainTransaction[];
}

export default function WalletDetails() {
  const params = useParams();
  const address = params.address as string;
  const [wallet, setWallet] = useState<WalletDetails | null>(null);
  const [appTransactions, setAppTransactions] = useState<Transaction[]>([]);
  const [blockchainTransactions, setBlockchainTransactions] = useState<BlockchainTransaction[]>([]);
  const [contractInteractions, setContractInteractions] = useState<ContractInteraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [blockchainLoading, setBlockchainLoading] = useState(false);
  const [contractLoading, setContractLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [blockchainPage, setBlockchainPage] = useState(1);
  const [blockchainTotalPages, setBlockchainTotalPages] = useState(1);
  const [blockchainTotal, setBlockchainTotal] = useState(0);
  const blockchainLimit = 10;

  useEffect(() => {
    if (address) {
      fetchWalletDetails();
      fetchAppTransactions();
    }
  }, [address]);

  useEffect(() => {
    if (address) {
      fetchBlockchainTransactions();
    }
  }, [address, blockchainPage]);

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

  const fetchAppTransactions = async () => {
    try {
      const response = await getWalletTransactions(address);
      if (response.success) {
        setAppTransactions(response.data.transactions || []);
      } else {
        console.warn("Failed to fetch app transactions:", response.error);
      }
    } catch (err: any) {
      console.warn("Error fetching app transactions:", err);
    }
  };

  const fetchBlockchainTransactions = async () => {
    try {
      setBlockchainLoading(true);
      const response = await getWalletBlockchainTransactions(address, blockchainPage, blockchainLimit);
      if (response.success) {
        setBlockchainTransactions(response.data.transactions || []);
        setBlockchainTotalPages(response.data.totalPages || 1);
        setBlockchainTotal(response.data.total || 0);
      } else {
        throw new Error(response.error || "Failed to fetch blockchain transactions");
      }
    } catch (err: any) {
      console.error("Error fetching blockchain transactions:", err);
      setError(err.message || "Failed to fetch blockchain transactions.");
    } finally {
      setBlockchainLoading(false);
    }
  };

  const fetchContractInteractions = async () => {
    try {
      setContractLoading(true);
      const response = await getWalletContractInteractions(address);
      if (response.success) {
        setContractInteractions(response.data || []);
      } else {
        throw new Error(response.error || "Failed to fetch contract interactions");
      }
    } catch (err: any) {
      console.error("Error fetching contract interactions:", err);
      setError(err.message || "Failed to fetch contract interactions.");
    } finally {
      setContractLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const response = await refreshWalletData(address);
      if (response.success) {
        await Promise.all([
          fetchWalletDetails(), 
          fetchAppTransactions(), 
          fetchBlockchainTransactions(),
          fetchContractInteractions()
        ]);
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

  const formatDate = (dateString: string | number) => {
    const timestamp = typeof dateString === 'string' ? parseInt(dateString) : dateString;
    const date = new Date(timestamp * 1000); // Convert to milliseconds
    return date.toLocaleDateString("en-US", {
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

  const truncateAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const formatEthValue = (weiValue: string) => {
    const eth = parseFloat(weiValue) / Math.pow(10, 18);
    return eth.toFixed(6);
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

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case "DEX":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "NFT_MARKETPLACE":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "TOKEN_A":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "TOKEN_B":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    }
  };

  const getEtherscanUrl = (txHash: string) => {
    return `https://sepolia.etherscan.io/tx/${txHash}`;
  };

  const getAddressUrl = (addr: string) => {
    return `https://sepolia.etherscan.io/address/${addr}`;
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
                Wallet Analytics
              </h1>
              <p className="text-slate-400 text-lg">
                Comprehensive blockchain analysis for {truncateAddress(wallet.address)}
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

        {/* Wallet Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50">
            <CardContent className="p-6 flex items-center">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Wallet className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-400">ETH Balance</p>
                <p className="text-2xl font-bold text-white">{wallet.balance || "0"} ETH</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50">
            <CardContent className="p-6 flex items-center">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-400">Total Connections</p>
                <p className="text-2xl font-bold text-white">{wallet.connectionCount}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50">
            <CardContent className="p-6 flex items-center">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <Clock className="h-6 w-6 text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-400">Last Connected</p>
                <p className="text-lg font-bold text-white">{formatDate(new Date(wallet.lastConnected).getTime() / 1000)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Wallet Address Card */}
        <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50 mb-8">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-4 bg-gradient-to-r from-cyan-400/20 to-blue-600/20 rounded-xl">
                <Wallet className="h-8 w-8 text-cyan-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-white mb-4">Wallet Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-slate-400 mb-1">Address</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-slate-100 font-mono break-all">{wallet.address}</p>
                      <a
                        href={getAddressUrl(wallet.address)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-400 mb-1">First Connected</p>
                    <p className="text-sm text-slate-100">{formatDate(new Date(wallet.createdAt).getTime() / 1000)}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for different transaction views */}
        <Tabs defaultValue="blockchain" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800/50 border-slate-700/50">
            <TabsTrigger 
              value="blockchain"
              className="text-slate-400 data-[state=active]:text-cyan-400 data-[state=active]:bg-slate-700/50"
              onClick={() => !blockchainTransactions.length && fetchBlockchainTransactions()}
            >
              <Globe className="h-4 w-4 mr-2" />
              Blockchain Transactions
            </TabsTrigger>
            <TabsTrigger 
              value="contracts"
              className="text-slate-400 data-[state=active]:text-cyan-400 data-[state=active]:bg-slate-700/50"
              onClick={() => !contractInteractions.length && fetchContractInteractions()}
            >
              <Building className="h-4 w-4 mr-2" />
              Contract Interactions
            </TabsTrigger>
            <TabsTrigger 
              value="app"
              className="text-slate-400 data-[state=active]:text-cyan-400 data-[state=active]:bg-slate-700/50"
            >
              <Database className="h-4 w-4 mr-2" />
              App Transactions
            </TabsTrigger>
          </TabsList>

          {/* Blockchain Transactions Tab */}
          <TabsContent value="blockchain">
            <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50">
              <CardHeader className="border-b border-slate-700/50">
                <CardTitle className="text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-cyan-400" />
                    Contract-Related Blockchain Transactions
                  </div>
                  <div className="text-sm text-slate-400 font-normal">
                    {blockchainLoading ? "Loading..." : `${blockchainTotal} transactions found`}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {blockchainLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center space-y-4">
                      <Loader2 className="h-8 w-8 animate-spin text-cyan-400 mx-auto" />
                      <span className="text-slate-400">Loading blockchain transactions...</span>
                    </div>
                  </div>
                ) : blockchainTransactions.length > 0 ? (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-700/50 bg-slate-800/30">
                            <th className="text-left py-4 px-6 text-slate-400 font-medium">Transaction</th>
                            <th className="text-left py-4 px-6 text-slate-400 font-medium">Type</th>
                            <th className="text-left py-4 px-6 text-slate-400 font-medium">From/To</th>
                            <th className="text-left py-4 px-6 text-slate-400 font-medium">Value (ETH)</th>
                            <th className="text-left py-4 px-6 text-slate-400 font-medium">Status</th>
                            <th className="text-left py-4 px-6 text-slate-400 font-medium">Time</th>
                            <th className="text-left py-4 px-6 text-slate-400 font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {blockchainTransactions.map((tx) => (
                            <tr
                              key={tx.hash}
                              className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors group"
                            >
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-2">
                                  <Hash className="h-4 w-4 text-cyan-400" />
                                  <span className="text-sm font-mono text-slate-100">
                                    {truncateHash(tx.hash)}
                                  </span>
                                </div>
                              </td>
                              <td className="py-4 px-6">
                                <Badge className={getTransactionTypeColor(tx.transactionType)}>
                                  {tx.transactionType.replace('_', ' ')}
                                </Badge>
                              </td>
                              <td className="py-4 px-6 text-sm text-slate-100 space-y-1">
                                <div>From: {truncateAddress(tx.from)}</div>
                                <div>To: {truncateAddress(tx.to)}</div>
                              </td>
                              <td className="py-4 px-6 text-sm text-slate-100">
                                {formatEthValue(tx.value)}
                              </td>
                              <td className="py-4 px-6">
                                <Badge className={tx.isError === '0' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}>
                                  {tx.isError === '0' ? 'Success' : 'Failed'}
                                </Badge>
                              </td>
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-1 text-sm text-slate-100">
                                  <Clock className="h-4 w-4 text-cyan-400" />
                                  {formatDate(tx.timeStamp)}
                                </div>
                              </td>
                              <td className="py-4 px-6">
                                <a
                                  href={getEtherscanUrl(tx.hash)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                  View
                                </a>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Blockchain Transactions Pagination */}
                    {blockchainTotalPages > 1 && (
                      <div className="flex items-center justify-between p-6 border-t border-slate-700/50 bg-slate-800/20">
                        <div className="text-sm text-slate-400">
                          Page {blockchainPage} of {blockchainTotalPages} • Total {blockchainTotal} transactions
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setBlockchainPage(Math.max(1, blockchainPage - 1))}
                            disabled={blockchainPage === 1 || blockchainLoading}
                            className="bg-slate-800/50 border-slate-600/50 hover:bg-slate-700/50 hover:border-cyan-400/50 text-slate-300 hover:text-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setBlockchainPage(Math.min(blockchainTotalPages, blockchainPage + 1))}
                            disabled={blockchainPage === blockchainTotalPages || blockchainLoading}
                            className="bg-slate-800/50 border-slate-600/50 hover:bg-slate-700/50 hover:border-cyan-400/50 text-slate-300 hover:text-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Next
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12 space-y-4">
                    <Globe className="h-12 w-12 text-slate-600 mx-auto" />
                    <p className="text-slate-400">No blockchain transactions found for your contracts.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contract Interactions Tab */}
          <TabsContent value="contracts">
            <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50">
              <CardHeader className="border-b border-slate-700/50">
                <CardTitle className="text-white flex items-center gap-2">
                  <Building className="h-5 w-5 text-cyan-400" />
                  Contract Interactions Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {contractLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center space-y-4">
                      <Loader2 className="h-8 w-8 animate-spin text-cyan-400 mx-auto" />
                      <span className="text-slate-400">Loading contract interactions...</span>
                    </div>
                  </div>
                ) : contractInteractions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {contractInteractions.map((interaction) => (
                      <Card key={interaction.contractAddress} className="bg-slate-800/50 border-slate-600/50">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-cyan-500/20 rounded-lg">
                              <Coins className="h-5 w-5 text-cyan-400" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-white mb-2">{interaction.contractName}</h3>
                              <p className="text-sm text-slate-400 font-mono mb-2">{truncateAddress(interaction.contractAddress)}</p>
                              <div className="flex items-center gap-4">
                                <div>
                                  <p className="text-lg font-bold text-cyan-400">{interaction.transactionCount}</p>
                                  <p className="text-xs text-slate-500">Transactions</p>
                                </div>
                                <a
                                  href={getAddressUrl(interaction.contractAddress)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-cyan-400 hover:text-cyan-300 transition-colors"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 space-y-4">
                    <Building className="h-12 w-12 text-slate-600 mx-auto" />
                    <p className="text-slate-400">No contract interactions found.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* App Transactions Tab */}
          <TabsContent value="app">
            <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50">
              <CardHeader className="border-b border-slate-700/50">
                <CardTitle className="text-white flex items-center gap-2">
                  <Database className="h-5 w-5 text-cyan-400" />
                  Application Transactions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {appTransactions.length > 0 ? (
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
                        {appTransactions.map((tx) => (
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
                                {formatDate(new Date(tx.timestamp).getTime() / 1000)}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <a
                                href={getEtherscanUrl(tx.transactionHash)}
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
                    <Database className="h-12 w-12 text-slate-600 mx-auto" />
                    <p className="text-slate-400">No application transactions found for this wallet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}