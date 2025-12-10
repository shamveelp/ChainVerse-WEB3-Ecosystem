'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, Menu } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ConnectButton } from 'thirdweb/react';
import { client } from '@/lib/thirdweb-client';
import { USER_ROUTES } from '@/routes';

const navigation = [
  { name: 'Home', href: { pathname: USER_ROUTES.NFT_MARKET } },
  { name: 'Explore', href: { pathname: USER_ROUTES.NFT_EXPLORE } },
  { name: 'Create', href: { pathname: USER_ROUTES.NFT_CREATE } },
  { name: 'Profile', href: { pathname: USER_ROUTES.NFT_PROFILE } },
];

export function Header() {
  const pathname = usePathname();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="sticky top-0 z-50 backdrop-blur-lg bg-background/80 border-b border-border/50"
    >
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link href={USER_ROUTES.NFT_MARKET} className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">N</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                NFTVerse
              </span>
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`relative px-3 py-2 text-sm font-medium transition-colors hover:text-primary ${pathname === item.href.pathname ? 'text-primary' : 'text-muted-foreground'
                  }`}
              >
                {item.name}
                {pathname === item.href.pathname && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-primary to-transparent"
                  />
                )}
              </Link>
            ))}
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="hidden md:flex items-center space-x-2">
              {isSearchOpen && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 200, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Input placeholder="Search NFTs..." className="w-full" />
                </motion.div>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="hover:bg-muted/50"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {/* Thirdweb Connect Button */}
            <ConnectButton
              client={client}
              appMetadata={{
                name: 'ChainVerse NFT Marketplace',
                url: 'https://example.com',
                description: 'The most advanced decentralized marketplace for digital collectibles',
                logoUrl: 'https://example.com/logo.png',
              }}
              theme="dark"
              connectModal={{
                size: 'compact',
                showThirdwebBranding: false,
              }}
            />

            {/* Mobile menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <div className="flex flex-col space-y-4 mt-8">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`px-3 py-2 text-sm font-medium transition-colors hover:text-primary ${pathname === item.href.pathname ? 'text-primary' : 'text-muted-foreground'
                        }`}
                    >
                      {item.name}
                    </Link>
                  ))}
                  <div className="pt-4">
                    <Input placeholder="Search NFTs..." />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
    </motion.header>
  );
}