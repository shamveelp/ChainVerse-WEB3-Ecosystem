export interface ConversionRate {
    pointsPerCVC: number;
    minimumPoints: number;
    minimumCVC: number;
    claimFeeETH: string;
    isActive: boolean;
    companyWallet?: string;
    cvcContractAddress?: string;
    network?: string;
    effectiveFrom?: Date;
}

export interface PointsConversion {
    id: string;
    pointsConverted: number;
    cvcAmount: number;
    conversionRate: number;
    status: 'pending' | 'approved' | 'rejected' | 'claimed';
    transactionHash?: string;
    claimFee: number;
    walletAddress?: string;
    adminNote?: string;
    approvedBy?: string | Record<string, unknown>;
    approvedAt?: string;
    claimedAt?: string;
    createdAt: string;
}

export interface ConversionStats {
    totalPointsConverted: number;
    totalCVCClaimed: number;
    pendingConversions: number;
}
