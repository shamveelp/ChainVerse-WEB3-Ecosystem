"use client"

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/admin/admin-sidebar"
import { DashboardHeader } from "@/components/admin/dashboard-header"
import { AdminProtectedRoute } from '@/redirects/adminRedirects'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminProtectedRoute>
      <div className="min-h-screen bg-slate-950">
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <DashboardHeader />
            <main className="flex-1 p-6">
              {children}
            </main>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </AdminProtectedRoute>
  )
}
