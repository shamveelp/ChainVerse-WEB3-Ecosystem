'use client';

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/redux/store';
import { 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock, 
  DollarSign,
  Users,
  TrendingUp,
  Eye,
  Send,
  Ban,
  AlertCircle
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { adminDexApiService } from '@/services/dexApiService';

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
  const [modalType, setModalType] = useState<'approve' | 'reject' | 'view'>('view');
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

  const handleApprovePayment = async () => {
    if (!selectedPayment || !transactionHash.trim()) {
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
        transactionHash,
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

  const openModal = (payment: Payment, type: 'approve' | 'reject' | 'view') => {
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
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-blue-950 to-gray-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-4">
            Buy Crypto Management
          </h1>
          <p className="text-gray-400 text-lg">Manage cryptocurrency purchase requests and orders</p>
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
              Pending Requests
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
                          <p className="text-gray-500 text-xs">{payment.walletAddress?.slice(0, 10)}...</p>
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

      {/* Modal */}
      {showModal && selectedPayment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-white mb-6">
              {modalType === 'view' ? 'Payment Details' :
               modalType === 'approve' ? 'Approve Payment' : 'Reject Payment'}
            </h3>

            {/* Payment Details */}
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-1">User</label>
                  <p className="text-white">{selectedPayment.userId?.name || 'N/A'}</p>
                  <p className="text-gray-400 text-sm">{selectedPayment.userId?.email || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Wallet Address</label>
                  <p className="text-white text-sm font-mono">{selectedPayment.walletAddress}</p>
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Amount Paid</label>
                  <p className="text-white">₹{selectedPayment.amountInCurrency?.toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">ETH to Send</label>
                  <p className="text-white">{selectedPayment.actualEthToSend?.toFixed(6)} ETH</p>
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Status</label>
                  {getStatusBadge(selectedPayment.status)}
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Date</label>
                  <p className="text-white">{new Date(selectedPayment.createdAt).toLocaleString()}</p>
                </div>
              </div>

              {selectedPayment.razorpayPaymentId && (
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Razorpay Payment ID</label>
                  <p className="text-white font-mono text-sm">{selectedPayment.razorpayPaymentId}</p>
                </div>
              )}

              {selectedPayment.transactionHash && (
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Transaction Hash</label>
                  <p className="text-white font-mono text-sm">{selectedPayment.transactionHash}</p>
                </div>
              )}

              {selectedPayment.adminNote && (
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Admin Note</label>
                  <p className="text-white">{selectedPayment.adminNote}</p>
                </div>
              )}
            </div>

            {/* Action Forms */}
            {modalType === 'approve' && (
              <div className="space-y-4">
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
                  <p className="text-gray-400 text-xs mt-1">This will be visible to the user</p>
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Admin Note (Optional)</label>
                  <textarea
                    placeholder="Add any additional notes"
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
              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  Rejection Reason <span className="text-red-400">*</span>
                </label>
                <textarea
                  placeholder="Explain why this payment is being rejected"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-red-500 outline-none resize-none"
                  rows={4}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  disabled={actionLoading}
                />
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={closeModal}
                disabled={actionLoading}
                className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>

              {modalType === 'approve' && (
                <button
                  onClick={handleApprovePayment}
                  disabled={!transactionHash.trim() || actionLoading}
                  className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  {actionLoading && <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>}
                  <span>Approve & Send Crypto</span>
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