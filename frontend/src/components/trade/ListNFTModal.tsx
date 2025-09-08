'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Tag } from 'lucide-react';

interface ListNFTModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tokenId: bigint | null;
  onList: (tokenId: bigint, price: string) => void;
  loading: boolean;
}

export function ListNFTModal({ 
  open, 
  onOpenChange, 
  tokenId, 
  onList, 
  loading 
}: ListNFTModalProps) {
  const [price, setPrice] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tokenId && price) {
      onList(tokenId, price);
      setPrice('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900/95 border border-white/20 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            List NFT for Sale
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="listPrice" className="text-gray-200">
              Price (ETH) *
            </Label>
            <Input
              id="listPrice"
              type="number"
              step="0.001"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.1"
              className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400"
              required
            />
            <p className="text-xs text-gray-400">
              A listing fee of 0.01 ETH will be charged
            </p>
          </div>
          
          <Button
            type="submit"
            disabled={loading || !price}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-3"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Listing...
              </>
            ) : (
              <>
                <Tag className="w-4 h-4 mr-2" />
                List NFT
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}