'use client';

import { useRef, useEffect, useState } from 'react';
import { ArrowUpDown, Droplets, CreditCard, BarChart3 } from 'lucide-react';

interface PillNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navigationTabs = [
  {
    id: 'swap',
    label: 'Swap',
    icon: ArrowUpDown,
    description: 'Trade tokens instantly'
  },
  {
    id: 'liquidity',
    label: 'Liquidity',
    icon: Droplets,
    description: 'Add liquidity to earn fees'
  },
  {
    id: 'buy',
    label: 'Buy Crypto',
    icon: CreditCard,
    description: 'Buy crypto with fiat'
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    description: 'View market data'
  }
];

export default function PillNavigation({ activeTab, onTabChange }: PillNavigationProps) {
  const [indicatorStyle, setIndicatorStyle] = useState<{ width: number; left: number }>({ width: 0, left: 0 });
  const tabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const containerRef = useRef<HTMLDivElement>(null);

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
    <div className="mb-6">
      {/* Main Pill Navigation */}
      <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl p-2 border border-slate-700/50 mb-4 relative overflow-hidden">
        {/* Sliding Indicator */}
        <div
          className="absolute top-2 h-[calc(100%-16px)] bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl transition-all duration-300 ease-out shadow-lg shadow-blue-500/25"
          style={{
            width: indicatorStyle.width,
            transform: `translateX(${indicatorStyle.left}px)`,
          }}
        />

        <div className="flex space-x-1 relative z-10">
          {navigationTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                ref={(el) => (tabRefs.current[tab.id] = el)}
                onClick={() => onTabChange(tab.id)}
                className={`
                  relative flex items-center space-x-2 px-4 py-3 rounded-xl font-medium transition-all duration-300 flex-1 justify-center group
                  ${isActive
                    ? 'text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/30'
                  }
                `}
              >
                <Icon className={`h-4 w-4 transition-all duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className="text-sm font-semibold whitespace-nowrap">{tab.label}</span>

                {/* Subtle glow effect for active tab */}
                {isActive && (
                  <div className="absolute inset-0 rounded-xl bg-white/10 backdrop-blur-sm" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Description */}
      <div className="text-center">
        <p className="text-slate-400 text-sm transition-all duration-300">
          {navigationTabs.find(tab => tab.id === activeTab)?.description || 'Select a trading option'}
        </p>
      </div>
    </div>
  );
}