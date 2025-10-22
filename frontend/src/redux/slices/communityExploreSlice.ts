import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Community, UserSearchResult, SearchResponse } from '@/services/userCommunityServices/communityExploreApiService';

interface CommunityExploreState {
  // Search state
  searchResults: SearchResponse | null;
  searchLoading: boolean;
  searchQuery: string;
  searchFilter: string;
  
  // Popular communities
  popularCommunities: Community[];
  popularLoading: boolean;
  
  // Current community (when viewing community profile)
  currentCommunity: Community | null;
  currentCommunityLoading: boolean;
  
  // Errors
  error: string | null;
}

const initialState: CommunityExploreState = {
  searchResults: null,
  searchLoading: false,
  searchQuery: '',
  searchFilter: 'all',
  
  popularCommunities: [],
  popularLoading: false,
  
  currentCommunity: null,
  currentCommunityLoading: false,
  
  error: null,
};

export const communityExploreSlice = createSlice({
  name: 'communityExplore',
  initialState,
  reducers: {
    // Search actions
    setSearchLoading: (state, action: PayloadAction<boolean>) => {
      state.searchLoading = action.payload;
    },
    setSearchResults: (state, action: PayloadAction<SearchResponse>) => {
      state.searchResults = action.payload;
      state.error = null;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setSearchFilter: (state, action: PayloadAction<string>) => {
      state.searchFilter = action.payload;
    },
    clearSearchResults: (state) => {
      state.searchResults = null;
      state.searchQuery = '';
    },
    
    // Popular communities actions
    setPopularLoading: (state, action: PayloadAction<boolean>) => {
      state.popularLoading = action.payload;
    },
    setPopularCommunities: (state, action: PayloadAction<Community[]>) => {
      state.popularCommunities = action.payload;
      state.error = null;
    },
    
    // Current community actions
    setCurrentCommunityLoading: (state, action: PayloadAction<boolean>) => {
      state.currentCommunityLoading = action.payload;
    },
    setCurrentCommunity: (state, action: PayloadAction<Community | null>) => {
      state.currentCommunity = action.payload;
      state.error = null;
    },
    
    // Update community membership in all relevant places
    updateCommunityMembership: (state, action: PayloadAction<{
      communityId: string;
      isMember: boolean;
      memberCount: number;
    }>) => {
      const { communityId, isMember, memberCount } = action.payload;
      
      // Update in search results
      if (state.searchResults) {
        state.searchResults.communities = state.searchResults.communities.map(community =>
          community._id === communityId
            ? { ...community, isMember, memberCount }
            : community
        );
      }
      
      // Update in popular communities
      state.popularCommunities = state.popularCommunities.map(community =>
        community._id === communityId
          ? { ...community, isMember, memberCount }
          : community
      );
      
      // Update current community
      if (state.currentCommunity && state.currentCommunity._id === communityId) {
        state.currentCommunity = { ...state.currentCommunity, isMember, memberCount };
      }
    },
    
    // Error handling
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    
    // Clear all data
    clearAllData: (state) => {
      state.searchResults = null;
      state.searchQuery = '';
      state.popularCommunities = [];
      state.currentCommunity = null;
      state.error = null;
      state.searchLoading = false;
      state.popularLoading = false;
      state.currentCommunityLoading = false;
    },
  },
});

export const {
  setSearchLoading,
  setSearchResults,
  setSearchQuery,
  setSearchFilter,
  clearSearchResults,
  setPopularLoading,
  setPopularCommunities,
  setCurrentCommunityLoading,
  setCurrentCommunity,
  updateCommunityMembership,
  setError,
  clearError,
  clearAllData,
} = communityExploreSlice.actions;

export default communityExploreSlice.reducer;