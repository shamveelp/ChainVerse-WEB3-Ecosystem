export interface CommunityApplicationData {
    communityName: string
    email: string
    username: string
    walletAddress: string
    description: string
    category: string
    whyChooseUs: string
    rules: string[]
    socialLinks: {
        twitter: string
        discord: string
        telegram: string
        website: string
    }
    logo: string | File | null
    banner: string | File | null
}

export interface CommunitySettings {
    allowChainCast: boolean
    allowGroupChat: boolean
    allowPosts: boolean
    allowQuests: boolean
}

export interface CommunitySocialLinks {
    twitter?: string
    discord?: string
    telegram?: string
    website?: string
}

export interface CommunityDetails {
    id: string
    communityName: string
    email: string
    username: string
    walletAddress: string
    description: string
    category: string
    rules: string[]
    socialLinks: CommunitySocialLinks
    logo?: string
    banner?: string
    settings: CommunitySettings
    status: string
    isVerified: boolean
    memberCount: number
    createdAt?: string
    updatedAt?: string
}

export interface CheckExistenceResponse {
    exists: boolean
    success: boolean
    message?: string
}
