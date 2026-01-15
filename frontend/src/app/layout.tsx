import type React from "react"
import type { Metadata } from "next"
import ClientLayout from "./clientLayout"
import { ThemeProvider } from "@/components/theme-provider"
import { ThirdwebProvider } from "thirdweb/react";
import { Providers } from "./providers";
import "./globals.css"


export const metadata: Metadata = {
  title: "ChainVerse - Your WEB3 Platform",
  description: "A modern web application with authentication",
}

import { cookies } from "next/headers";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies();
  const sessionExists = cookieStore.has("refreshToken") || cookieStore.has("accessToken");

  return (
    <html lang="en">
      <body className="antialiased">
        <ClientLayout sessionExists={sessionExists}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark" // Default to dark theme as per hero section background
            enableSystem
            disableTransitionOnChange
          >
            <ThirdwebProvider>
              <Providers>
                {children}
              </Providers>
            </ThirdwebProvider>
          </ThemeProvider>
        </ClientLayout>
      </body>
    </html>
  )
}
