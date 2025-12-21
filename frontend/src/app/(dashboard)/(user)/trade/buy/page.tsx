'use client';

import { useState, useEffect } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/redux/store';
import { ChevronDown, ArrowRightLeft, Info, Shield, Clock, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { dexApiService } from '@/services/dexApiService';
import TradeNavbar from '@/components/shared/TradeNavbar';
import Navbar from '@/components/home/navbar';
import Link from 'next/link';
import PillNavigation from '@/components/dex/PillNavigation';

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayErrorResponse {
  error: {
    code: string;
    description: string;
    source: string;
    step: string;
    reason: string;
    metadata: Record<string, unknown>;
  };
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill: {
    name: string;
    email: string;
  };
  theme: {
    color: string;
  };
  modal: {
    ondismiss: () => void;
  };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: (response: RazorpayErrorResponse) => void) => void;
}

interface RazorpayConstructor {
  new(options: RazorpayOptions): RazorpayInstance;
}

declare global {
  interface Window {
    Razorpay: RazorpayConstructor;
  }
}

interface Currency {
  code: 'INR' | 'USD' | 'RIY';
  name: string;
  symbol: string;
  available: boolean;
}

export default function BuyCryptoPage() {
  const account = useActiveAccount();
  const { user } = useSelector((state: RootState) => state.userAuth);

  const [selectedCurrency, setSelectedCurrency] = useState<Currency>({
    code: 'INR',
    name: 'Indian Rupee',
    symbol: '₹',
    available: true
  });

  const [amount, setAmount] = useState<string>('');
  const [estimatedEth, setEstimatedEth] = useState<number>(0);
  const [ethPrice, setEthPrice] = useState<number>(0);

  interface EstimateFees {
    estimatedEth: number;
    platformFee: number;
    actualEthToReceive: number;
  }

  const [fees, setFees] = useState<EstimateFees | null>(null);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const currencies: Currency[] = [
    { code: 'INR', name: 'Indian Rupee', symbol: '₹', available: true },
    { code: 'USD', name: 'US Dollar', symbol: '$', available: false },
    { code: 'RIY', name: 'Saudi Riyal', symbol: 'ر.س', available: false },
  ];

  // Load Razorpay script
  useEffect(() => {
    const loadRazorpayScript = () => {
      if (typeof window !== 'undefined' && !window.Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => {
          setScriptLoaded(true);

        };
        script.onerror = () => {
          console.error('Failed to load Razorpay script');
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load payment gateway. Please refresh and try again.",
          });
        };
        document.head.appendChild(script);
      } else if (window.Razorpay) {
        setScriptLoaded(true);

      }
    };

    loadRazorpayScript();
  }, []);

  // Load ETH price on component mount
  useEffect(() => {
    loadEthPrice();
  }, []);

  // Calculate estimate when amount changes
  useEffect(() => {
    if (amount && parseFloat(amount) > 0) {
      const timer = setTimeout(calculateEstimate, 500);
      return () => clearTimeout(timer);
    } else {
      setEstimatedEth(0);
      setFees(null);
    }
  }, [amount]);

  const loadEthPrice = async () => {
    try {
      const response = await dexApiService.getEthPrice();
      if (response.success && response.data?.price) {
        setEthPrice(response.data.price);
      } else {
        throw new Error('Invalid price response');
      }
    } catch (error) {
      console.error('Failed to load ETH price:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load current ETH price. Please try again.",
      });
      // Set fallback price
      setEthPrice(200000);
    }
  };

  const calculateEstimate = async () => {
    try {
      setCalculating(true);
      const response = await dexApiService.calculateEstimate(parseFloat(amount), selectedCurrency.code);

      if (response.success && response.data) {
        setEstimatedEth(response.data.estimatedEth);
        setFees(response.data);
      } else {
        throw new Error('Invalid estimate response');
      }
    } catch (error) {
      console.error('Failed to calculate estimate:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to calculate estimate. Please try again.",
      });
    } finally {
      setCalculating(false);
    }
  };

  const initiatePayment = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Login Required",
        description: "Please login to buy crypto.",
      });
      return;
    }

    if (!account?.address) {
      toast({
        variant: "destructive",
        title: "Wallet Required",
        description: "Please connect your wallet to buy crypto.",
      });
      return;
    }

    if (!amount || parseFloat(amount) < 100) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: "Minimum amount is ₹100.",
      });
      return;
    }

    if (selectedCurrency.code !== 'INR') {
      toast({
        variant: "destructive",
        title: "Currency Not Available",
        description: "Only INR is currently supported.",
      });
      return;
    }

    if (!scriptLoaded || !window.Razorpay) {
      toast({
        variant: "destructive",
        title: "Payment Gateway Loading",
        description: "Please wait for the payment gateway to load and try again.",
      });
      return;
    }

    setLoading(true);

    try {
      // Create payment order
      const orderResponse = await dexApiService.createPaymentOrder({
        walletAddress: account.address,
        currency: selectedCurrency.code,
        amountInCurrency: parseFloat(amount),
        estimatedEth,
        ethPriceAtTime: ethPrice
      });

      if (!orderResponse.success || !orderResponse.data) {
        throw new Error(orderResponse.error || 'Failed to create payment order');
      }

      // Get Razorpay key from environment or response
      const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

      if (!razorpayKey) {
        throw new Error('Razorpay configuration error. Please contact support.');
      }

      // Initialize Razorpay with proper error handling
      const options = {
        key: razorpayKey,
        amount: orderResponse.data.amount,
        currency: orderResponse.data.currency,
        name: 'ChainVerse Crypto',
        description: `Buy ${fees?.actualEthToReceive?.toFixed(6) || '0'} ETH`,
        order_id: orderResponse.data.orderId,
        handler: async function (response: RazorpayResponse) {
          try {
            setLoading(true);
            // Verify payment
            const verifyResponse = await dexApiService.verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            });

            if (verifyResponse.success) {
              toast({
                variant: "default",
                title: "Payment Successful!",
                description: "Your wallet will receive the crypto within 24 hours after approval.",
              });

              // Reset form
              setAmount('');
              setEstimatedEth(0);
              setFees(null);
            } else {
              throw new Error(verifyResponse.error || 'Payment verification failed');
            }
          } catch (error: unknown) {
            console.error('Payment verification error:', error);
            const errorMessage = error instanceof Error ? error.message : "Please contact support if amount was deducted.";
            toast({
              variant: "destructive",
              title: "Payment Verification Failed",
              description: errorMessage,
            });
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: {
          color: '#3B82F6'
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            toast({
              variant: "default",
              title: "Payment Cancelled",
              description: "Your payment was cancelled.",
            });
          }
        }
      };


      const razorpay = new window.Razorpay(options);

      razorpay.on('payment.failed', function (response: RazorpayErrorResponse) {
        console.error('Payment failed:', response.error);
        setLoading(false);
        toast({
          variant: "destructive",
          title: "Payment Failed",
          description: response.error.description || "Payment failed. Please try again.",
        });
      });

      razorpay.open();
    } catch (error: unknown) {
      console.error('Payment initiation failed:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to initiate payment. Please try again.";
      toast({
        variant: "destructive",
        title: "Payment Failed",
        description: errorMessage,
      });
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-screen bg-slate-950">
        <div className="flex-1 lg:ml-0">
          <Navbar />
          <TradeNavbar topOffset="top-16" />
          <div className="pt-20 px-6 flex items-center justify-center min-h-screen">
            <div className="text-center">
              <Shield className="h-16 w-16 text-cyan-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-2">Login Required</h1>
              <p className="text-gray-400">Please login to buy crypto</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
      <div className="flex-1 lg:ml-0">
        <Navbar />
        <TradeNavbar topOffset="top-16" />

        <div className="pt-32 px-6 pb-20">
          <div className="max-w-4xl mx-auto">

            <div className="mb-8 flex justify-center">
              <PillNavigation />
            </div>

            <div className="text-center mb-10">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-4">Buy Crypto</h1>
              <p className="text-gray-400 text-lg">Purchase Sepolia ETH with fiat currency</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Buy Form */}
              <div className="bg-slate-900/50 backdrop-blur-xl rounded-[24px] p-8 border border-slate-700/50 shadow-2xl shadow-blue-500/10">
                <h2 className="text-2xl font-semibold text-white mb-6">Purchase Details</h2>

                {/* Currency Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-400 mb-3">Select Currency</label>
                  <div className="relative">
                    <select
                      className="w-full bg-slate-800/60 border border-slate-700 rounded-2xl px-4 py-3 text-white hover:border-slate-600 focus:ring-2 focus:ring-blue-500/50 focus:border-transparent outline-none appearance-none pr-10 transition-colors"
                      value={selectedCurrency.code}
                      onChange={(e) => {
                        const currency = currencies.find(c => c.code === e.target.value);
                        if (currency) setSelectedCurrency(currency);
                      }}
                    >
                      {currencies.map((currency) => (
                        <option key={currency.code} value={currency.code} disabled={!currency.available}>
                          {currency.name} ({currency.symbol}) {!currency.available ? '- Coming Soon' : ''}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Amount Input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-400 mb-3">
                    Amount in {selectedCurrency.name}
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">
                      {selectedCurrency.symbol}
                    </span>
                    <input
                      type="number"
                      placeholder="0.00"
                      className="w-full bg-slate-800/60 border border-slate-700 rounded-2xl pl-12 pr-4 py-4 text-white text-xl focus:ring-2 focus:ring-blue-500/50 focus:border-transparent outline-none transition-colors"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      min="100"
                      disabled={!selectedCurrency.available}
                    />
                  </div>
                  {selectedCurrency.available && (
                    <p className="text-xs text-gray-400 mt-2">Minimum: {selectedCurrency.symbol}100</p>
                  )}
                </div>

                {/* Exchange Rate Display */}
                {ethPrice > 0 && (
                  <div className="mb-6 p-4 bg-slate-800/40 rounded-2xl border border-slate-700/50">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">1 ETH =</span>
                      <span className="text-white font-semibold">
                        {selectedCurrency.symbol}{ethPrice.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}

                {!selectedCurrency.available && (
                  <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-2xl flex items-center space-x-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    <p className="text-yellow-200 text-sm">This currency is not currently available</p>
                  </div>
                )}

                {!scriptLoaded && (
                  <div className="mb-6 p-4 bg-blue-900/20 border border-blue-700/50 rounded-2xl flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-blue-400" />
                    <p className="text-blue-300 text-sm">Loading payment gateway...</p>
                  </div>
                )}

                {/* Buy Button */}
                <button
                  onClick={initiatePayment}
                  disabled={
                    loading ||
                    calculating ||
                    !amount ||
                    parseFloat(amount) < 100 ||
                    !selectedCurrency.available ||
                    !account?.address ||
                    !scriptLoaded
                  }
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-2xl font-semibold hover:from-blue-500 hover:to-indigo-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg shadow-indigo-500/20 disabled:shadow-none"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
                  ) : (
                    <>
                      <ArrowRightLeft className="h-5 w-5" />
                      <span>
                        {!account?.address ? 'Connect Wallet' :
                          !selectedCurrency.available ? 'Currency Not Available' :
                            !scriptLoaded ? 'Loading Payment Gateway...' :
                              'Buy Crypto'}
                      </span>
                    </>
                  )}
                </button>

                {/* View History Link */}
                <div className="mt-4 text-center">
                  <Link
                    href="/trade/buy/history"
                    className="text-cyan-400 hover:text-cyan-300 text-sm underline transition-colors"
                  >
                    View Payment History
                  </Link>
                </div>
              </div>

              {/* Order Summary */}
              <div className="space-y-6">
                {/* Estimate Display */}
                <div className="bg-slate-900/50 backdrop-blur-xl rounded-[24px] p-8 border border-slate-700/50 shadow-xl shadow-blue-500/5">
                  <h3 className="text-xl font-semibold text-white mb-6">Order Summary</h3>

                  {calculating ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-cyan-500"></div>
                    </div>
                  ) : fees ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Amount to Pay</span>
                        <span className="text-white font-semibold">
                          {selectedCurrency.symbol}{parseFloat(amount).toLocaleString()}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Estimated ETH</span>
                        <span className="text-white">{estimatedEth.toFixed(6)} ETH</span>
                      </div>

                      <div className="border-t border-slate-700/50 pt-4 space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-red-400">Platform Fee (5%)</span>
                          <span className="text-red-400">-{fees.platformFee?.toFixed(6)} ETH</span>
                        </div>

                        <div className="flex justify-between items-center text-sm">
                          <span className="text-red-400">Other Fees (15%)</span>
                          <span className="text-red-400">-{((estimatedEth * 15) / 100).toFixed(6)} ETH</span>
                        </div>

                        <div className="flex justify-between items-center text-sm">
                          <span className="text-red-400">Total Fees (20%)</span>
                          <span className="text-red-400">-{(estimatedEth - fees.actualEthToReceive).toFixed(6)} ETH</span>
                        </div>
                      </div>

                      <div className="border-t border-slate-700/50 pt-4">
                        <div className="flex justify-between items-center text-lg">
                          <span className="text-white font-semibold">You'll Receive</span>
                          <span className="text-cyan-400 font-bold">{fees.actualEthToReceive?.toFixed(6)} ETH</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-400 text-center py-8">Enter amount to see estimate</p>
                  )}
                </div>

                {/* Disclaimer */}
                <div className="bg-slate-900/30 backdrop-blur-xl rounded-[24px] p-6 border border-slate-800/50">
                  <div className="flex items-start space-x-3">
                    <Info className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <div className="space-y-3">
                      <h4 className="text-lg font-semibold text-white">Important Information</h4>

                      <div className="space-y-2 text-sm text-slate-400">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-yellow-500" />
                          <p>Crypto will be sent to your wallet within 24 hours after provider approval</p>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Shield className="h-4 w-4 text-emerald-500" />
                          <p>Price calculated at time of purchase</p>
                        </div>

                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                          <p>This is for Sepolia testnet ETH only</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}