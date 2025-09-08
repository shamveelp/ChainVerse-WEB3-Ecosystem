'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Loader2, Image as ImageIcon } from 'lucide-react';
import { uploadToIPFS, uploadMetadataToIPFS, NFTMetadata } from '@/lib/ipfs';
import { useMarketplace } from '@/hooks/useMarketplace';
import { toast } from 'sonner';

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

  const { mintAndListNFT, loading } = useMarketplace();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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

    try {
      setUploading(true);
      
      // Upload image to IPFS
      const imageUrl = await uploadToIPFS(selectedFile);
      
      // Create metadata
      const metadata: NFTMetadata = {
        name: formData.name,
        description: formData.description,
        image: imageUrl,
        attributes: attributes.filter(attr => attr.trait_type && attr.value),
      };
      
      // Upload metadata to IPFS
      const metadataUrl = await uploadMetadataToIPFS(metadata);
      
      // Mint NFT
      await mintAndListNFT(metadataUrl, formData.price);
      
      toast.success('NFT minted successfully!');
      onOpenChange(false);
      
      // Reset form
      setFormData({ name: '', description: '', price: '' });
      setSelectedFile(null);
      setPreviewUrl('');
      setAttributes([]);
      
    } catch (error) {
      console.error('Error minting NFT:', error);
      toast.error('Failed to mint NFT. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900/95 border border-white/20 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Mint New NFT
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload */}
          <div className="space-y-3">
            <Label htmlFor="file" className="text-gray-200">Image File *</Label>
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 hover:border-purple-400/50 transition-colors">
              {previewUrl ? (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl('');
                    }}
                    className="absolute top-2 right-2"
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <label htmlFor="file" className="cursor-pointer flex flex-col items-center space-y-3">
                  <ImageIcon className="w-12 h-12 text-gray-400" />
                  <div className="text-center">
                    <p className="text-white font-medium">Click to upload an image</p>
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
              <Label htmlFor="name" className="text-gray-200">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter NFT name"
                className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="price" className="text-gray-200">Price (ETH)</Label>
              <Input
                id="price"
                type="number"
                step="0.001"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0.1"
                className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description" className="text-gray-200">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter NFT description"
              className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 min-h-[100px]"
            />
          </div>

          {/* Attributes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-gray-200">Attributes</Label>
              <Button
                type="button"
                onClick={addAttribute}
                variant="outline"
                size="sm"
                className="border-purple-400/30 text-purple-400"
              >
                Add Attribute
              </Button>
            </div>
            
            {attributes.map((attr, index) => (
              <div key={index} className="grid grid-cols-3 gap-2">
                <Input
                  placeholder="Trait type"
                  value={attr.trait_type}
                  onChange={(e) => updateAttribute(index, 'trait_type', e.target.value)}
                  className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400"
                />
                <Input
                  placeholder="Value"
                  value={attr.value}
                  onChange={(e) => updateAttribute(index, 'value', e.target.value)}
                  className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400"
                />
                <Button
                  type="button"
                  onClick={() => removeAttribute(index)}
                  variant="destructive"
                  size="sm"
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
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-3 transition-all duration-200"
            >
              {uploading || loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {uploading ? 'Uploading...' : 'Minting...'}
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Mint NFT
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}