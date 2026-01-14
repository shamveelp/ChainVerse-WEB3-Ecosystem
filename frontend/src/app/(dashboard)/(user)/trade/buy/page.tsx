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
      <div className="flex min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-white selection:bg-blue-500/30">
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
    <div className="flex min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-white selection:bg-blue-500/30">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-3xl mix-blend-screen -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      </div>

      <div className="flex-1 lg:ml-0 relative z-10">
        <Navbar />
        <TradeNavbar topOffset="top-[130px]" />

        <div className="pt-24 md:pt-32 px-4 md:px-6 pb-20 overflow-x-hidden">
          <div className="max-w-5xl mx-auto w-full">

            <div className="mb-8 flex justify-center">
              <PillNavigation />
            </div>

            <div className="text-center mb-10">
              <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-4 tracking-tight">Buy Crypto</h1>
              <p className="text-slate-400 text-lg md:text-xl max-w-lg mx-auto leading-relaxed">Securely purchase Sepolia ETH with fiat currency instantly.</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
              {/* Buy Form */}
              <div className="relative group h-full">
                <div className="absolute -inset-0.5 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-[28px] opacity-30 group-hover:opacity-50 blur transition duration-1000"></div>
                <div className="relative bg-slate-950/80 backdrop-blur-xl rounded-[26px] p-6 lg:p-8 border border-white/10 shadow-2xl h-full flex flex-col">
                  <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-cyan-500 rounded-full"></span>
                    Purchase Details
                  </h2>

                  <div className="space-y-6 flex-grow">
                    {/* Currency Selection */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-400 ml-1">Select Currency</label>
                      <div className="relative">
                        <select
                          className="w-full bg-slate-900/50 border border-white/10 rounded-2xl px-4 py-3 text-white hover:border-white/20 focus:ring-2 focus:ring-blue-500/30 focus:border-transparent outline-none appearance-none cursor-pointer text-base font-semibold transition-all shadow-inner"
                          value={selectedCurrency.code}
                          onChange={(e) => {
                            const currency = currencies.find(c => c.code === e.target.value);
                            if (currency) setSelectedCurrency(currency);
                          }}
                        >
                          {currencies.map((currency) => (
                            <option key={currency.code} value={currency.code} disabled={!currency.available} className="bg-slate-900">
                              {currency.name} ({currency.symbol}) {!currency.available ? '- Coming Soon' : ''}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                          <ChevronDown className="h-4 w-4 text-slate-400" />
                        </div>
                      </div>
                    </div>

                    {/* Amount Input */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-400 ml-1">
                        Amount in {selectedCurrency.name}
                      </label>
                      <div className="bg-slate-900/50 rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-colors focus-within:border-blue-500/30 group/input">
                        <div className="flex items-center gap-2 sm:gap-4">
                          <span className="text-xl sm:text-2xl text-slate-500 font-medium select-none">{selectedCurrency.symbol}</span>
                          <input
                            type="number"
                            placeholder="0.00"
                            className="flex-1 w-0 bg-transparent text-2xl sm:text-3xl font-bold text-white outline-none placeholder-slate-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none min-w-0"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            min="100"
                            disabled={!selectedCurrency.available}
                          />
                        </div>
                      </div>
                      {selectedCurrency.available && (
                        <p className="text-xs text-slate-500 pl-2">Minimum: {selectedCurrency.symbol}100</p>
                      )}
                    </div>

                    {/* Exchange Rate Display */}
                    {ethPrice > 0 && (
                      <div className="p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-sm">Current Rate</span>
                          <span className="text-blue-300 font-semibold font-mono tracking-tight">
                            1 ETH ≈ {selectedCurrency.symbol}{ethPrice.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}

                    {!selectedCurrency.available && (
                      <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex items-center space-x-3">
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        <p className="text-yellow-200 text-sm">This currency is not currently available</p>
                      </div>
                    )}

                    {!scriptLoaded && (
                      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center space-x-3">
                        <Clock className="h-5 w-5 text-blue-400" />
                        <p className="text-blue-300 text-sm">Loading payment gateway...</p>
                      </div>
                    )}
                  </div>

                  {/* Buy Button */}
                  <div className="mt-8">
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
                      className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white py-4 rounded-2xl font-bold text-lg transition-all duration-300 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center space-x-2"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                      ) : (
                        <>
                          <ArrowRightLeft className="h-5 w-5" />
                          <span>
                            {!account?.address ? 'Connect Wallet' :
                              !selectedCurrency.available ? 'Currency Not Available' :
                                !scriptLoaded ? 'Loading...' :
                                  'Proceed to Pay'}
                          </span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* View History Link */}
                  <div className="mt-4 text-center">
                    <Link
                      href="/trade/buy/history"
                      className="text-slate-500 hover:text-cyan-400 text-sm font-medium transition-colors"
                    >
                      View Payment History
                    </Link>
                  </div>

                </div>
              </div>

              {/* Order Summary */}
              <div className="space-y-6">
                {/* Estimate Display */}
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-br from-slate-700 to-slate-800 rounded-[28px] opacity-30 blur"></div>
                  <div className="relative bg-slate-900/50 backdrop-blur-xl rounded-[26px] p-6 lg:p-8 border border-white/5 h-auto">
                    <h3 className="text-xl font-semibold text-white mb-6">Order Summary</h3>

                    {calculating ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-cyan-500 border-t-transparent"></div>
                      </div>
                    ) : fees ? (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center py-2">
                          <span className="text-slate-400">Total Payment</span>
                          <span className="text-white text-lg font-semibold">
                            {selectedCurrency.symbol}{parseFloat(amount).toLocaleString()}
                          </span>
                        </div>

                        <div className="border-t border-white/5 my-2"></div>

                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-400">Estimated ETH</span>
                          <span className="text-slate-200 font-mono">{estimatedEth.toFixed(6)} ETH</span>
                        </div>

                        <div className="space-y-2 bg-black/20 rounded-xl p-4 border border-white/5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-500">Platform Fee (5%)</span>
                            <span className="text-red-400/80 font-mono">-{fees.platformFee?.toFixed(6)} ETH</span>
                          </div>

                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-500">Network & Gas Fees (15%)</span>
                            <span className="text-red-400/80 font-mono">-{((estimatedEth * 15) / 100).toFixed(6)} ETH</span>
                          </div>

                          <div className="border-t border-white/5 pt-2 mt-2 flex justify-between items-center text-xs font-medium">
                            <span className="text-slate-400">Total Deductions</span>
                            <span className="text-red-400 font-mono">-{(estimatedEth - fees.actualEthToReceive).toFixed(6)} ETH</span>
                          </div>
                        </div>

                        <div className="pt-4 mt-2">
                          <div className="flex justify-between items-end">
                            <span className="text-white font-medium mb-1">You Receive</span>
                            <span className="text-3xl font-bold text-cyan-400 drop-shadow-sm">{fees.actualEthToReceive?.toFixed(6)} <span className="text-lg text-cyan-500/70">ETH</span></span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-10 space-y-3">
                        <div className="bg-slate-800/50 w-12 h-12 rounded-full flex items-center justify-center mx-auto text-slate-500">
                          <Info className="w-6 h-6" />
                        </div>
                        <p className="text-slate-500">Enter an amount to calculate the estimated ETH you will receive.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Disclaimer */}
                <div className="bg-slate-900/30 backdrop-blur-sm rounded-[24px] p-6 border border-white/5">
                  <div className="flex items-start space-x-3">
                    <Info className="h-5 w-5 text-slate-400 flex-shrink-0 mt-0.5" />
                    <div className="space-y-3">
                      <h4 className="text-base font-semibold text-slate-200">Important Information</h4>

                      <div className="space-y-2 text-sm text-slate-400">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-3.5 w-3.5 text-slate-500" />
                          <p>Transfers typically complete within 24 hours.</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Shield className="h-3.5 w-3.5 text-slate-500" />
                          <p>Rates are locked for 15 minutes.</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-500/70" />
                          <p>Sepolia testnet ETH only.</p>
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