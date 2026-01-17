import { configureStore } from "@reduxjs/toolkit";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import { combineReducers } from "@reduxjs/toolkit";
import userAuthReducer from "./slices/userAuthSlice";
import userProfileReducer from "./slices/userProfileSlice";
import adminAuthReducer from "./slices/adminAuthSlice";
import adminStatsReducer from "./slices/adminStatistics";
import communityAdminAuthReducer from "./slices/communityAdminAuthSlice";
import walletReducer from "./slices/walletSlice";
import communityProfileReducer from "./slices/communityProfileSlice";
import communityExploreReducer from "./slices/communityExploreSlice";

// Create a function to get storage that works on both client and server
const createNoopStorage = () => {
  return {
    getItem(_key: string) {
      return Promise.resolve(null);
    },
    setItem(_key: string, value: unknown) {
      return Promise.resolve(value);
    },
    removeItem(_key: string) {
      return Promise.resolve();
    },
  };
};

// Use localStorage only on client side
const storage =
  typeof window !== "undefined"
    ? require("redux-persist/lib/storage").default
    : createNoopStorage();

const persistConfig = {
  key: "root",
  storage,
  whitelist: [
    "userAuth",
    "userProfile",
    "adminAuth",
    "adminStats",
    "communityAdminAuth",
    "wallet",
    "communityProfile",
    "communityExplore",
  ],
};

const rootReducer = combineReducers({
  userAuth: userAuthReducer,
  userProfile: userProfileReducer,
  adminAuth: adminAuthReducer,
  adminStats: adminStatsReducer,
  communityAdminAuth: communityAdminAuthReducer,
  wallet: walletReducer,
  communityProfile: communityProfileReducer,
  communityExplore: communityExploreReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
