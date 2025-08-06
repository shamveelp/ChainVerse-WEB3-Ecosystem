"use client"

import { Users, Package, FileText, Settings } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

const recentOrders = [
  {
    id: "ORD-001",
    customer: "John Doe",
    email: "john@example.com",
    amount: "$250.00",
    status: "Completed",
    date: "2024-01-15",
  },
  {
    id: "ORD-002",
    customer: "Jane Smith",
    email: "jane@example.com",
    amount: "$150.00",
    status: "Processing",
    date: "2024-01-14",
  },
  {
    id: "ORD-003",
    customer: "Mike Johnson",
    email: "mike@example.com",
    amount: "$350.00",
    status: "Shipped",
    date: "2024-01-13",
  },
  {
    id: "ORD-004",
    customer: "Sarah Wilson",
    email: "sarah@example.com",
    amount: "$200.00",
    status: "Completed",
    date: "2024-01-12",
  },
]

export function RecentOrders() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>
            You have {recentOrders.length} orders this week.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback>
                      {order.customer.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium leading-none">
                      {order.customer}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {order.email}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{order.amount}</p>
                  <Badge 
                    variant={
                      order.status === "Completed" ? "default" :
                      order.status === "Processing" ? "secondary" :
                      "outline"
                    }
                  >
                    {order.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-3">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Frequently used admin actions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button className="w-full justify-start" variant="outline">
            <Users className="mr-2 h-4 w-4" />
            Add New User
          </Button>
          <Button className="w-full justify-start" variant="outline">
            <Package className="mr-2 h-4 w-4" />
            Add Product
          </Button>
          <Button className="w-full justify-start" variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
          <Button className="w-full justify-start" variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            System Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
