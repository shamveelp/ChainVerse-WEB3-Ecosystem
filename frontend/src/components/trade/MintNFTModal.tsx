'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Upload, Loader2, Image as ImageIcon, Sparkles } from 'lucide-react';
import { uploadFileToIPFS as uploadToIPFS, uploadJSONToIPFS as uploadMetadataToIPFS, NFTMetadata } from '@/lib/nft/ipfs';
import { useMarketplace } from '@/hooks/useMarketplace';
import { toast } from 'sonner';
import Image from 'next/image';

interface MintNFTModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MintNFTModal({ open, onOpenChange }: MintNFTModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [attributes, setAttributes] = useState<Array<{ trait_type: string; value: string }>>([]);
  const [uploading, setUploading] = useState(false);
  const [listAfterMint, setListAfterMint] = useState(false);

  const { mintAndListNFT, loading, listingPrice } = useMarketplace();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const addAttribute = () => {
    setAttributes([...attributes, { trait_type: '', value: '' }]);
  };

  const updateAttribute = (index: number, key: 'trait_type' | 'value', value: string) => {
    const updated = [...attributes];
    updated[index][key] = value;
    setAttributes(updated);
  };

  const removeAttribute = (index: number) => {
    setAttributes(attributes.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', price: '' });
    setSelectedFile(null);
    setPreviewUrl('');
    setAttributes([]);
    setListAfterMint(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      toast.error('Please select an image file');
      return;
    }

    if (!formData.name || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (listAfterMint && (!formData.price || parseFloat(formData.price) <= 0)) {
      toast.error('Please enter a valid price to list your NFT');
      return;
    }

    try {
      setUploading(true);

      toast.info('Uploading image to IPFS...', { duration: 3000 });

      // Upload image to IPFS
      const imageUrl = await uploadToIPFS(selectedFile);

      toast.info('Creating metadata...', { duration: 2000 });

      // Create metadata
      const metadata: any = {
        name: formData.name,
        description: formData.description,
        image: imageUrl,
        attributes: attributes.filter(attr => attr.trait_type && attr.value),
        created_at: new Date().toISOString(),
        creator: 'ChainVerse NFT Marketplace',
      };

      // Upload metadata to IPFS
      const metadataUrl = await uploadMetadataToIPFS(metadata);

      toast.info('Processing transaction...', { duration: 3000 });

      // Mint NFT (and list if requested)
      await mintAndListNFT(
        metadataUrl,
        listAfterMint ? formData.price : undefined
      );

      onOpenChange(false);
      resetForm();

    } catch (error: any) {
      console.error('Error minting NFT:', error);
      // Don't show another toast here as mintAndListNFT already handles it
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetForm();
    }}>
      <DialogContent className="bg-gray-900/95 border border-white/20 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-400" />
            Create New NFT
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload */}
          <div className="space-y-3">
            <Label htmlFor="file" className="text-gray-200 font-medium">Artwork *</Label>
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 hover:border-purple-400/50 transition-all duration-200">
              {previewUrl ? (
                <div className="relative group">
                  <Image
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewUrl('');
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <label htmlFor="file" className="cursor-pointer flex flex-col items-center space-y-4 group">
                  <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center group-hover:bg-purple-600/30 transition-colors">
                    <ImageIcon className="w-8 h-8 text-purple-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-white font-medium mb-1">Click to upload artwork</p>
                    <p className="text-gray-400 text-sm">PNG, JPG, GIF up to 10MB</p>
                  </div>
                  <input
                    id="file"
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-200 font-medium">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter NFT name"
                className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-400"
                maxLength={50}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price" className="text-gray-200 font-medium">
                Price (ETH) {listAfterMint && '*'}
              </Label>
              <Input
                id="price"
                type="number"
                step="0.001"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0.1"
                className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-400"
                disabled={!listAfterMint}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-gray-200 font-medium">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your NFT..."
              className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 min-h-[100px] focus:border-purple-400 resize-none"
              maxLength={500}
            />
            <p className="text-xs text-gray-400">{formData.description.length}/500 characters</p>
          </div>

          {/* List After Mint Option */}
          <div className="flex items-center justify-between p-4 bg-purple-600/10 rounded-lg border border-purple-400/20">
            <div className="space-y-1">
              <Label className="text-white font-medium">List for sale immediately</Label>
              <p className="text-sm text-gray-300">
                List your NFT on the marketplace right after minting (requires {listingPrice} ETH listing fee)
              </p>
            </div>
            <Switch
              checked={listAfterMint}
              onCheckedChange={setListAfterMint}
              className="data-[state=checked]:bg-purple-600"
            />
          </div>

          {/* Attributes */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-gray-200 font-medium">Properties</Label>
                <p className="text-xs text-gray-400 mt-1">Add traits that describe your NFT</p>
              </div>
              <Button
                type="button"
                onClick={addAttribute}
                variant="outline"
                size="sm"
                className="border-purple-400/30 text-purple-400 hover:bg-purple-400/10"
              >
                Add Property
              </Button>
            </div>

            {attributes.map((attr, index) => (
              <div key={index} className="grid grid-cols-3 gap-3 p-3 bg-gray-800/30 rounded-lg">
                <Input
                  placeholder="Property name"
                  value={attr.trait_type}
                  onChange={(e) => updateAttribute(index, 'trait_type', e.target.value)}
                  className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400"
                  maxLength={30}
                />
                <Input
                  placeholder="Value"
                  value={attr.value}
                  onChange={(e) => updateAttribute(index, 'value', e.target.value)}
                  className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400"
                  maxLength={30}
                />
                <Button
                  type="button"
                  onClick={() => removeAttribute(index)}
                  variant="destructive"
                  size="sm"
                  className="bg-red-600/20 text-red-400 hover:bg-red-600/30 border-red-400/30"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              type="submit"
              disabled={uploading || loading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-4 text-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {uploading || loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {uploading ? 'Uploading to IPFS...' : 'Processing Transaction...'}
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 mr-2" />
                  {listAfterMint ? 'Mint & List NFT' : 'Mint NFT'}
                </>
              )}
            </Button>

            {listAfterMint && (
              <p className="text-xs text-gray-400 text-center mt-2">
                Total cost: {formData.price || '0'} ETH + {listingPrice} ETH listing fee
              </p>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}