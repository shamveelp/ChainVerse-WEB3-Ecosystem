export interface ListedToken {
  tokenId: bigint;
  owner: string;
  seller: string;
  creator: string;
  price: bigint;
  currentlyListed: boolean;
  createdAt: bigint;
}

export interface NFTMetadata {
  name: string;
  description?: string;
  image?: string;
  img_url?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

export interface NFTWithMetadata extends ListedToken {
  metadata: NFTMetadata | null;
  imageUrl?: string;
  formattedPrice: string;
}

export interface TransactionStatus {
  hash?: string;
  status: 'idle' | 'pending' | 'success' | 'error';
  error?: string;
}

export interface SaleDetails {
  price: bigint;
  companyFee: bigint;
  creatorRoyalty: bigint;
  sellerAmount: bigint;
}

export interface MarketplaceStats {
  totalTokens: number;
  totalSold: number;
  currentListings: number;
}