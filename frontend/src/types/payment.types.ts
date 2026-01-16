export interface Payment {
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
    status: 'pending' | 'success' | 'failed' | 'fulfilled';
    ethPriceAtTime: number;
    adminNote?: string;
    approvedBy?: string | {
        _id: string;
        name: string;
        email: string;
    };
    transactionHash?: string;
    createdAt: string;
    updatedAt: string;
}

export interface PaymentStats {
    totalPayments: number;
    pendingCount: number;
    successCount: number;
    fulfilledCount: number;
    failedCount: number;
}
