"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { Sidebar } from "@/components/comms-admin/sidebar";
import { Navbar } from "@/components/comms-admin/navbar";
import type { RootState } from "@/redux/store";
import { COMMUNITY_ADMIN_ROUTES } from "@/routes";

export default function CommunityAdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, applicationStatus } = useSelector((state: RootState) => state.communityAdminAuth);

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

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-950 relative overflow-hidden">
      <div className="relative z-10 flex h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col relative">
          {/* Animated Background for Main Content Only */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-blue-950/50 to-purple-950/50" />
            <div className="absolute top-1/5 left-1/5 w-80 h-80 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-1/5 right-1/5 w-64 h-64 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
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