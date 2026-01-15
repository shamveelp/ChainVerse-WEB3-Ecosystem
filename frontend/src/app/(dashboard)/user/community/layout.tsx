"use client";

import { usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { RootState } from "@/redux/store";
import Navbar from "@/components/home/navbar";
import Sidebar from "@/components/community/sidebar";
import RightSidebar from "@/components/community/right-sidebar";
import { cn } from "@/lib/utils";
import { USER_ROUTES } from "@/routes";

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, loading } = useSelector(
    (state: RootState) => state.userAuth
  );

  useEffect(() => {
    // Auth check logic if needed
  }, [isAuthenticated, loading, router]);

  // If on compose page, render simplified layout
  if (pathname?.includes("/compose/tweet")) {
    return <div className="min-h-screen bg-slate-950">{children}</div>;
  }

  // Special case for Landing Page (Unauthenticated Root)
  const isLandingPage = !isAuthenticated && pathname === USER_ROUTES.COMMUNITY;

  if (isLandingPage) {
    return <div className="min-h-screen bg-slate-950"><Navbar />{children}</div>;
  }

  const isMessagesPage = pathname?.includes("/messages");

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />

      {/* Sidebars */}
      <Sidebar />
      <RightSidebar />

      {/* Main Content Area */}
      <div className={cn(
        "pt-[4.5rem] min-h-screen pb-20 lg:pb-0",
        "lg:ml-[88px] xl:ml-[275px]",
        !isMessagesPage && "xl:mr-80"
      )}>
        <div className={cn(
          "mx-auto min-h-screen border-slate-800",
          isMessagesPage ? "w-full border-0" : "max-w-[600px] w-full border-x"
        )}>
          {children}
        </div>
      </div>
    </div>
  );
}
