import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
// import { Analytics } from '@vercel/analytics/next'


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div>
      {children}
      {/* <Analytics /> */}

    </div>
  )
}
