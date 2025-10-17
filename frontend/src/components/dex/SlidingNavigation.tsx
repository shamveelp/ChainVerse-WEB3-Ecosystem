'use client';

import { useState } from 'react';
import { ChartBar as BarChart3, Repeat, Droplets, TrendingUp, Wallet, Settings, Menu, X, Chrome as Home, Activity, Users, Gift, CircleHelp as HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigationItems = [
  { icon: Home, label: 'Home', href: '/', badge: null },
  { icon: Repeat, label: 'Swap', href: '/swap', badge: null },
  { icon: Droplets, label: 'Liquidity', href: '/liquidity', badge: 'New' },
  { icon: BarChart3, label: 'Analytics', href: '/analytics', badge: null },
  { icon: TrendingUp, label: 'Farms', href: '/farms', badge: 'Hot' },
  { icon: Users, label: 'Referral', href: '/referral', badge: null },
  { icon: Gift, label: 'Rewards', href: '/rewards', badge: '3' },
  { icon: Activity, label: 'Portfolio', href: '/portfolio', badge: null },
  { icon: HelpCircle, label: 'Help', href: '/help', badge: null },
];

export default function SlidingNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-xl p-3 text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all duration-300"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sliding Navigation */}
      <div className={`
        fixed top-0 left-0 h-full w-80 bg-slate-900/95 backdrop-blur-2xl border-r border-slate-700/50 z-50 transform transition-transform duration-300 ease-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        lg:w-64 lg:relative lg:transform-none
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
              <Repeat className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-bold text-white">DexSwap</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-2">
          {navigationItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={index}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`
                  flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group
                  ${isActive 
                    ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 text-blue-400' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }
                `}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`h-5 w-5 ${isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-white'}`} />
                  <span className="font-medium">{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`
                    px-2 py-1 text-xs font-bold rounded-full
                    ${item.badge === 'New' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      item.badge === 'Hot' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                      'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }
                  `}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700/50">
          <div className="bg-slate-800/50 rounded-xl p-4 text-center">
            <Wallet className="h-6 w-6 text-slate-400 mx-auto mb-2" />
            <p className="text-sm text-slate-400 mb-2">Connect Wallet</p>
            <button className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-2 rounded-lg text-sm font-medium hover:from-blue-600 hover:to-cyan-600 transition-all duration-200">
              Connect
            </button>
          </div>
        </div>
      </div>
    </>
  );
}