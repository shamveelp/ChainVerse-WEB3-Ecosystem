import type React from "react"
import Navbar from "@/components/home/navbar"
import ProfileSidebar from "@/components/user/profile/profile-sidebar"

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex">
        <ProfileSidebar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
