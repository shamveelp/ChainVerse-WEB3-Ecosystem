"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { Sidebar } from "@/components/comms-admin/sidebar";
import { Navbar } from "@/components/comms-admin/navbar";
import type { RootState } from "@/redux/store";
import { COMMUNITY_ADMIN_ROUTES } from "@/routes";
import { setSubscription } from "@/redux/slices/communityAdminAuthSlice";
import { communityAdminSubscriptionApiService } from "@/services/communityAdmin/communityAdminSubscriptionApiService";

export default function CommunityAdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const { isAuthenticated, applicationStatus, communityAdmin, subscription } = useSelector((state: RootState) => state.communityAdminAuth);

  useEffect(() => {
    if (!isAuthenticated) {
      if (applicationStatus === "pending") {
        router.push(COMMUNITY_ADMIN_ROUTES.APPLICATION_SUBMITTED);
      } else if (applicationStatus === "rejected") {
        router.push(COMMUNITY_ADMIN_ROUTES.GET_STARTED);
      } else {
        router.push(COMMUNITY_ADMIN_ROUTES.LOGIN);
      }
    }
  }, [isAuthenticated, applicationStatus, router]);

  // Fetch subscription on mount if authenticated and subscription not loaded
  useEffect(() => {
    if (isAuthenticated && communityAdmin && !subscription) {
      const fetchSubscription = async () => {
        try {
          const response = await communityAdminSubscriptionApiService.getSubscription();
          if (response.success && response.data) {
            dispatch(setSubscription(response.data));
          } else {
            dispatch(setSubscription(null));
          }
        } catch (error) {
          console.error('Failed to fetch subscription in layout:', error);
          dispatch(setSubscription(null));
        }
      };
      fetchSubscription();
    }
  }, [isAuthenticated, communityAdmin, subscription, dispatch]);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      <div className="relative z-10 flex h-screen">
        <div className="hidden md:block h-full">
          <Sidebar />
        </div>
        <div className="flex-1 flex flex-col relative">
          {/* Animated Background for Main Content Only */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900/50 to-slate-950" />
            <div className="absolute top-1/5 left-1/5 w-80 h-80 bg-violet-500/10 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute bottom-1/5 right-1/5 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] animate-pulse delay-1000" />
          </div>
          <Navbar />
          <main className="flex-1 overflow-y-auto relative z-10">
            <div className="p-4 sm:p-6 lg:p-8">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}