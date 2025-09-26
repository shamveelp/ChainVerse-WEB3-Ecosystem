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

  return (
    <div className="min-h-screen bg-slate-950">
      {isAuthenticated && <Navbar />}
      {children}
    </div>
  )
}