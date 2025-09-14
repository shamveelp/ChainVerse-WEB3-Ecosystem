'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, TrendingUp, Users } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const stats = [
  { label: 'Total Volume', value: '2.5M ETH', icon: TrendingUp },
  { label: 'Active Users', value: '150K+', icon: Users },
  { label: 'NFTs Minted', value: '500K+', icon: Sparkles },
];

const features = [
  {
    title: 'Create & Mint',
    description: 'Turn your digital creations into unique NFTs with our easy-to-use minting platform',
    gradient: 'from-blue-500 to-purple-600',
  },
  {
    title: 'Trade & Collect',
    description: 'Buy, sell, and collect NFTs from artists and creators around the world',
    gradient: 'from-purple-600 to-pink-600',
  },
  {
    title: 'Earn & Grow',
    description: 'Monetize your art and build a sustainable creative career on the blockchain',
    gradient: 'from-pink-600 to-orange-600',
  },
];

export default function NFTMarketplaceHome() {
  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center"
          >
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Discover
              </span>
              <br />
              <span className="text-foreground">
                Extraordinary NFTs
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              The most advanced decentralized marketplace for digital collectibles.
              Create, buy, sell, and trade NFTs with complete ownership and transparency.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90">
                <Link href="/nft-marketplace/explore">
                  Explore NFTs
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>

              <Button asChild variant="outline" size="lg">
                <Link href="/nft-marketplace/create">
                  Create NFT
                </Link>
              </Button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-3"
          >
            {stats.map((stat, index) => (
              <Card key={stat.label} className="p-6 text-center bg-gradient-to-br from-background/80 to-muted/20 backdrop-blur-sm border-border/50">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-primary/20 to-purple-600/20 mb-4">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </Card>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold sm:text-4xl mb-4">
              Why Choose NFTorium?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Experience the future of digital ownership with our cutting-edge platform
              built for creators, collectors, and traders.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                whileHover={{ y: -8 }}
              >
                <Card className="p-8 h-full bg-gradient-to-br from-background/90 to-muted/30 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-all duration-300">
                  <div className={`h-12 w-12 rounded-lg bg-gradient-to-r ${feature.gradient} mb-6 flex items-center justify-center`}>
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>

                  <h3 className="text-xl font-semibold mb-3 text-foreground">
                    {feature.title}
                  </h3>

                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <Card className="p-12 text-center bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 backdrop-blur-sm border-primary/20">
              <h2 className="text-3xl font-bold mb-4">
                Ready to Join the Revolution?
              </h2>

              <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                Start your NFT journey today. Create, collect, and trade digital assets
                with complete ownership and transparency.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-gradient-to-r from-primary to-purple-600">
                  <Link href="/nft-marketplace/create">
                    Create Your First NFT
                  </Link>
                </Button>

                <Button asChild variant="outline" size="lg">
                  <Link href="/nft-marketplace/explore">
                    Browse Collection
                  </Link>
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );
}