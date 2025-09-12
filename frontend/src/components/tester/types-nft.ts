export interface ListedToken {
  tokenId: bigint;
  owner: string;
  seller: string;
  price: bigint;
  currentlyListed: boolean;
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
  metadata?: NFTMetadata;
  imageUrl?: string;
  formattedPrice: string;
}

export interface TransactionStatus {
  hash?: string;
  status: 'idle' | 'pending' | 'success' | 'error';
  error?: string;
}