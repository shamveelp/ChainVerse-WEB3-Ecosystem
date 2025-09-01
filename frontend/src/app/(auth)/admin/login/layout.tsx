"use client"

import { AdminPreventLoggedIn } from '@/redirects/adminRedirects'

export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminPreventLoggedIn>
      {children}
    </AdminPreventLoggedIn>
  )
}