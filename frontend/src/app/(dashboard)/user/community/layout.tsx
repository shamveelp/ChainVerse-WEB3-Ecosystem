"use client"

import { useSelector } from 'react-redux'
import type { RootState } from "@/redux/store"
import Navbar from "@/components/home/navbar"
import Sidebar from "@/components/community/sidebar"
import RightSidebar from "@/components/community/right-sidebar"

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated } = useSelector((state: RootState) => state.userAuth)

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950">
        {children}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <div className="flex max-w-[1400px] mx-auto">
        {/* Left Sidebar */}
        <Sidebar />
        
        {/* Main Content */}
        <main className="flex-1 lg:ml-80 xl:mr-80 min-h-screen bg-slate-950">
          <div className="max-w-2xl mx-auto">
            {children}
          </div>
        </main>
        
        {/* Right Sidebar */}
        <RightSidebar />
      </div>
    </div>
  )
}