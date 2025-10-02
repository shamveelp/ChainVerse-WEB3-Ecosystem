'use client';

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { ethers } from 'ethers';
import { useActiveAccount } from 'thirdweb/react';
import type { RootState } from '@/redux/store';
import { 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock, 
  DollarSign,
  TrendingUp,
  Eye,
  Send,
  Ban,
  AlertCircle,
  Wallet,
  ExternalLink,
  Copy
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { adminDexApiService } from '@/services/dexApiService';
import FloatingWalletButton from '@/components/shared/TradeNavbar';

interface Payment {
  _id: string;
  userId: {
    _id: string;
    username: string;
    email: string;
    name: string;
  };
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
  approvedBy?: any;
  transactionHash?: string;
  createdAt: string;
  updatedAt: string;
}

interface PaymentStats {
  totalPayments: number;
  pendingCount: number;
  successCount: number;
  failedCount: number;
  fulfilledCount: number;
  rejectedCount: number;
}

export default function BuyCryptoManagementPage() {
  const account = useActiveAccount();
  const { admin } = useSelector((state: RootState) => state.adminAuth);

  const [activeTab, setActiveTab] = useState<'requests' | 'history'>('requests');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'approve' | 'reject' | 'view' | 'send'>('view');
  const [adminNote, setAdminNote] = useState('');
  const [transactionHash, setTransactionHash] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadStats();
    loadPayments();
  }, [activeTab, selectedStatus, currentPage]);

  const loadStats = async () => {
    try {
      const response = await adminDexApiService.getPaymentStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load payment statistics",
      });
    }
  };

  const loadPayments = async () => {
    try {
      setLoading(true);
      const statusFilter = activeTab === 'requests' ? 'success' : selectedStatus;
      const response = await adminDexApiService.getAllPayments(currentPage, 10, statusFilter);

      if (response.success && response.data) {
        setPayments(response.data.payments || []);
        setTotalPages(response.data.totalPages || 1);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error: any) {
      console.error('Failed to load payments:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.error || "Failed to load payments",
      });
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const sendCryptoDirectly = async () => {
    if (!selectedPayment || !account?.address) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Wallet not connected or payment not selected",
      });
      return;
    }

    try {
      setActionLoading(true);
      
      if (!window.ethereum) {
        throw new Error('MetaMask not installed');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Prepare transaction
      const tx = {
        to: selectedPayment.walletAddress,
        value: ethers.parseEther(selectedPayment.actualEthToSend.toString()),
        gasLimit: '21000',
      };

      toast({
        variant: "default",
        title: "Transaction Prepared",
        description: "Please confirm the transaction in your wallet",
      });

      // Send transaction
      const transaction = await signer.sendTransaction(tx);
      
      toast({
        variant: "default",
        title: "Transaction Sent!",
        description: "Waiting for confirmation...",
      });

      // Wait for confirmation
      const receipt = await transaction.wait();
      
      if (receipt?.status === 1) {
        // Update payment status with transaction hash
        await handleApprovePayment(transaction.hash);
        
        toast({
          variant: "default",
          title: "Success!",
          description: "Crypto sent and payment fulfilled successfully",
        });
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error: any) {
      console.error('Send crypto failed:', error);
      toast({
        variant: "destructive",
        title: "Transaction Failed",
        description: error.message || "Failed to send crypto",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprovePayment = async (txHash?: string) => {
    if (!selectedPayment) return;

    const hashToUse = txHash || transactionHash;
    if (!hashToUse.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Transaction hash is required",
      });
      return;
    }

    try {
      setActionLoading(true);
      const response = await adminDexApiService.fulfillPayment(
        selectedPayment._id,
        hashToUse,
        adminNote.trim() || 'Payment approved and fulfilled'
      );

      if (response.success) {
        toast({
          variant: "default",
          title: "Success",
          description: "Payment approved and fulfilled successfully",
        });

        closeModal();
        loadPayments();
        loadStats();
      } else {
        throw new Error(response.error || 'Failed to approve payment');
      }
    } catch (error: any) {
      console.error('Error approving payment:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.error || error.message || "Failed to approve payment",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectPayment = async () => {
    if (!selectedPayment || !adminNote.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Rejection reason is required",
      });
      return;
    }

    try {
      setActionLoading(true);
      const response = await adminDexApiService.rejectPayment(
        selectedPayment._id,
        adminNote
      );

      if (response.success) {
        toast({
          variant: "default",
          title: "Success",
          description: "Payment rejected successfully",
        });

        closeModal();
        loadPayments();
        loadStats();
      } else {
        throw new Error(response.error || 'Failed to reject payment');
      }
    } catch (error: any) {
      console.error('Error rejecting payment:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.error || error.message || "Failed to reject payment",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      variant: "default",
      title: "Copied",
      description: "Address copied to clipboard",
    });
  };

  const openModal = (payment: Payment, type: 'approve' | 'reject' | 'view' | 'send') => {
    setSelectedPayment(payment);
    setModalType(type);
    setShowModal(true);
    setAdminNote(payment.adminNote || '');
    setTransactionHash(payment.transactionHash || '');
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedPayment(null);
    setAdminNote('');
    setTransactionHash('');
    setActionLoading(false);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-400/30', icon: Clock },
      success: { color: 'bg-green-500/20 text-green-400 border-green-400/30', icon: CheckCircle },
      failed: { color: 'bg-red-500/20 text-red-400 border-red-400/30', icon: XCircle },
      fulfilled: { color: 'bg-blue-500/20 text-blue-400 border-blue-400/30', icon: Send },
      rejected: { color: 'bg-gray-500/20 text-gray-400 border-gray-400/30', icon: Ban },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${config.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const filteredPayments = payments.filter(payment => 
    payment.userId?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.walletAddress?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!admin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-blue-950 to-gray-950 flex items-center justify-center">
        <div className="text-white">Unauthorized access</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-blue-950 to-gray-950 pt-20 px-6">
      <FloatingWalletButton topOffset="top-4" />
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-4">
            Buy Crypto Management
          </h1>
          <p className="text-gray-400 text-lg">Manage cryptocurrency purchase requests and orders</p>
          {account?.address && (
            <div className="mt-4 flex items-center space-x-2">
              <Wallet className="h-4 w-4 text-green-400" />
              <span className="text-green-400 text-sm">Admin Wallet Connected: {account.address.slice(0, 10)}...{account.address.slice(-8)}</span>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Payments</p>
                  <p className="text-2xl font-bold text-white">{stats.totalPayments}</p>
                </div>
                <DollarSign className="h-8 w-8 text-cyan-400" />
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Pending</p>
                  <p className="text-2xl font-bold text-yellow-400">{stats.pendingCount}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-400" />
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Success</p>
                  <p className="text-2xl font-bold text-green-400">{stats.successCount}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Fulfilled</p>
                  <p className="text-2xl font-bold text-blue-400">{stats.fulfilledCount}</p>
                </div>
                <Send className="h-8 w-8 text-blue-400" />
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Failed</p>
                  <p className="text-2xl font-bold text-red-400">{stats.failedCount}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-400" />
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Rejected</p>
                  <p className="text-2xl font-bold text-gray-400">{stats.rejectedCount}</p>
                </div>
                <Ban className="h-8 w-8 text-gray-400" />
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6">
          <div className="bg-gray-800/50 p-1 rounded-xl w-fit">
            <button
              onClick={() => {
                setActiveTab('requests');
                setCurrentPage(1);
                setSelectedStatus('');
              }}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'requests'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Pending Requests ({stats?.successCount || 0})
            </button>
            <button
              onClick={() => {
                setActiveTab('history');
                setCurrentPage(1);
              }}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'history'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Order History
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by username, email, or wallet address..."
                className="w-full bg-gray-800/60 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Status Filter (History only) */}
            {activeTab === 'history' && (
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  className="bg-gray-800/60 border border-gray-700 rounded-xl pl-10 pr-8 py-3 text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none appearance-none min-w-[200px]"
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="success">Success</option>
                  <option value="failed">Failed</option>
                  <option value="fulfilled">Fulfilled</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="text-left p-4 text-gray-300 font-medium">User</th>
                  <th className="text-left p-4 text-gray-300 font-medium">Amount</th>
                  <th className="text-left p-4 text-gray-300 font-medium">ETH Amount</th>
                  <th className="text-left p-4 text-gray-300 font-medium">Status</th>
                  <th className="text-left p-4 text-gray-300 font-medium">Date</th>
                  <th className="text-left p-4 text-gray-300 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center p-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-cyan-500"></div>
                      </div>
                    </td>
                  </tr>
                ) : filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center p-8 text-gray-400">
                      No payments found
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment) => (
                    <tr key={payment._id} className="border-t border-gray-700/50 hover:bg-white/5">
                      <td className="p-4">
                        <div>
                          <p className="text-white font-medium">{payment.userId?.name || 'N/A'}</p>
                          <p className="text-gray-400 text-sm">{payment.userId?.email || 'N/A'}</p>
                          <div className="flex items-center space-x-1 mt-1">
                            <p className="text-gray-500 text-xs">{payment.walletAddress?.slice(0, 10)}...{payment.walletAddress?.slice(-8)}</p>
                            <button
                              onClick={() => copyToClipboard(payment.walletAddress)}
                              className="text-gray-500 hover:text-cyan-400 transition-colors"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="text-white font-medium">
                            ₹{payment.amountInCurrency?.toLocaleString()}
                          </p>
                          <p className="text-gray-400 text-sm">{payment.currency}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="text-white font-medium">{payment.actualEthToSend?.toFixed(6)} ETH</p>
                          <p className="text-gray-400 text-sm">
                            Est: {payment.estimatedEth?.toFixed(6)} ETH
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        {getStatusBadge(payment.status)}
                      </td>
                      <td className="p-4">
                        <p className="text-white text-sm">
                          {new Date(payment.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-gray-400 text-xs">
                          {new Date(payment.createdAt).toLocaleTimeString()}
                        </p>
                      </td>
                      <td className="p-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openModal(payment, 'view')}
                            className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {payment.status === 'success' && (
                            <>
                              {account?.address ? (
                                <button
                                  onClick={() => openModal(payment, 'send')}
                                  className="p-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors"
                                  title="Send Crypto Directly"
                                >
                                  <Wallet className="h-4 w-4" />
                                </button>
                              ) : null}
                              
                              <button
                                onClick={() => openModal(payment, 'approve')}
                                className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                                title="Approve Payment"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => openModal(payment, 'reject')}
                                className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                                title="Reject Payment"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-gray-700/50 flex items-center justify-between">
              <p className="text-gray-400">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Modal */}
      {showModal && selectedPayment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">
                {modalType === 'view' ? 'Payment Details' :
                 modalType === 'approve' ? 'Approve Payment' :
                 modalType === 'send' ? 'Send Crypto Directly' :
                 'Reject Payment'}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-white"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            {/* Detailed Payment Information */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* User Information */}
              <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700">
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-cyan-400" />
                  User Information
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Name</label>
                    <p className="text-white font-medium">{selectedPayment.userId?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Email</label>
                    <p className="text-white">{selectedPayment.userId?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Username</label>
                    <p className="text-white">{selectedPayment.userId?.username || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Wallet Address</label>
                    <div className="flex items-center space-x-2">
                      <p className="text-white font-mono text-sm break-all">{selectedPayment.walletAddress}</p>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => copyToClipboard(selectedPayment.walletAddress)}
                          className="p-1 text-gray-400 hover:text-cyan-400 transition-colors"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <a
                          href={`https://sepolia.etherscan.io/address/${selectedPayment.walletAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-gray-400 hover:text-cyan-400 transition-colors"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700">
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <DollarSign className="h-5 w-5 mr-2 text-green-400" />
                  Payment Details
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Amount Paid</span>
                    <span className="text-white font-medium">₹{selectedPayment.amountInCurrency?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Currency</span>
                    <span className="text-white">{selectedPayment.currency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">ETH Price (at time)</span>
                    <span className="text-white">₹{selectedPayment.ethPriceAtTime?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Estimated ETH</span>
                    <span className="text-white">{selectedPayment.estimatedEth?.toFixed(6)} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Platform Fee</span>
                    <span className="text-red-300">{selectedPayment.totalFeePercentage}%</span>
                  </div>
                  <div className="border-t border-gray-600 pt-2">
                    <div className="flex justify-between text-lg font-semibold">
                      <span className="text-white">ETH to Send</span>
                      <span className="text-cyan-400">{selectedPayment.actualEthToSend?.toFixed(6)} ETH</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Status</label>
                    {getStatusBadge(selectedPayment.status)}
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Created</label>
                    <p className="text-white text-sm">{new Date(selectedPayment.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Transaction Information */}
            <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700 mb-6">
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Send className="h-5 w-5 mr-2 text-blue-400" />
                Transaction Information
              </h4>
              <div className="grid md:grid-cols-2 gap-4">
                {selectedPayment.razorpayOrderId && (
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Razorpay Order ID</label>
                    <p className="text-white font-mono text-sm break-all">{selectedPayment.razorpayOrderId}</p>
                  </div>
                )}
                {selectedPayment.razorpayPaymentId && (
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Razorpay Payment ID</label>
                    <p className="text-white font-mono text-sm break-all">{selectedPayment.razorpayPaymentId}</p>
                  </div>
                )}
                {selectedPayment.transactionHash && (
                  <div className="md:col-span-2">
                    <label className="block text-gray-400 text-sm mb-1">Blockchain Transaction</label>
                    <div className="flex items-center space-x-2">
                      <p className="text-white font-mono text-sm break-all">{selectedPayment.transactionHash}</p>
                      <a
                        href={`https://sepolia.etherscan.io/tx/${selectedPayment.transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                )}
                {selectedPayment.adminNote && (
                  <div className="md:col-span-2">
                    <label className="block text-gray-400 text-sm mb-1">Admin Note</label>
                    <p className="text-white bg-gray-900/50 p-3 rounded-lg">{selectedPayment.adminNote}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Forms */}
            {modalType === 'send' && (
              <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl p-6 mb-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Wallet className="h-6 w-6 text-cyan-400" />
                  <div>
                    <h4 className="text-lg font-semibold text-white">Send Crypto Directly</h4>
                    <p className="text-gray-400 text-sm">This will send crypto from your connected wallet and mark the order as fulfilled</p>
                  </div>
                </div>
                
                {account?.address ? (
                  <div className="space-y-4">
                    <div className="bg-gray-800/50 p-4 rounded-lg">
                      <h5 className="text-white font-medium mb-2">Transaction Preview</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">From (Your Wallet):</span>
                          <span className="text-white font-mono">{account.address.slice(0, 10)}...{account.address.slice(-8)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">To (User Wallet):</span>
                          <span className="text-white font-mono">{selectedPayment.walletAddress.slice(0, 10)}...{selectedPayment.walletAddress.slice(-8)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Amount:</span>
                          <span className="text-cyan-400 font-semibold">{selectedPayment.actualEthToSend.toFixed(6)} ETH</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Network:</span>
                          <span className="text-white">Sepolia Testnet</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-orange-400 text-sm flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4" />
                      <span>Make sure you have enough ETH in your wallet for gas fees</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-red-400 text-center p-4">
                    <Wallet className="h-8 w-8 mx-auto mb-2" />
                    <p>Please connect your admin wallet to send crypto directly</p>
                  </div>
                )}
              </div>
            )}

            {modalType === 'approve' && (
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">
                    Transaction Hash <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter transaction hash after sending crypto"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-green-500 outline-none"        
                    value={transactionHash}
                    onChange={(e) => setTransactionHash(e.target.value)}
                    disabled={actionLoading}
                  />
                  <p className="text-gray-400 text-xs mt-1">This will be visible to the user and verifiable on blockchain</p>
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Admin Note (Optional)</label>
                  <textarea
                    placeholder="Add any additional notes for the user"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-green-500 outline-none resize-none"
                    rows={3}
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    disabled={actionLoading}
                  />
                </div>
              </div>
            )}

            {modalType === 'reject' && (
              <div className="mb-6">
                <label className="block text-gray-400 text-sm mb-2">
                  Rejection Reason <span className="text-red-400">*</span>
                </label>
                <textarea
                  placeholder="Explain why this payment is being rejected (this will be shown to the user)"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-red-500 outline-none resize-none"
                  rows={4}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  disabled={actionLoading}
                />
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeModal}
                disabled={actionLoading}
                className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                {modalType === 'view' ? 'Close' : 'Cancel'}
              </button>

              {modalType === 'send' && account?.address && (
                <button
                  onClick={sendCryptoDirectly}
                  disabled={actionLoading}
                  className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  {actionLoading && <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>}
                  <Wallet className="h-4 w-4" />
                  <span>Send {selectedPayment.actualEthToSend.toFixed(6)} ETH</span>
                </button>
              )}

              {modalType === 'approve' && (
                <button
                  onClick={() => handleApprovePayment()}
                  disabled={!transactionHash.trim() || actionLoading}
                  className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  {actionLoading && <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>}
                  <span>Mark as Fulfilled</span>
                </button>
              )}

              {modalType === 'reject' && (
                <button
                  onClick={handleRejectPayment}
                  disabled={!adminNote.trim() || actionLoading}
                  className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  {actionLoading && <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>}
                  <span>Reject Payment</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}