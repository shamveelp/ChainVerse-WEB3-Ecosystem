import Navbar from '@/components/home/navbar'
import TradeNavbar from '@/components/user/trade/trade-navbar'
import React from 'react'

const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
        <Navbar />
        <TradeNavbar />
      {children}
    </div>
  )
}

export default layout
