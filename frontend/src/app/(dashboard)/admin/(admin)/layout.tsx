// "use client"

// import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
// import { AppSidebar } from "@/components/admin/admin-sidebar"
// import { DashboardHeader } from "@/components/admin/dashboard-header"
// import { AdminProtectedRoute } from '@/redirects/adminRedirects'

// export default function AdminLayout({
//   children,
// }: {
//   children: React.ReactNode
// }) {
//   return (
//     <AdminProtectedRoute>
//       <div className="min-h-screen bg-slate-950">
//         <SidebarProvider>
//           <AppSidebar />
//           <SidebarInset>
//             <DashboardHeader />
//             <main className="flex-1 p-6">
//               {children}
//             </main>
//           </SidebarInset>
//         </SidebarProvider>
//       </div>
//     </AdminProtectedRoute>
//   )
// }

"use client";

import { SidebarProvider, useSidebar } from "@/context/admin/SidebarContext";
import { ThemeProvider } from "@/context/admin/ThemeContext";
import AppHeader from "@/layout/admin/AppHeader";
import AppSidebar from "@/layout/admin/AppSidebar";
import Backdrop from "@/layout/admin/Backdrop";
import { AdminProtectedRoute } from "@/redirects/adminRedirects";
import React from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  // Dynamic class for main content margin based on sidebar state
  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
    ? "lg:ml-[290px]"
    : "lg:ml-[90px]";

  return (
    <AdminProtectedRoute>

    <div className="min-h-screen xl:flex">
      {/* Sidebar and Backdrop */}
      <AppSidebar />
      <Backdrop />
      {/* Main Content Area */}
      <div
        className={`flex-1 transition-all  duration-300 ease-in-out ${mainContentMargin}`}
      >
        {/* Header */}
        <AppHeader />
        {/* Page Content */}
        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">{children}</div>
      </div>
    </div>
    </AdminProtectedRoute>
  );
}

