'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { Home, Compass, PlusSquare, User } from 'lucide-react';
import { useState } from 'react';
import { ConnectButton } from 'thirdweb/react';
import { client } from '@/lib/thirdweb-client';
import { supportedChains } from '@/lib/thirdweb-config';
import { USER_ROUTES } from '@/routes';

const navigation = [
  { name: 'Home', href: { pathname: USER_ROUTES.NFT_MARKET }, icon: Home },
  { name: 'Explore', href: { pathname: USER_ROUTES.NFT_EXPLORE }, icon: Compass },
  { name: 'Create', href: { pathname: USER_ROUTES.NFT_CREATE }, icon: PlusSquare },
  { name: 'Profile', href: { pathname: USER_ROUTES.NFT_PROFILE }, icon: User },
];

export function Header() {
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    if (latest > previous && latest > 150) {
      setHidden(true);
    } else {
      setHidden(false);
    }
  });

  return (
    <div className="fixed bottom-6 inset-x-0 z-50 flex justify-center pointer-events-none px-4">
      <motion.nav
        variants={{
          visible: { y: 0, opacity: 1 },
          hidden: { y: "150%", opacity: 0 },
        }}
        initial="visible"
        animate={hidden ? "hidden" : "visible"}
        transition={{ duration: 0.35, ease: 'easeInOut' }}
        className="pointer-events-auto bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl shadow-purple-900/20 p-2 flex items-center gap-2 max-w-[95vw] md:max-w-fit overflow-hidden"
      >
        {/* Logo (Desktop only) */}
        <Link
          href={USER_ROUTES.NFT_MARKET}
          className="hidden md:flex items-center justify-center w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 transition-colors ml-1"
        >
          <span className="text-xl font-bold bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent">
            N
          </span>
        </Link>

        <div className="h-8 w-px bg-white/10 hidden md:block mx-1" />

        {/* Navigation */}
        <div className="flex items-center bg-white/5 rounded-3xl p-1 shrink-0">
          {navigation.map((item) => {
            const isActive = pathname === item.href.pathname;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`relative group flex items-center justify-center px-4 md:px-6 py-3 rounded-2xl transition-all duration-300 ${isActive
                  ? 'text-white bg-white/10 shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                <item.icon
                  className={`w-5 h-5 ${isActive ? 'text-pink-400' : ''}`}
                />

                {/* Desktop Label */}
                <span className="hidden md:block md:ml-2 text-sm font-medium whitespace-nowrap">
                  {item.name}
                </span>

                {/* Mobile Tooltip */}
                <span className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 scale-95 opacity-0 group-hover:opacity-100 group-hover:scale-100 md:hidden transition-all duration-200 bg-black/80 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap">
                  {item.name}
                </span>

                {isActive && (
                  <motion.div
                    layoutId="bubble"
                    className="absolute inset-0 bg-white/5 rounded-2xl -z-10"
                    transition={{
                      type: 'spring',
                      bounce: 0.2,
                      duration: 0.6,
                    }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        <div className="h-8 w-px bg-white/10 mx-1 hidden sm:block" />

        {/* Wallet Connect */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Desktop */}
          <div className="hidden sm:block">
            <ConnectButton
              client={client}
              chains={supportedChains}
              appMetadata={{
                name: 'ChainVerse NFT',
                url: 'https://chainverse.com',
              }}
              theme="dark"
              connectButton={{
                style: {
                  background: 'linear-gradient(to right, #ec4899, #8b5cf6)',
                  color: 'white',
                  borderRadius: '9999px',
                  height: '48px',
                  padding: '0 24px',
                  fontWeight: '600',
                  fontSize: '14px',
                  border: 'none',
                  minWidth: '140px',
                },
              }}
            />
          </div>

          {/* Mobile (Smaller when not connected) */}
          <div className="sm:hidden">
            <ConnectButton
              client={client}
              chains={supportedChains}
              theme="dark"
              connectButton={{
                label: 'Connect',
                style: {
                  background: 'linear-gradient(to right, #ec4899, #8b5cf6)',
                  color: 'white',
                  borderRadius: '9999px',
                  height: '36px',
                  padding: '0 12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  border: 'none',
                  minWidth: 'auto',
                },
              }}
            />
          </div>
        </div>
      </motion.nav>
    </div>
  );
}
