'use client';

import { useRef, useEffect, useState } from 'react';
import { ArrowUpDown, Droplets, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigationTabs = [
  {
    id: 'swap',
    label: 'Swap',
    icon: ArrowUpDown,
    description: 'Trade tokens instantly',
    href: '/trade/swap'
  },
  {
    id: 'liquidity',
    label: 'Liquidity',
    icon: Droplets,
    description: 'Add liquidity to earn fees',
    href: '/trade/liquidity'
  },
  {
    id: 'buy',
    label: 'Buy Crypto',
    icon: CreditCard,
    description: 'Buy crypto with fiat',
    href: '/trade/buy'
  }
];

export default function PillNavigation() {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState('swap');
  const [indicatorStyle, setIndicatorStyle] = useState<{ width: number; left: number }>({ width: 0, left: 0 });
  const tabRefs = useRef<{ [key: string]: HTMLAnchorElement | null }>({});
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (pathname.includes('/trade/swap')) setActiveTab('swap');
    else if (pathname.includes('/trade/liquidity')) setActiveTab('liquidity');
    else if (pathname.includes('/trade/buy')) setActiveTab('buy');
  }, [pathname]);

  useEffect(() => {
    const activeTabElement = tabRefs.current[activeTab];
    const containerElement = containerRef.current;

    if (activeTabElement && containerElement) {
      const containerRect = containerElement.getBoundingClientRect();
      const tabRect = activeTabElement.getBoundingClientRect();

      setIndicatorStyle({
        width: tabRect.width,
        left: tabRect.left - containerRect.left,
      });
    }
  }, [activeTab]);

  return (
    <div className="mb-6 w-full max-w-lg mx-auto">
      {/* Main Pill Navigation */}
      <div
        ref={containerRef}
        className="bg-slate-950/80 backdrop-blur-xl rounded-full p-1.5 border border-white/10 relative z-0 shadow-lg shadow-black/20 overflow-x-auto no-scrollbar"
      >
        {/* Sliding Indicator */}
        <div
          className="absolute top-1.5 bottom-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-full transition-all duration-300 ease-out shadow-lg shadow-cyan-500/20 z-0 border border-white/10"
          style={{
            width: indicatorStyle.width,
            transform: `translateX(${indicatorStyle.left}px)`,
          }}
        />

        <div className="flex relative z-10 text-sm md:text-base">
          {navigationTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <Link
                key={tab.id}
                href={tab.href}
                ref={(el) => { tabRefs.current[tab.id] = el; }}
                className={`
                  flex-1 flex items-center justify-center space-x-2 px-2 md:px-6 py-2.5 rounded-full font-medium transition-all duration-300 select-none
                  ${isActive
                    ? 'text-white'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }
                `}
              >
                <Icon className={`h-4 w-4 transition-transform duration-300 ${isActive ? 'scale-110' : ''}`} />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}