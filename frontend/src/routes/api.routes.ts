/**
 * API Routes constants for the frontend application
 * This file contains all the API endpoints used across the application
 */

// Admin API Routes
export const ADMIN_API_ROUTES = {
    LOGIN: '/api/admin/login',
    LOGOUT: '/api/admin/logout',
    FORGOT_PASSWORD: '/api/admin/forgot-password',
    VERIFY_RESET_OTP: '/api/admin/verify-forgot-password-otp',
    RESET_PASSWORD: '/api/admin/reset-password',
    CHANGE_PASSWORD: '/api/admin/change-password',
    PROFILE: '/api/admin/profile',

    // User Management
    USERS: '/api/admin/users',
    // Note: For dynamic routes, we'll keep the base path and append IDs in the service
    USER_BY_ID: (id: string) => `/api/admin/users/${id}`,
    USER_BAN: (id: string) => `/api/admin/users/${id}/ban`,

    // Community Management
    COMMUNITY_REQUESTS: '/api/admin/community-requests',
    COMMUNITY_REQUEST_BY_ID: (id: string) => `/api/admin/community-requests/${id}`,
    APPROVE_COMMUNITY_REQUEST: (id: string) => `/api/admin/community-requests/${id}/approve`,
    REJECT_COMMUNITY_REQUEST: (id: string) => `/api/admin/community-requests/${id}/reject`,
    EXPORT_COMMUNITY_REQUESTS: '/api/admin/community-requests/export',

    // Community Management All
    COMMUNITY_MANAGEMENT_ALL: '/api/admin/community-management/communities',
    COMMUNITY_MANAGEMENT_BY_ID: (id: string) => `/api/admin/community-management/communities/${id}`,
    COMMUNITY_MANAGEMENT_UPDATE_STATUS: (id: string) => `/api/admin/community-management/communities/${id}/status`,
    COMMUNITY_MANAGEMENT_UPDATE_VERIFICATION: (id: string) => `/api/admin/community-management/communities/${id}/verification`,
    COMMUNITY_MANAGEMENT_DELETE: (id: string) => `/api/admin/community-management/communities/${id}`,
    COMMUNITY_MANAGEMENT_MEMBERS: (id: string) => `/api/admin/community-management/communities/${id}/members`,
    COMMUNITY_MANAGEMENT_SETTINGS: (id: string) => `/api/admin/community-management/communities/${id}/settings`,



    // Wallet Management
    WALLETS: '/api/admin/wallets',
    WALLET_BY_ADDRESS: (address: string) => `/api/admin/wallets/${address}`,
    WALLET_STATS: '/api/admin/wallets/stats',
    WALLET_TRANSACTIONS: (address: string) => `/api/admin/wallets/${address}/transactions`,
    WALLET_HISTORY: (address: string) => `/api/admin/wallets/${address}/history`,
    WALLET_APP_HISTORY: (address: string) => `/api/admin/wallets/${address}/app-history`,
    EXPORT_WALLETS: '/api/admin/wallets/export',
    REFRESH_WALLET: (address: string) => `/api/admin/wallets/${address}/refresh`,
    WALLET_BLOCKCHAIN_TRANSACTIONS: (address: string) => `/api/admin/wallets/${address}/blockchain-transactions`,
    WALLET_CONTRACT_INTERACTIONS: (address: string) => `/api/admin/wallets/${address}/contract-interactions`,

    // User Details
    USER_REFERRALS: (id: string) => `/api/admin/users/${id}/referrals`,
    USER_POINTS_HISTORY: (id: string) => `/api/admin/users/${id}/points-history`,
    USER_CHECKIN_HISTORY: (id: string) => `/api/admin/users/${id}/checkin-history`,
    USER_STATS: (id: string) => `/api/admin/users/${id}/stats`,

    // DEX
    DEX_PAYMENTS: '/api/admin/dex/payments',
    DEX_APPROVE_PAYMENT: '/api/admin/dex/approve-payment',
    DEX_REJECT_PAYMENT: '/api/admin/dex/reject-payment',
    DEX_FULFILL_PAYMENT: '/api/admin/dex/fulfill-payment',
    DEX_STATS: '/api/admin/dex/stats',
    DEX_PENDING: '/api/admin/dex/pending',

    // Points Conversion (Admin)
    POINTS_CONVERSION: {
        ALL: '/api/admin/points-conversion/all',
        APPROVE: (id: string) => `/api/admin/points-conversion/${id}/approve`,
        REJECT: (id: string) => `/api/admin/points-conversion/${id}/reject`,
        STATS: '/api/admin/points-conversion/stats',
        BY_ID: (id: string) => `/api/admin/points-conversion/${id}`,
        RATE_UPDATE: '/api/admin/points-conversion/rate/update',
        RATES: '/api/admin/points-conversion/rates',
        RATE_CURRENT: '/api/admin/points-conversion/rate/current',
    },

    // Community Posts
    COMMUNITY_POSTS: '/api/admin/community-posts',
    COMMUNITY_POST_BY_ID: (id: string) => `/api/admin/community-posts/${id}`,
    COMMUNITY_POST_RESTORE: (id: string) => `/api/admin/community-posts/${id}/restore`,
    COMMUNITY_POST_COMMENTS: (id: string) => `/api/admin/community-posts/${id}/comments`,
    COMMUNITY_POST_LIKERS: (id: string) => `/api/admin/community-posts/${id}/likers`,

    DASHBOARD_STATS: '/api/admin/dashboard/stats',

    MARKET_COINS: '/api/admin/market/coins',
    MARKET_COIN_LISTING: (address: string) => `/api/admin/market/coins/${address}/listing`,
    MARKET_COIN_BY_ADDRESS: (address: string) => `/api/admin/market/coins/${address}`,
};

// Community Admin API Routes
export const COMMUNITY_ADMIN_API_ROUTES = {
    BASE: '/api/community-admin',

    // Auth
    CHECK_EMAIL: '/api/community-admin/check-email',
    CHECK_USERNAME: '/api/community-admin/check-username',
    APPLY: '/api/community-admin/apply',
    REAPPLY: '/api/community-admin/reapply',
    SET_PASSWORD: '/api/community-admin/set-password',
    VERIFY_OTP: '/api/community-admin/verify-otp',
    RESEND_OTP: '/api/community-admin/resend-otp',
    LOGIN: '/api/community-admin/login',
    LOGOUT: '/api/community-admin/logout',
    REFRESH_TOKEN: '/api/community-admin/refresh-token',
    FORGOT_PASSWORD: '/api/community-admin/forgot-password',
    VERIFY_FORGOT_PASSWORD_OTP: '/api/community-admin/verify-forgot-password-otp',
    RESET_PASSWORD: '/api/community-admin/reset-password',

    // Profile & Community
    PROFILE: '/api/community-admin/profile',
    COMMUNITY: '/api/community-admin/community',
    COMMUNITY_MEMBERS: '/api/community-admin/community/members',

    // Dashboard
    DASHBOARD: '/api/community-admin/dashboard',
    DASHBOARD_OVERVIEW: '/api/community-admin/dashboard/overview',
    DASHBOARD_STATS: '/api/community-admin/dashboard/stats',

    // Chat - Channel
    CHANNEL_SEND: '/api/community-admin/community/channel/send',
    CHANNEL_MESSAGES: '/api/community-admin/community/channel/messages',
    CHANNEL_MESSAGE_BY_ID: (id: string) => `/api/community-admin/community/channel/messages/${id}`,
    CHANNEL_MESSAGE_PIN: (id: string) => `/api/community-admin/community/channel/messages/${id}/pin`,
    CHANNEL_MESSAGE_UNPIN: (id: string) => `/api/community-admin/community/channel/messages/${id}/unpin`,
    CHANNEL_MESSAGE_REACTIONS: (id: string) => `/api/community-admin/community/channel/messages/${id}/reactions`,
    CHANNEL_UPLOAD_MEDIA: '/api/community-admin/community/channel/upload-media',

    // Chat - Group
    GROUP_MESSAGES: '/api/community-admin/community/group-chat/messages',
    GROUP_MESSAGE_BY_ID: (id: string) => `/api/community-admin/community/group-chat/messages/${id}`,

    // Feed
    FEED: '/api/community-admin/feed',
    FEED_MEMBERS: '/api/community-admin/feed/members',
    FEED_POST_LIKE: (id: string) => `/api/community-admin/feed/posts/${id}/like`,
    FEED_COMMENTS: '/api/community-admin/feed/comments',
    FEED_POST_SHARE: (id: string) => `/api/community-admin/feed/posts/${id}/share`,
    FEED_POST_PIN: (id: string) => `/api/community-admin/feed/posts/${id}/pin`,
    FEED_POST_BY_ID: (id: string) => `/api/community-admin/feed/posts/${id}`,
    FEED_POST_COMMENTS: (id: string) => `/api/community-admin/feed/posts/${id}/comments`,
    ENGAGEMENT_STATS: '/api/community-admin/engagement-stats',

    // Members
    MEMBERS: '/api/community-admin/members',
    MEMBER_BY_ID: (id: string) => `/api/community-admin/members/${id}`,
    MEMBER_ROLE: '/api/community-admin/members/role',
    MEMBER_BAN_ACTION: '/api/community-admin/members/ban',
    MEMBER_UNBAN: (id: string) => `/api/community-admin/members/${id}/unban`,
    MEMBER_ACTIVITY: (id: string) => `/api/community-admin/members/${id}/activity`,
    MEMBERS_BULK_UPDATE: '/api/community-admin/members/bulk-update',

    // Posts
    POSTS: '/api/community-admin/posts',
    POSTS_CREATE: '/api/community-admin/posts/create',
    POST_BY_ID: (id: string) => `/api/community-admin/posts/${id}`,
    POST_LIKE: (id: string) => `/api/community-admin/posts/${id}/like`,
    POST_COMMENTS_CREATE: '/api/community-admin/posts/comments/create',
    POST_COMMENTS: (id: string) => `/api/community-admin/posts/${id}/comments`,
    POST_COMMENT_LIKE: (id: string) => `/api/community-admin/posts/comments/${id}/like`,
    POST_UPLOAD_MEDIA: '/api/community-admin/posts/upload-media',

    // Profile Specific
    PROFILE_UPLOAD_PICTURE: '/api/community-admin/profile/upload-picture',
    PROFILE_UPLOAD_BANNER: '/api/community-admin/profile/upload-banner',
    COMMUNITY_STATS: '/api/community-admin/community-stats',

    // Subscription
    SUBSCRIPTION: '/api/community-admin/subscription',
    SUBSCRIPTION_CREATE_ORDER: '/api/community-admin/subscription/create-order',
    SUBSCRIPTION_VERIFY_PAYMENT: '/api/community-admin/subscription/verify-payment',
    SUBSCRIPTION_RETRY_PAYMENT: '/api/community-admin/subscription/retry-payment',
    SUBSCRIPTION_TIME_REMAINING: '/api/community-admin/subscription/time-remaining',
    SUBSCRIPTION_CHAINCAST_ACCESS: '/api/community-admin/subscription/chaincast-access',

    // ChainCast (Community Admin)
    CHAINCAST: {
        CREATE: '/api/community-admin/chaincast/create',
        LIST: '/api/community-admin/chaincast',
        BY_ID: (id: string) => `/api/community-admin/chaincast/${id}`,
        START: (id: string) => `/api/community-admin/chaincast/${id}/start`,
        END: (id: string) => `/api/community-admin/chaincast/${id}/end`,
        PARTICIPANTS: (id: string) => `/api/community-admin/chaincast/${id}/participants`,
        PARTICIPANT_ACTION: (id: string, participantId: string) => `/api/community-admin/chaincast/${id}/participants/${participantId}`,
        MODERATION_REQUESTS: (id: string) => `/api/community-admin/chaincast/${id}/moderation-requests`,
        REVIEW_MODERATION: '/api/community-admin/chaincast/moderation-requests/review',
        ANALYTICS: '/api/community-admin/chaincast/analytics',
        REACTIONS: (id: string) => `/api/community-admin/chaincast/${id}/reactions`,
    },

    // Quests (Community Admin)
    QUESTS: {
        CREATE: '/api/community-admin/quests/create',
        BASE: '/api/community-admin/quests',
        BY_ID: (id: string) => `/api/community-admin/quests/${id}`,
        GENERATE_AI: '/api/community-admin/quests/generate-ai',
        START: (id: string) => `/api/community-admin/quests/${id}/start`,
        END: (id: string) => `/api/community-admin/quests/${id}/end`,
        PARTICIPANTS: (id: string) => `/api/community-admin/quests/${id}/participants`,
        PARTICIPANT_DETAILS: (id: string, participantId: string) => `/api/community-admin/quests/${id}/participants/${participantId}`,
        SELECT_WINNERS: '/api/community-admin/quests/select-winners',
        SELECT_REPLACEMENT: (id: string) => `/api/community-admin/quests/${id}/select-replacement-winners`,
        DISQUALIFY: (id: string, participantId: string) => `/api/community-admin/quests/${id}/participants/${participantId}/disqualify`,
        DISTRIBUTE_REWARDS: (id: string) => `/api/community-admin/quests/${id}/distribute-rewards`,
        STATS: (id: string) => `/api/community-admin/quests/${id}/stats`,
        COMMUNITY_STATS: '/api/community-admin/quests/stats',
        LEADERBOARD: (id: string) => `/api/community-admin/quests/${id}/leaderboard`,
        UPLOAD_BANNER: (id: string) => `/api/community-admin/quests/${id}/upload-banner`,
        AI_CHAT: '/api/community-admin/quests/ai-chat',
    },
};

// User API Routes
export const USER_API_ROUTES = {
    // Auth
    LOGIN: '/api/user/login',
    REGISTER: '/api/user/register',
    VERIFY_OTP: '/api/user/verify-otp',
    CHECK_USERNAME: '/api/user/check-username',
    GENERATE_USERNAME: '/api/user/generate-username',
    REQUEST_OTP: '/api/user/request-otp',
    FORGOT_PASSWORD: '/api/user/forgot-password',
    VERIFY_FORGOT_PASSWORD_OTP: '/api/user/verify-forgot-password-otp',
    RESET_PASSWORD: '/api/user/reset-password',
    LOGOUT: '/api/user/logout',
    GOOGLE_LOGIN: '/api/user/google-login',
    UPLOAD_PROFILE_IMAGE: '/api/user/upload-profile-image',

    // Profile
    GET_PROFILE: '/api/user/get-profile',
    UPDATE_PROFILE: '/api/user/profile',

    // Referrals
    REFERRALS_STATS: '/api/user/referrals/stats',
    REFERRALS_HISTORY: '/api/user/referrals/history',

    // Points
    POINTS_DAILY_CHECKIN: '/api/user/points/daily-checkin',
    POINTS_CHECKIN_STATUS: '/api/user/points/checkin-status',
    POINTS_CHECKIN_CALENDAR: '/api/user/points/checkin-calendar',
    POINTS_HISTORY: '/api/user/points/history',

    // Community
    COMMUNITY_PROFILE: '/api/user/community/profile',
    COMMUNITY_PROFILE_BY_USERNAME: (username: string) => `/api/user/community/profile/username/${username}`,
    COMMUNITY_FOLLOW: '/api/user/community/follow',
    COMMUNITY_UNFOLLOW: '/api/user/community/unfollow',
    COMMUNITY_FOLLOWERS: '/api/user/community/followers',
    COMMUNITY_FOLLOWING: '/api/user/community/following',
    COMMUNITY_USER_FOLLOWERS: (username: string) => `/api/user/community/user/${username}/followers`,
    COMMUNITY_USER_FOLLOWING: (username: string) => `/api/user/community/user/${username}/following`,
    COMMUNITY_FOLLOW_STATUS: (username: string) => `/api/user/community/follow-status/${username}`,
    COMMUNITY_UPLOAD_BANNER: '/api/user/community/upload-banner-image',

    // Chat
    CHAT_SEND: '/api/user/chat/send',
    CHAT_CONVERSATIONS: '/api/user/chat/conversations',
    CHAT_CONVERSATION_MESSAGES: (id: string) => `/api/user/chat/conversations/${id}/messages`,
    CHAT_CONVERSATION_BY_USERNAME: (username: string) => `/api/user/chat/conversation/${username}`,
    CHAT_MESSAGE_BY_ID: (id: string) => `/api/user/chat/messages/${id}`,
    CHAT_MESSAGES_READ: '/api/user/chat/messages/read',

    // ChainCast
    CHAINCAST_COMMUNITY: (id: string) => `/api/user/community/${id}/chaincasts`,
    CHAINCAST_BY_ID: (id: string) => `/api/user/chaincast/${id}`,
    CHAINCAST_CAN_JOIN: (id: string) => `/api/user/chaincast/${id}/can-join`,
    CHAINCAST_JOIN: '/api/user/chaincast/join',
    CHAINCAST_LEAVE: (id: string) => `/api/user/chaincast/${id}/leave`,
    CHAINCAST_PARTICIPANT: (id: string) => `/api/user/chaincast/${id}/participant`,
    CHAINCAST_REQUEST_MODERATION: '/api/user/chaincast/request-moderation',
    CHAINCAST_REACTION: '/api/user/chaincast/reaction',
    CHAINCAST_REACTIONS: (id: string) => `/api/user/chaincast/${id}/reactions`,

    // Wallet
    WALLET: '/api/wallet',

    // Market
    MARKET_COINS: '/api/user/market/coins/public',

    // DEX
    DEX_ETH_PRICE: '/api/user/dex/eth-price',
    DEX_CALCULATE_ESTIMATE: '/api/user/dex/calculate-estimate',
    DEX_CREATE_ORDER: '/api/user/dex/create-order',
    DEX_VERIFY_PAYMENT: '/api/user/dex/verify-payment',
    DEX_PAYMENTS: '/api/user/dex/payments',

    // Posts
    POSTS_CREATE: '/api/user/posts/create',
    POST_BY_ID: (id: string) => `/api/user/posts/${id}`,
    POSTS_FEED: '/api/user/posts/feed/all',
    POSTS_USER: (id: string) => `/api/user/posts/user/${id}/all`,
    POSTS_LIKED: (id: string) => `/api/user/posts/user/${id}/liked`,
    POSTS_TRENDING: '/api/user/posts/trending/all',
    POSTS_SEARCH: '/api/user/posts/search/all',
    POST_LIKE: (id: string) => `/api/user/posts/${id}/like`,
    POST_COMMENTS_CREATE: '/api/user/posts/comments/create',
    POST_COMMENT_UPDATE: (id: string) => `/api/user/posts/comments/${id}`,
    POST_COMMENT_DELETE: (id: string) => `/api/user/posts/comments/${id}`,
    POST_COMMENTS: (id: string) => `/api/user/posts/${id}/comments`,
    POST_COMMENT_REPLIES: (id: string) => `/api/user/posts/comments/${id}/replies`,
    POST_COMMENT_LIKE: (id: string) => `/api/user/posts/comments/${id}/like`,
    POST_UPLOAD_MEDIA: '/api/user/posts/upload-media',
    POST_SHARE: '/api/user/posts/share',
    POST_STATS: '/api/user/posts/stats/analytics',
    POST_HASHTAGS_POPULAR: '/api/user/posts/hashtags/popular',
    COMMUNITY_SEARCH_USERS: '/api/user/community/search-users',

    // AI Trading
    AI_TRADING: {
        BASE: '/api/ai-trading',
        CHAT_MESSAGE: '/api/ai-trading/chat/message',
        TOKENS: '/api/ai-trading/tokens',
        PRICES: '/api/ai-trading/prices',
        SWAP_ESTIMATE: '/api/ai-trading/swap/estimate',
        TRADE_ANALYZE: '/api/ai-trading/trade/analyze',
        TRADE_EXECUTE: '/api/ai-trading/trade/execute',
        CHAT_HISTORY: (sessionId: string) => `/api/ai-trading/chat/history/${sessionId}`,
    },

    // Points Conversion
    POINTS_CONVERSION: {
        CREATE: '/api/user/points-conversion/create',
        HISTORY: '/api/user/points-conversion/history',
        CLAIM: '/api/user/points-conversion/claim',
        RATE: '/api/user/points-conversion/rate',
        VALIDATE: '/api/user/points-conversion/validate',
    },

    // Quests
    QUESTS: {
        BASE: '/api/user/quests',
        BY_ID: (id: string) => `/api/user/quests/${id}`,
        TOP: '/api/user/quests/top',
        MY: '/api/user/quests/my',
        JOIN: '/api/user/quests/join',
        PARTICIPATION_STATUS: (id: string) => `/api/user/quests/${id}/participation-status`,
        TASKS: (id: string) => `/api/user/quests/${id}/tasks`,
        SUBMIT_TASK: '/api/user/quests/submit-task',
        MY_SUBMISSIONS: (id: string) => `/api/user/quests/${id}/submissions`,
        UPLOAD_MEDIA: '/api/user/quests/upload-media',
        STATS: (id: string) => `/api/user/quests/${id}/stats`,
        LEADERBOARD: (id: string) => `/api/user/quests/${id}/leaderboard`,
    },

    // Communities (Explore/User Side)
    COMMUNITIES: {
        SEARCH: '/api/user/communities/search',
        POPULAR: '/api/user/communities/popular',
        BY_USERNAME: (username: string) => `/api/user/communities/username/${username}`,
        BY_ID: (id: string) => `/api/user/communities/${id}`,
        USER_PROFILE: (username: string) => `/api/user/community/profile/username/${username}`,
        JOIN: '/api/user/communities/join',
        LEAVE: '/api/user/communities/leave',
        MEMBERS: (username: string) => `/api/user/communities/${username}/members`,
        MEMBER_STATUS: (username: string) => `/api/user/communities/${username}/member-status`,
        FOLLOW: '/api/user/community/follow',
        UNFOLLOW: '/api/user/community/unfollow',
        FOLLOW_STATUS: (username: string) => `/api/user/community/follow-status/${username}`,
    },

    // Community Chat (User Side)
    COMMUNITY_CHAT: {
        CHANNEL_MESSAGES: (username: string) => `/api/user/community/${username}/channel/messages`,
        REACT_CHANNEL_MESSAGE: (id: string) => `/api/user/community/channel/messages/${id}/react`,
        GROUP_SEND: '/api/user/community/group-chat/send',
        GROUP_MESSAGES: (username: string) => `/api/user/community/${username}/group-chat/messages`,
        GROUP_MESSAGE_BY_ID: (id: string) => `/api/user/community/group-chat/messages/${id}`,
        GROUP_READ: (username: string) => `/api/user/community/${username}/group-chat/read`,
    },

    // My Communities
    MY_COMMUNITIES: {
        BASE: '/api/user/my-communities',
        STATS: '/api/user/my-communities/stats',
        ACTIVITY: '/api/user/my-communities/activity',
        NOTIFICATIONS: (id: string) => `/api/user/my-communities/${id}/notifications`,
        LEAVE: (id: string) => `/api/user/my-communities/${id}/leave`,
    },

    // Notifications System
    NOTIFICATIONS_SYSTEM: {
        BASE: '/api/user/notifications',
        MARK_READ: (id: string) => `/api/user/notifications/${id}/read`,
        MARK_ALL_READ: '/api/user/notifications/mark-all-read',
        DELETE: (id: string) => `/api/user/notifications/${id}`,
    },
};
