"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { User, Trophy, Users, CheckSquare, Coins } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
    {
        title: "Profile",
        href: "/my-profile",
        icon: User,
    },
    {
        title: "Points",
        href: "/my-profile/points",
        icon: Coins,
    },
    {
        title: "Refer",
        href: "/my-profile/refer",
        icon: Users,
    },
    {
        title: "Quests",
        href: "/my-profile/quests",
        icon: CheckSquare,
    },
]

export default function MobileBottomNav() {
    const pathname = usePathname()

    return (
        <div className="fixed bottom-6 left-4 right-4 z-50 lg:hidden">
            <nav className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl px-2 py-2 flex justify-between items-center max-w-sm mx-auto">
                {navItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-300 w-full",
                                isActive
                                    ? "bg-white text-black shadow-lg scale-105"
                                    : "text-slate-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <Icon className={cn("h-5 w-5", isActive && "fill-current")} />
                            <span className="text-[10px] font-medium mt-1">{item.title}</span>
                        </Link>
                    )
                })}
            </nav>
        </div>
    )
}
