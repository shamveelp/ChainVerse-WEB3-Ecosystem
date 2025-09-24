"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Home, Search, Users, MessageCircle, User, Settings, LogOut, Menu, X } from 'lucide-react'
import { cn } from "@/lib/utils"

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const navigationItems = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'explore', label: 'Explore', icon: Search },
  { id: 'communities', label: 'Communities', icon: Users },
  { id: 'messages', label: 'Messages', icon: MessageCircle },
  { id: 'profile', label: 'Profile', icon: User },
]

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    // Handle logout logic here
    router.push('/')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700/50">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
          ChainVerse
        </h2>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon
          return (
            <Button
              key={item.id}
              variant="ghost"
              className={cn(
                "w-full justify-start text-left p-4 h-auto group transition-all duration-200",
                activeTab === item.id
                  ? "bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-white border border-cyan-400/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              )}
              onClick={() => {
                onTabChange(item.id)
                setIsMobileMenuOpen(false)
              }}
            >
              <Icon className={cn(
                "h-5 w-5 mr-3 transition-colors",
                activeTab === item.id ? "text-cyan-400" : "group-hover:text-cyan-400"
              )} />
              <span className="text-lg">{item.label}</span>
            </Button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700/50 space-y-2">
        <Button
          variant="ghost"
          className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800/50"
        >
          <Settings className="h-5 w-5 mr-3" />
          Settings
        </Button>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start text-slate-400 hover:text-red-400 hover:bg-red-500/10"
        >
          <LogOut className="h-5 w-5 mr-3" />
          Logout
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden fixed top-4 left-4 z-50 bg-slate-800/80 backdrop-blur-sm"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-80 bg-slate-900/80 backdrop-blur-xl border-r border-slate-700/50 fixed left-0 top-0 h-full">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
          <aside className="relative w-80 bg-slate-900/95 backdrop-blur-xl h-full">
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  )
}