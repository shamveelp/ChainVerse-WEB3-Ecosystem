'use client';

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/redux/store';
import { Clock, CheckCircle, XCircle, Send, Ban, ArrowLeft, Filter, Calendar, Wallet, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { dexApiService } from '@/services/dexApiService';
import Navbar from '@/components/home/navbar';
import TradeNavbar from '@/components/shared/TradeNavbar';
import Link from 'next/link';

interface Payment {
  _id: string;
  userId: string;
  walletAddress: string;
  currency: string;
  amountInCurrency: number;
  estimatedEth: number;
  actualEthToSend: number;
  platformFee: number;
  totalFeePercentage: number;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  status: 'pending' | 'success' | 'failed' | 'fulfilled' | 'rejected';
  ethPriceAtTime: number;
  adminNote?: string;
  transactionHash?: string;
  createdAt: string;
  updatedAt: string;
}

export default function BuyCryptoHistoryPage() {
  const { user } = useSelector((state: RootState) => state.userAuth);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  useEffect(() => {
    if (user) {
      loadPayments();
    }
  }, [user, currentPage, selectedStatus]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const response = await dexApiService.getUserPayments(currentPage, 10);

      if (response.success && response.data) {
        setPayments(response.data.payments || []);
        setTotalPages(response.data.totalPages || 1);
      } else {
        throw new Error('Failed to load payments');
      }
    } catch (err) {
      const error = err as Error;
      console.error('Failed to load payments:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load payment history",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { 
        color: 'bg-yellow-500/20 text-yellow-400 border-yellow-400/30', 
        icon: Clock,
        text: 'Pending Payment'
      },
      success: { 
        color: 'bg-green-500/20 text-green-400 border-green-400/30', 
        icon: CheckCircle,
        text: 'Payment Successful'
      },
      failed: { 
        color: 'bg-red-500/20 text-red-400 border-red-400/30', 
        icon: XCircle,
        text: 'Payment Failed'
      },
      fulfilled: { 
        color: 'bg-blue-500/20 text-blue-400 border-blue-400/30', 
        icon: Send,
        text: 'Crypto Sent'
      },
      rejected: { 
        color: 'bg-gray-500/20 text-gray-400 border-gray-400/30', 
        icon: Ban,
        text: 'Order Rejected'
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${config.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.text}
      </span>
    );
  };

  const getStatusDescription = (payment: Payment) => {
    switch (payment.status) {
      case 'pending':
        return 'Payment is being processed by payment gateway.';
      case 'success':
        return 'Payment successful. Waiting for admin approval to send crypto.';
      case 'fulfilled':
        return 'Crypto has been sent to your wallet successfully.';
      case 'rejected':
        return payment.adminNote || 'Order was rejected by admin.';
      case 'failed':
        return 'Payment failed. Please try again or contact support.';
      default:
        return 'Unknown status';
    }
  };

  const filteredPayments = selectedStatus 
    ? payments.filter(payment => payment.status === selectedStatus)
    : payments;

  if (!user) {
    return (
      <>
        <Navbar />
        <TradeNavbar topOffset="top-16" />
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-blue-950 to-gray-950 pt-20 px-6 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-cyan-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Login Required</h1>
            <p className="text-gray-400">Please login to view your payment history</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <TradeNavbar topOffset="top-16" />
      
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-blue-950 to-gray-950 pt-20 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Link 
                href="/trade/buy"
                className="flex items-center space-x-2 text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Buy Crypto</span>
              </Link>
            </div>
            <div className="text-right">
              <h1 className="text-4xl font-bold gradient-text mb-2">Payment History</h1>
              <p className="text-gray-400">Track your crypto purchase orders</p>
            </div>
          </div>

          {/* Filters */}
          <div className="glassmorphism rounded-3xl p-6 mb-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Filter Payments</h2>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select
                    className="bg-gray-800/60 border border-gray-700 rounded-xl pl-10 pr-8 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none appearance-none"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="success">Successful</option>
                    <option value="fulfilled">Fulfilled</option>
                    <option value="rejected">Rejected</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Payments List */}
          {loading ? (
            <div className="glassmorphism rounded-3xl p-8 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-cyan-500"></div>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="glassmorphism rounded-3xl p-8 text-center">
              <Wallet className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Payments Found</h3>
              <p className="text-gray-400 mb-6">You haven't made any crypto purchases yet.</p>
              <Link 
                href="/trade/buy"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-semibold hover:from-cyan-600 hover:to-blue-600 transition-all duration-300"
              >
                Buy Your First Crypto
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPayments.map((payment) => (
                <div key={payment._id} className="glassmorphism rounded-3xl p-6 hover:bg-white/5 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          {getStatusBadge(payment.status)}
                          <span className="text-sm text-gray-400">
                            {new Date(payment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-white">
                            ₹{payment.amountInCurrency.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-400">{payment.currency}</p>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-3 gap-6">
                        <div>
                          <h4 className="text-sm font-medium text-gray-300 mb-2">Crypto Amount</h4>
                          <p className="text-white font-semibold">{payment.actualEthToSend.toFixed(6)} ETH</p>
                          <p className="text-xs text-gray-400">
                            Estimated: {payment.estimatedEth.toFixed(6)} ETH
                          </p>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-gray-300 mb-2">Wallet Address</h4>
                          <p className="text-white font-mono text-sm">{payment.walletAddress.slice(0, 20)}...</p>
                          <p className="text-xs text-gray-400">
                            ETH Price: ₹{payment.ethPriceAtTime.toLocaleString()}
                          </p>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-gray-300 mb-2">Order Details</h4>
                          <p className="text-white text-sm">
                            Fee: {payment.totalFeePercentage}% (₹{((payment.amountInCurrency * payment.totalFeePercentage) / 100).toFixed(2)})
                          </p>
                          {payment.razorpayPaymentId && (
                            <p className="text-xs text-gray-400 font-mono">
                              ID: {payment.razorpayPaymentId.slice(0, 15)}...
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 p-4 bg-gray-800/40 rounded-xl border border-gray-700">
                        <p className="text-sm text-gray-300">
                          {getStatusDescription(payment)}
                        </p>
                        {payment.transactionHash && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-400 mb-1">Transaction Hash:</p>
                            <a
                              href={`https://sepolia.etherscan.io/tx/${payment.transactionHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-cyan-400 hover:text-cyan-300 underline font-mono text-xs break-all"
                            >
                              {payment.transactionHash}
                            </a>
                          </div>
                        )}
                      </div>

                      {payment.status === 'success' && (
                        <div className="mt-4 p-3 bg-blue-900/30 border border-blue-700 rounded-xl">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-blue-400" />
                            <p className="text-blue-300 text-sm">
                              Waiting for admin approval. Crypto will be sent within 24 hours.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="glassmorphism rounded-3xl p-6 flex items-center justify-between">
                  <p className="text-gray-400">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}