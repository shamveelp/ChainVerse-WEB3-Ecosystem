import type React from "react"
import type { Metadata } from "next"
import ClientLayout from "./clientLayout"


export const metadata: Metadata = {
  title: "ChainVerse - Your WEB3 Platform",
  description: "A modern web application with authentication",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClientLayout>

      {children}

    </ClientLayout>
  )
}
