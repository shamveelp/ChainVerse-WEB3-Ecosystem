'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Home, Compass, PlusSquare, User, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConnectButton } from 'thirdweb/react';
import { client } from '@/lib/thirdweb-client';
import { USER_ROUTES } from '@/routes';

const navigation = [
  { name: 'Home', href: { pathname: USER_ROUTES.NFT_MARKET }, icon: Home },
  { name: 'Explore', href: { pathname: USER_ROUTES.NFT_EXPLORE }, icon: Compass },
  { name: 'Create', href: { pathname: USER_ROUTES.NFT_CREATE }, icon: PlusSquare },
  { name: 'Profile', href: { pathname: USER_ROUTES.NFT_PROFILE }, icon: User },
];

export function Header() {
  const pathname = usePathname();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <>
      {/* Main Floating Navbar */}
      <div className="fixed bottom-6 inset-x-0 z-50 flex justify-center pointer-events-none px-4">
        <motion.nav
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="pointer-events-auto bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl shadow-purple-900/20 p-2 flex items-center gap-2 max-w-[95vw] md:max-w-fit overflow-hidden"
        >
          {/* Logo (Desktop only) */}
          <Link href={USER_ROUTES.NFT_MARKET} className="hidden md:flex items-center justify-center w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 transition-colors ml-1">
            <span className="text-xl font-bold bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent">N</span>
          </Link>

          <div className="h-8 w-px bg-white/10 hidden md:block mx-1" />

          {/* Navigation Links */}
          <div className="flex items-center bg-white/5 rounded-3xl p-1 shrink-0">
            {navigation.map((item) => {
              const isActive = pathname === item.href.pathname;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`relative flex items-center justify-center px-3 sm:px-4 md:px-6 py-3 rounded-2xl text-sm font-medium transition-all duration-300 ${isActive
                      ? 'text-white bg-white/10 shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                  <item.icon className={`w-5 h-5 md:mr-2 ${isActive ? 'text-pink-400' : ''}`} />
                  <span className={`${isActive ? 'block' : 'hidden'} md:block lg:block whitespace-nowrap`}>{item.name}</span>
                  {isActive && (
                    <motion.div
                      layoutId="bubble"
                      className="absolute inset-0 bg-white/5 rounded-2xl -z-10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          <div className="h-8 w-px bg-white/10 mx-1 hidden sm:block" />

          {/* User Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Search Toggle */}
            <div className="relative">
              <AnimatePresence>
                {isSearchOpen && (
                  <motion.div
                    initial={{ width: 0, opacity: 0, scale: 0.8 }}
                    animate={{ width: 200, opacity: 1, scale: 1 }}
                    exit={{ width: 0, opacity: 0, scale: 0.8 }}
                    className="absolute bottom-14 left-1/2 -translate-x-1/2 md:bottom-auto md:left-auto md:relative md:translate-x-0 origin-bottom md:origin-right mb-2 md:mb-0"
                  >
                    <Input
                      placeholder="Search NFTs..."
                      className="bg-black/80 backdrop-blur-xl border-white/20 rounded-xl h-10 w-full md:w-48 text-white placeholder:text-gray-500 focus:ring-pink-500/50"
                      autoFocus
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="w-12 h-12 rounded-full text-gray-400 hover:text-white hover:bg-white/10"
              >
                {isSearchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
              </Button>
            </div>

            {/* Thirdweb Connect Button */}
            <div className="hidden sm:block">
              <ConnectButton
                client={client}
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
                    minWidth: '140px'
                  }
                }}
                connectModal={{
                  size: 'compact',
                  title: "Unlock the Metaverse",
                  welcomeScreen: {
                    title: "Join ChainVerse NFT",
                    subtitle: "Your gateway to digital collectibles"
                  }
                }}
              />
            </div>

            {/* Mobile Connect Icon */}
            <div className="sm:hidden">
              <ConnectButton
                client={client}
                theme="dark"
                connectButton={{
                  label: "Conn.",
                  style: {
                    background: 'linear-gradient(to right, #ec4899, #8b5cf6)',
                    color: 'white',
                    borderRadius: '9999px',
                    height: '48px',
                    minWidth: 'auto',
                    padding: '0 16px',
                    fontSize: '13px',
                    fontWeight: '600',
                    border: 'none',
                  }
                }}
              />
            </div>
          </div>
        </motion.nav>
      </div>
    </>
  );
}