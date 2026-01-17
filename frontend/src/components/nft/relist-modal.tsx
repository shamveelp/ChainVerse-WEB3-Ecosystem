'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { NFTWithMetadata } from '../../types/types-nft';
import Image from 'next/image';

interface RelistModalProps {
  isOpen: boolean;
  onClose: () => void;
  nft: NFTWithMetadata | null;
  onRelist: (price: string) => Promise<void>;
  isLoading: boolean;
  listingFee: string;
}

export function RelistModal({ 
  isOpen, 
  onClose, 
  nft, 
  onRelist, 
  isLoading,
  listingFee 
}: RelistModalProps) {
  const [price, setPrice] = useState('');
  const [priceError, setPriceError] = useState('');

  const validatePrice = (value: string): boolean => {
    if (!value) {
      setPriceError('Price is required');
      return false;
    }

    const numPrice = parseFloat(value);
    if (isNaN(numPrice) || numPrice <= 0) {
      setPriceError('Price must be a positive number');
      return false;
    }

    if (numPrice < 0.000001) {
      setPriceError('Price must be at least 0.000001 ETH');
      return false;
    }

    setPriceError('');
    return true;
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPrice(value);
    if (value) {
      validatePrice(value);
    } else {
      setPriceError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePrice(price)) return;

    try {
      await onRelist(price);
      setPrice('');
      onClose();
    } catch (error) {
      // Error is handled by the parent component
    }
  };

  const handleClose = () => {
    setPrice('');
    setPriceError('');
    onClose();
  };

  const estimatedEarnings = price ? (parseFloat(price) * 0.965).toFixed(6) : '0';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Relist NFT</DialogTitle>
          <DialogDescription>
            Set a new price for your NFT and list it for sale
          </DialogDescription>
        </DialogHeader>

        {nft && (
          <div className="space-y-6">
            {/* NFT Info */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              {nft.imageUrl && (
                <Image
                  src={nft.imageUrl}
                  alt={nft.metadata?.name || `NFT #${nft.tokenId}`}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              )}
              <div>
                <p className="font-medium">
                  {nft.metadata?.name || `NFT #${nft.tokenId}`}
                </p>
                <p className="text-sm text-muted-foreground">
                  Token ID: #{nft.tokenId.toString()}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Price Input */}
              <div className="space-y-2">
                <Label htmlFor="price">Sale Price (ETH) *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="price"
                    type="number"
                    step="0.000001"
                    min="0.000001"
                    placeholder="0.01"
                    value={price}
                    onChange={handlePriceChange}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
                {priceError && (
                  <p className="text-sm text-destructive">{priceError}</p>
                )}
              </div>

              {/* Fee Breakdown */}
              {price && parseFloat(price) > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-3 p-3 rounded-lg bg-muted/30"
                >
                  <h4 className="text-sm font-medium">Fee Breakdown</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Sale Price:</span>
                      <span>{price} ETH</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Platform Fee (2.5%):</span>
                      <span>-{(parseFloat(price) * 0.025).toFixed(6)} ETH</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Creator Royalty (1%):</span>
                      <span>-{(parseFloat(price) * 0.01).toFixed(6)} ETH</span>
                    </div>
                    <div className="flex justify-between font-medium border-t pt-2">
                      <span>You'll receive:</span>
                      <span>{estimatedEarnings} ETH</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Listing Fee Alert */}
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  A listing fee of {listingFee} ETH will be charged to relist your NFT.
                </AlertDescription>
              </Alert>
            </form>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isLoading || !price || !!priceError}
            className="bg-gradient-to-r from-primary to-purple-600"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Relisting...
              </>
            ) : (
              'Relist NFT'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}