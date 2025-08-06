"use client"

import { DollarSign, Users, ShoppingCart, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Static dashboard data
const dashboardStats = [
  {
    title: "Total Revenue",
    value: "$45,231.89",
    change: "+20.1% from last month",
    icon: DollarSign,
    trend: "up",
  },
  {
    title: "Active Users",
    value: "2,350",
    change: "+180.1% from last month",
    icon: Users,
    trend: "up",
  },
  {
    title: "Total Orders",
    value: "12,234",
    change: "+19% from last month",
    icon: ShoppingCart,
    trend: "up",
  },
  {
    title: "Conversion Rate",
    value: "3.2%",
    change: "+4.75% from last month",
    icon: TrendingUp,
    trend: "up",
  },
]

export function DashboardStats() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {dashboardStats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">
              {stat.change}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
