"use client"

import { Bell, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SidebarTrigger } from "@/components/ui/sidebar"

export function DashboardHeader() {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-gray-800 bg-gray-950 px-4 text-gray-100">
      <SidebarTrigger className="-ml-1 text-gray-300" />
      <div className="flex flex-1 items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search..."
            className="pl-8 bg-gray-900 border border-gray-700 text-gray-100 placeholder-gray-500"
          />
        </div>
        <Button variant="outline" size="icon" className="border-gray-700 text-gray-300 hover:text-white hover:border-gray-500">
          <Bell className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
