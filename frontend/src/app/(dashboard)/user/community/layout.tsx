"use client"

import { useSelector } from 'react-redux'
import type { RootState } from "@/redux/store"
import Navbar from "@/components/home/navbar"

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated } = useSelector((state: RootState) => state.userAuth)

  if (!isAuthenticated) {
    return children
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      {children}
    </div>
  )
}