'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';

export function NFTCardSkeleton() {
  return (
    <Card className="overflow-hidden bg-gradient-to-br from-background/95 via-background/90 to-background/80 backdrop-blur-lg border-border/50">
      <div className="animate-pulse">
        {/* Image skeleton */}
        <div className="aspect-square bg-gradient-to-br from-muted/50 to-muted/30" />

        {/* Content skeleton */}
        <div className="p-4 space-y-3">
          <div className="space-y-2">
            <div className="h-5 bg-muted/60 rounded-md w-3/4" />
            <div className="h-3 bg-muted/40 rounded-md w-full" />
            <div className="h-3 bg-muted/40 rounded-md w-2/3" />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="space-y-1">
              <div className="h-3 bg-muted/40 rounded-md w-8" />
              <div className="h-6 bg-muted/60 rounded-md w-16" />
            </div>
            <div className="h-8 bg-muted/50 rounded-md w-20" />
          </div>

          <div className="space-y-1">
            <div className="h-3 bg-muted/30 rounded-md w-20" />
            <div className="h-3 bg-muted/30 rounded-md w-32" />
          </div>
        </div>
      </div>
    </Card>
  );
}

interface LoadingGridProps {
  count?: number;
}

export function LoadingGrid({ count = 8 }: LoadingGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }, (_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, duration: 0.5 }}
        >
          <NFTCardSkeleton />
        </motion.div>
      ))}
    </div>
  );
}

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
      />
    </div>
  );
}