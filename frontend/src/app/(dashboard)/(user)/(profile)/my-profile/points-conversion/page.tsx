"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Coins,
  ArrowRightLeft,
  Wallet,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Calculator,
  Zap
} from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/redux/store";
import { updateTotalPoints, setProfile } from "@/redux/slices/userProfileSlice";
import { pointsConversionApiService, ConversionRate, PointsConversion, ConversionStats } from "@/services/points/pointsConversionApiService";
import { userApiService } from "@/services/userApiServices";
import { format } from "date-fns";
import { useActiveAccount, useSendTransaction } from "thirdweb/react";
import { getContract, prepareContractCall, readContract } from "thirdweb";
import { client } from "@/lib/thirdweb-client";
import { sepolia } from "thirdweb/chains";
import { ethers } from "ethers";
import TradeNavbar from "@/components/shared/TradeNavbar";

// CVC Contract ABI (minimal for claimTokens function)
const CVC_CONTRACT_ABI = [
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" }
    ],
    name: "claimTokens",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [],
    name: "claimFee",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  }
] as const;

export default function PointsConversionPage() {
  const dispatch = useDispatch();
  const { profile } = useSelector((state: RootState) => state.userProfile);
  const account = useActiveAccount();
  const { mutateAsync: sendTransaction } = useSendTransaction();

  const [conversionRate, setConversionRate] = useState<ConversionRate | null>(null);
  const [conversions, setConversions] = useState<PointsConversion[]>([]);
  const [stats, setStats] = useState<ConversionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [pointsToConvert, setPointsToConvert] = useState("");
  const [calculatedCVC, setCalculatedCVC] = useState(0);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [selectedConversion, setSelectedConversion] = useState<PointsConversion | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (page > 1) {
      fetchConversions();
    }
  }, [page]);

  useEffect(() => {
    validateAndCalculate();
  }, [pointsToConvert, conversionRate, profile]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchConversionRate(),
        fetchConversions(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchConversionRate = async () => {
    try {
      const result = await pointsConversionApiService.getCurrentRate();
      if (result.success && result.data) {
        setConversionRate(result.data);
      } else {
        toast.error("Failed to Load Rate", {
          description: result.error || "Could not fetch conversion rate. Please refresh.",
        });
      }
    } catch (error) {
      
      console.error("Fetch rate error:", error);
      toast.error("Error Loading Data", {
        description: "Failed to load conversion rate. Please try again.",
      });
    }
  };

  const fetchConversions = async (pageNum = 1) => {
    try {
      const result = await pointsConversionApiService.getUserConversions(pageNum, 10);
      if (result.success && result.data) {
        if (pageNum === 1) {
          setConversions(result.data.conversions);
        } else {
          setConversions(prev => [...prev, ...result.data!.conversions]);
        }
        setStats(result.data.stats);
        setTotal(result.data.total);
        setTotalPages(result.data.totalPages);
      } else {
        toast.error("Failed to Load Conversions", {
          description: result.error || "Could not fetch your conversion history.",
        });
      }
    } catch (err) {
      const error = err as Error;
      console.error("Fetch conversions error:", error);
      toast.error("Error Loading History", {
        description: "Failed to load conversion history. Please try again.",
      });
    }
  };

  const validateAndCalculate = () => {
    if (!pointsToConvert) {
      setCalculatedCVC(0);
      setValidationError(null);
      return;
    }

    const points = parseFloat(pointsToConvert);

    // Validations
    if (isNaN(points) || points <= 0) {
      setCalculatedCVC(0);
      setValidationError("Please enter a valid amount greater than 0");
      return;
    }

    if (profile && points > profile.totalPoints) {
      setValidationError(`Insufficient balance. You have ${profile.totalPoints} points.`);
    } else if (conversionRate && points < conversionRate.minimumPoints) {
      setValidationError(`Minimum amount is ${conversionRate.minimumPoints} points`);
    } else {
      setValidationError(null);
    }

    if (conversionRate) {
      const cvc = Math.floor(points / conversionRate.pointsPerCVC);
      setCalculatedCVC(cvc);
    }
  };

  const handleConvertPoints = async () => {
    if (!pointsToConvert || !conversionRate) {
      toast.error("Invalid Input", {
        description: "Please enter a valid amount of points to convert.",
      });
      return;
    }

    const points = parseFloat(pointsToConvert);

    if (points < conversionRate.minimumPoints) {
      toast.error("Minimum Points Required", {
        description: `You need at least ${conversionRate.minimumPoints} points to convert.`,
      });
      return;
    }

    if (!profile || profile.totalPoints < points) {
      toast.error("Insufficient Points", {
        description: `You only have ${profile?.totalPoints || 0} points available.`,
      });
      return;
    }

    try {
      setConverting(true);
      toast.loading("Processing Conversion...", {
        description: "Submitting your conversion request. Please wait.",
      });

      const result = await pointsConversionApiService.createConversion(points);

      if (result.success && result.data) {
        // Fetch fresh profile data to update points
        const profileResult = await userApiService.getProfile();
        if (profileResult.data) {
          dispatch(setProfile(profileResult.data));
        }

        toast.success("Conversion Request Submitted!", {
          description: result.data.message,
          duration: 5000,
        });

        setPointsToConvert("");
        setCalculatedCVC(0);
        await fetchConversions(1);
        setPage(1);
      } else {
        toast.error("Conversion Failed", {
          description: result.error || "Failed to create conversion request.",
        });
      }
    } catch (err) {
      const error = err as Error;
      console.error("Conversion error:", error);
      toast.error("Conversion Error", {
        description: error.message || "An unexpected error occurred. Please try again.",
      });
    } finally {
      setConverting(false);
    }
  };

  const handleClaimCVC = async (conversion: PointsConversion) => {
    if (!account?.address) {
      toast.error("Wallet Not Connected", {
        description: "Please connect your wallet first to claim CVC tokens.",
        action: {
          label: "Connect",
          onClick: () => {
            // Wallet connection is handled by TradeNavbar
          }
        }
      });
      return;
    }

    setSelectedConversion(conversion);
    setShowClaimModal(true);
  };

  const executeClaimCVC = async () => {
    if (!selectedConversion || !account?.address || !conversionRate) {
      toast.error("Missing Information", {
        description: "Please ensure all required information is available.",
      });
      return;
    }

    // Get contract address from rate or use fallback from config
    const contractAddress = conversionRate.cvcContractAddress || "0xF7BAdb1aE47768910edDF72cB39bF4C8B30173a8";

    if (!contractAddress || contractAddress === "undefined" || !contractAddress.startsWith("0x")) {
      toast.error("Invalid Contract Address", {
        description: "CVC contract address is not configured. Please contact support.",
      });
      return;
    }

    try {
      setClaiming(true);
      toast.loading("Preparing Claim Transaction...", {
        description: "Please confirm the transaction in your wallet.",
      });

      // Initialize contract
      const contract = getContract({
        client,
        address: contractAddress as `0x${string}`,
        chain: sepolia,
        abi: CVC_CONTRACT_ABI,
      });

      // Read current claim fee from contract
      let claimFee: bigint;
      try {
        const fee = await readContract({
          contract,
          method: "claimFee",
          params: [],
        });
        claimFee = fee as bigint;
      } catch (error) {
        // Fallback to rate config if contract read fails
        claimFee = ethers.parseEther(conversionRate.claimFeeETH);
      }

      // Convert CVC amount to wei (18 decimals)
      const cvcAmountInWei = ethers.parseUnits(selectedConversion.cvcAmount.toString(), 18);

      // Prepare contract call
      const transaction = prepareContractCall({
        contract,
        method: "claimTokens",
        params: [account.address as `0x${string}`, cvcAmountInWei],
        value: claimFee,
      });

      // Send transaction
      toast.loading("Transaction Pending...", {
        description: "Waiting for blockchain confirmation. This may take a moment.",
      });

      const result = await sendTransaction(transaction);
      const txHash = result.transactionHash;

      toast.success("Transaction Submitted!", {
        description: "Your claim transaction has been submitted. Waiting for confirmation...",
        duration: 3000,
      });

      // Wait for transaction confirmation
      toast.loading("Confirming Transaction...", {
        description: "Waiting for blockchain confirmation.",
      });

      // Wait a bit for confirmation (in production, you might want to poll)
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Update backend with transaction hash
      const apiResult = await pointsConversionApiService.claimCVC(
        selectedConversion.id,
        account.address,
        txHash
      );

      if (apiResult.success) {
        toast.success("CVC Claimed Successfully! 🎉", {
          description: `${selectedConversion.cvcAmount} CVC tokens have been sent to your wallet.`,
          duration: 6000,
          action: {
            label: "View TX",
            onClick: () => {
              window.open(`https://sepolia.etherscan.io/tx/${txHash}`, '_blank');
            }
          }
        });

        setShowClaimModal(false);
        setSelectedConversion(null);
        await fetchConversions(1);
        setPage(1);
      } else {
        toast.error("Backend Update Failed", {
          description: apiResult.error || "Transaction succeeded but failed to update records.",
        });
      }
    } catch (err) {
      const error = err as Error;
      console.error("Claim error:", error);
      // Handle user rejection
      if (error.message?.includes("rejected") || error.message?.includes("denied")) {
        toast.error("Transaction Rejected", {
          description: "You rejected the transaction. Please try again when ready.",
        });
      } else if (error.message?.includes("insufficient funds") || error.message?.includes("Insufficient fee")) {
        toast.error("Insufficient Funds", {
          description: `You need at least ${conversionRate.claimFeeETH} ETH to pay the claim fee.`,
        });
      } else {
        toast.error("Claim Failed", {
          description: error.message || "An error occurred while claiming CVC. Please try again.",
        });
      }
    } finally {
      setClaiming(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-400" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'claimed':
        return <Wallet className="h-4 w-4 text-blue-400" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-400" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-900/50 text-yellow-300';
      case 'approved':
        return 'bg-green-900/50 text-green-300';
      case 'claimed':
        return 'bg-blue-900/50 text-blue-300';
      case 'rejected':
        return 'bg-red-900/50 text-red-300';
      default:
        return 'bg-gray-900/50 text-gray-300';
    }
  };

  if (loading) {
    return <ConversionSkeleton />;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 relative">
      {/* Wallet Connection Component */}
      <TradeNavbar topOffset="top-4" />

      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
          Points to CVC Conversion
        </h1>
        <p className="text-slate-400">Convert your earned points to ChainVerse Coins</p>

        {conversionRate && (
          <div className="flex items-center justify-center gap-4 text-sm">
            <Badge className="bg-blue-900/50 text-blue-300">
              1 CVC = {conversionRate.pointsPerCVC} Points
            </Badge>
            <Badge className="bg-amber-900/50 text-amber-300">
              Fee: {conversionRate.claimFeeETH} ETH
            </Badge>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 backdrop-blur-md border-blue-800/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-sm font-medium flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4 text-blue-400" />
                Total Converted
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalPointsConverted}</div>
              <p className="text-blue-300 text-sm">Points Converted</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-600/20 to-teal-600/20 backdrop-blur-md border-emerald-800/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-sm font-medium flex items-center gap-2">
                <Wallet className="h-4 w-4 text-emerald-400" />
                Total Claimed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalCVCClaimed}</div>
              <p className="text-emerald-300 text-sm">CVC Claimed</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-600/20 to-orange-600/20 backdrop-blur-md border-amber-800/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-400" />
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.pendingConversions}</div>
              <p className="text-amber-300 text-sm">Awaiting Approval</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="convert" className="space-y-6">
        <TabsList className="grid grid-cols-2 w-full bg-slate-800/50">
          <TabsTrigger value="convert" className="text-slate-300 data-[state=active]:text-white">
            Convert Points
          </TabsTrigger>
          <TabsTrigger value="history" className="text-slate-300 data-[state=active]:text-white">
            Conversion History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="convert">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Conversion Form */}
            <Card className="bg-slate-800/50 backdrop-blur-md border-blue-800/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-cyan-400" />
                  Convert Points to CVC
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {!conversionRate?.isActive && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-300 text-sm">Points conversion is currently disabled</p>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Points to Convert</label>
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder="Enter points amount"
                        value={pointsToConvert}
                        onChange={(e) => setPointsToConvert(e.target.value)}
                        className={`bg-slate-700/50 border-slate-600/50 text-white placeholder:text-slate-400 pr-20 ${validationError ? "border-red-500/50 focus-visible:ring-red-500/20" : ""
                          }`}
                        disabled={!conversionRate?.isActive || converting}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                        Points
                      </div>
                    </div>
                    {validationError && (
                      <p className="text-red-400 text-sm flex items-center gap-1.5 mt-1">
                        <XCircle className="h-3.5 w-3.5" />
                        {validationError}
                      </p>
                    )}
                    {profile && (
                      <p className="text-slate-400 text-sm">
                        Available: {profile.totalPoints} points
                      </p>
                    )}
                  </div>

                  {calculatedCVC > 0 && (
                    <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/30">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300">You will receive:</span>
                        <div className="flex items-center gap-2">
                          <Coins className="h-5 w-5 text-cyan-400" />
                          <span className="text-xl font-bold text-white">{calculatedCVC} CVC</span>
                        </div>
                      </div>
                      {conversionRate && (
                        <div className="mt-2 pt-2 border-t border-slate-600/30 space-y-1 text-sm text-slate-400">
                          <div className="flex justify-between">
                            <span>Conversion Rate:</span>
                            <span>{conversionRate.pointsPerCVC} points = 1 CVC</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Claim Fee:</span>
                            <span>{conversionRate.claimFeeETH} ETH</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <Button
                    onClick={handleConvertPoints}
                    disabled={
                      converting ||
                      !conversionRate?.isActive ||
                      !pointsToConvert ||
                      parseFloat(pointsToConvert) <= 0 ||
                      calculatedCVC === 0 ||
                      !!validationError
                    }
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-3"
                  >
                    {converting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white mr-2"></div>
                        Creating Conversion...
                      </>
                    ) : (
                      <>
                        <ArrowRightLeft className="h-5 w-5 mr-2" />
                        Convert to CVC
                      </>
                    )}
                  </Button>

                  {conversionRate && (
                    <div className="text-xs text-slate-400 space-y-1">
                      <p>• Minimum {conversionRate.minimumPoints} points required</p>
                      <p>• Minimum {conversionRate.minimumCVC} CVC output</p>
                      <p>• Conversions require admin approval</p>
                      <p>• Additional claim fee applies when withdrawing CVC</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-md border-purple-800/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Zap className="h-5 w-5 text-purple-400" />
                  How It Works
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center text-white text-sm font-bold">1</div>
                    <div>
                      <h4 className="text-white font-medium">Convert Points</h4>
                      <p className="text-slate-400 text-sm">Submit your points for conversion to CVC tokens</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-white text-sm font-bold">2</div>
                    <div>
                      <h4 className="text-white font-medium">Admin Approval</h4>
                      <p className="text-slate-400 text-sm">Wait for admin to review and approve your conversion</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-bold">3</div>
                    <div>
                      <h4 className="text-white font-medium">Claim CVC</h4>
                      <p className="text-slate-400 text-sm">Connect your wallet and claim CVC tokens (fee applies)</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-700/30 rounded-lg p-4 mt-6">
                  <h5 className="text-white font-medium mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-400" />
                    Benefits
                  </h5>
                  <ul className="text-slate-300 text-sm space-y-1">
                    <li>• Trade CVC on exchanges</li>
                    <li>• Use in DeFi protocols</li>
                    <li>• Hold as investment</li>
                    <li>• Future utility features</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card className="bg-slate-800/50 backdrop-blur-md border-blue-800/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-400" />
                  Conversion History
                </div>
                <Button
                  onClick={() => fetchConversions(1)}
                  variant="outline"
                  size="sm"
                  className="border-blue-800/30 text-blue-300 hover:bg-blue-700/20"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {conversions.length === 0 ? (
                <div className="text-center py-12">
                  <ArrowRightLeft className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-slate-300 mb-2">No Conversions Yet</h3>
                  <p className="text-slate-400">Start converting your points to CVC tokens!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {conversions.map((conversion) => (
                    <div
                      key={conversion.id}
                      className="flex items-center justify-between p-4 bg-slate-900/30 rounded-lg border border-slate-700/50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-slate-800 rounded-lg">
                          {getStatusIcon(conversion.status)}
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-white font-medium">
                              {conversion.pointsConverted} Points → {conversion.cvcAmount} CVC
                            </span>
                            <Badge className={`${getStatusColor(conversion.status)} text-xs`}>
                              {conversion.status.charAt(0).toUpperCase() + conversion.status.slice(1)}
                            </Badge>
                          </div>
                          <p className="text-slate-400 text-sm">
                            {format(new Date(conversion.createdAt), "MMM dd, yyyy 'at' HH:mm")}
                          </p>
                          {conversion.adminNote && (
                            <p className="text-slate-300 text-sm mt-1">
                              Note: {conversion.adminNote}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        {conversion.status === 'approved' && (
                          <Button
                            onClick={() => handleClaimCVC(conversion)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Wallet className="h-4 w-4 mr-2" />
                            Claim CVC
                          </Button>
                        )}
                        {conversion.status === 'claimed' && conversion.transactionHash && (
                          <a
                            href={`https://sepolia.etherscan.io/tx/${conversion.transactionHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 text-sm underline"
                          >
                            View Transaction
                          </a>
                        )}
                      </div>
                    </div>
                  ))}

                  {page < totalPages && (
                    <div className="text-center pt-4">
                      <Button
                        onClick={() => setPage(prev => prev + 1)}
                        variant="outline"
                        className="border-blue-800/30 text-blue-300 hover:bg-blue-700/20"
                      >
                        Load More
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Claim Modal */}
      <Dialog open={showClaimModal} onOpenChange={setShowClaimModal}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Wallet className="h-5 w-5 text-green-400" />
              Claim CVC Tokens
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Claim your approved {selectedConversion?.cvcAmount} CVC tokens to your connected wallet
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {!account?.address && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-yellow-300 font-medium">Wallet Not Connected</p>
                  <p className="text-yellow-200/70 text-sm mt-1">
                    Please connect your wallet using the button in the top right corner to proceed with claiming.
                  </p>
                </div>
              </div>
            )}

            {selectedConversion && (
              <div className="bg-slate-800/50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">CVC Amount:</span>
                  <span className="text-white font-bold text-lg flex items-center gap-2">
                    <Coins className="h-5 w-5 text-cyan-400" />
                    {selectedConversion.cvcAmount} CVC
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Claim Fee:</span>
                  <span className="text-white font-semibold">
                    {conversionRate?.claimFeeETH || selectedConversion.claimFee} ETH
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Wallet Address:</span>
                  <span className="text-white font-mono text-sm">
                    {account?.address ? (
                      <span className="text-green-400">
                        {account.address.slice(0, 6)}...{account.address.slice(-4)}
                      </span>
                    ) : (
                      <span className="text-red-400">Not Connected</span>
                    )}
                  </span>
                </div>
                {conversionRate && (
                  <div className="pt-3 border-t border-slate-700/50">
                    <p className="text-xs text-slate-400">
                      The claim fee will be deducted from your wallet balance. Make sure you have sufficient ETH.
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowClaimModal(false);
                  setSelectedConversion(null);
                }}
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
                disabled={claiming}
              >
                Cancel
              </Button>
              <Button
                onClick={executeClaimCVC}
                disabled={claiming || !account?.address}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold"
              >
                {claiming ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Wallet className="h-4 w-4 mr-2" />
                    Claim CVC
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ConversionSkeleton() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <Skeleton className="h-12 w-96 mx-auto bg-slate-700" />
        <Skeleton className="h-6 w-64 mx-auto bg-slate-700" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="bg-slate-800/50">
            <CardHeader>
              <Skeleton className="h-5 w-32 bg-slate-700" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 bg-slate-700 mb-2" />
              <Skeleton className="h-4 w-24 bg-slate-700" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}