export interface ConversionRate {
  pointsPerCVC: number;
  minimumPoints: number;
  minimumCVC: number;
  claimFeeETH: string;
  isActive: boolean;
}

export interface ConversionConfig {
  defaultRate: ConversionRate;
  companyWallet: string;
  cvcContractAddress: string;
  liquidityContractAddress: string;
  network: string;
}

export const POINTS_CONVERSION_CONFIG: ConversionConfig = {
  defaultRate: {
    pointsPerCVC: 100, // 100 points = 1 CVC
    minimumPoints: 100, // Minimum 100 points to convert
    minimumCVC: 1, // Minimum 1 CVC to claim
    claimFeeETH: "0.0001", // 0.001 ETH claim fee
    isActive: true
  },
  companyWallet: "0xcc5d972ee1e4abe7d1d6b5fed1349ae4913cd423",
  cvcContractAddress: "0xF7BAdb1aE47768910edDF72cB39bF4C8B30173a8", // Will be set after contract deployment
  liquidityContractAddress: "0x0fe95061e4aA5075Ea4869324cFc8b2585C688e8", // Will be set after contract deployment
  network: "sepolia"
};

export const calculateCVCFromPoints = (points: number, rate: ConversionRate): number => {
  return Math.floor(points / rate.pointsPerCVC);
};

export const calculatePointsFromCVC = (cvc: number, rate: ConversionRate): number => {
  return cvc * rate.pointsPerCVC;
};

export const validateConversion = (points: number, rate: ConversionRate): {
  isValid: boolean;
  error?: string;
  cvcAmount?: number;
} => {
  if (!rate.isActive) {
    return { isValid: false, error: "Points conversion is currently disabled" };
  }

  if (points < rate.minimumPoints) {
    return { 
      isValid: false, 
      error: `Minimum ${rate.minimumPoints} points required for conversion` 
    };
  }

  const cvcAmount = calculateCVCFromPoints(points, rate);
  
  if (cvcAmount < rate.minimumCVC) {
    return { 
      isValid: false, 
      error: `Conversion results in less than minimum ${rate.minimumCVC} CVC` 
    };
  }

  return { isValid: true, cvcAmount };
};