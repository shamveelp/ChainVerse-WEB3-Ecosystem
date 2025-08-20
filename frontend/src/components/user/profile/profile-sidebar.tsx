"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { User, Trophy, Users, CheckSquare } from "lucide-react"
import { cn } from "@/lib/utils"

const sidebarItems = [
  {
    title: "My Profile",
    href: "/my-profile",
    icon: User,
  },
  {
    title: "Points",
    href: "/my-profile/points",
    icon: Trophy,
  },
  {
    title: "Refer a Friend",
    href: "/my-profile/refer",
    icon: Users,
  },
  {
    title: "Quests Completed",
    href: "/my-profile/quests",
    icon: CheckSquare,
  },
]

export default function ProfileSidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 h-screen sticky top-0">
      <div className="p-6">
        {/* Clean Header */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Profile</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">Manage your account</p>
        </div>

        {/* Clean Navigation */}
        <nav className="space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white",
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.title}</span>
              </Link>
            )
          })}
        </nav>

        {/* Clean Stats Card */}
        <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
          <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-3">Quick Stats</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600 dark:text-slate-400">Level</span>
              <span className="font-medium text-slate-900 dark:text-white">12</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600 dark:text-slate-400">Rank</span>
              <span className="font-medium text-blue-600 dark:text-blue-400">#247</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-1.5 mt-2">
              <div className="bg-blue-600 h-1.5 rounded-full w-3/4"></div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center">75% to next level</p>
          </div>
        </div>
      </div>
    </div>
  )
}
