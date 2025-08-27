import type React from "react"
import type { Metadata } from "next"
import ClientLayout from "./clientLayout"
import { ThemeProvider } from "@/components/theme-provider"
import { ThirdwebProvider } from "thirdweb/react";


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

      <ThemeProvider
          attribute="class"
          defaultTheme="dark" // Default to dark theme as per hero section background
          enableSystem
          disableTransitionOnChange
        >
          <ThirdwebProvider>

            {children}
          </ThirdwebProvider>
        </ThemeProvider>

    </ClientLayout>
  )
}
