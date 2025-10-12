export interface CommunityRequest {
  _id: string;
  communityName: string;
  email: string;
  username: string;
  walletAddress: string;
  description: string;
  category: string;
  whyChooseUs: string;
  rules: string[];
  socialLinks: {
    twitter?: string;
    discord?: string;
    telegram?: string;
    website?: string;
  };
  logo: string;
  banner: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityRequestFilters {
  page: number;
  limit: number;
  search: string;
  status?: 'pending' | 'approved' | 'rejected' | 'all';
}

export interface CommunityRequestResponse {
  success: boolean;
  data: CommunityRequest[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  message?: string;
  error?: string;
}

export interface Community {
  _id: string;
  communityName: string;
  email: string;
  username: string;
  walletAddress: string;
  description: string;
  category: string;
  rules: string[];
  logo: string;
  banner: string;
  isVerified: boolean;
  status: string;
  socialLinks: {
    twitter?: string;
    discord?: string;
    telegram?: string;
    website?: string;
  };
  members: string[];
  communityAdmins: string[];
  settings: {
    allowChainCast: boolean;
    allowGroupChat: boolean;
    allowPosts: boolean;
    allowQuests: boolean;
  };
  createdAt: string;
  updatedAt: string;
}