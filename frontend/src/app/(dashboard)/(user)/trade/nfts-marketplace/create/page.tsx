'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNFTContract } from '@/hooks/nft/useNFTContract';
import { uploadFileToIPFS, uploadJSONToIPFS } from '@/lib/nft/ipfs';
import { useActiveAccount } from 'thirdweb/react';
import { toast } from 'sonner';
import Image from 'next/image';

interface FormData {
  name: string;
  description: string;
  price: string;
  file: File | null;
}

const initialFormData: FormData = {
  name: '',
  description: '',
  price: '',
  file: null,
};

export default function CreatePage() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [preview, setPreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const account = useActiveAccount();
  const { createToken, isLoading, txHash, getListPrice } = useNFTContract();
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setFormData(prev => ({ ...prev, file }));

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = (): string | null => {
    if (!formData.name.trim()) return 'Name is required';
    if (!formData.file) return 'Image is required';
    if (!formData.price || parseFloat(formData.price) <= 0) return 'Valid price is required';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!account) {
      toast.error('Please connect your wallet first');
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(20);

      // Upload image to IPFS
      toast.info('Uploading image to IPFS...');
      const imageUrl = await uploadFileToIPFS(formData.file!);
      setUploadProgress(40);

      // Create metadata
      const metadata = {
        name: formData.name,
        description: formData.description,
        image: imageUrl,
      };

      // Upload metadata to IPFS
      toast.info('Uploading metadata to IPFS...');
      const metadataUrl = await uploadJSONToIPFS(metadata);
      setUploadProgress(60);

      // Create NFT on blockchain
      toast.info('Creating NFT on blockchain...');
      await createToken(metadataUrl, formData.price);
      setUploadProgress(100);

      toast.success('NFT created successfully!');
      router.push('/trade/nfts-marketplace/explore');

    } catch (error: unknown) {
      console.error('Error creating NFT:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create NFT. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl font-bold mb-4">Create New NFT</h1>
          <p className="text-muted-foreground">
            Turn your digital artwork into a unique NFT
          </p>
        </motion.div>

        {!account && (
          <Alert className="mb-8">
            <AlertDescription>
              Please connect your wallet to create an NFT.
            </AlertDescription>
          </Alert>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Card className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* File Upload */}
              <div className="space-y-4">
                <Label htmlFor="file">Artwork *</Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors">
                  {preview ? (
                    <div className="space-y-4">
                      <img
                        src={preview}
                        alt="Preview"
                        className="mx-auto max-h-64 rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setPreview('');
                          setFormData(prev => ({ ...prev, file: null }));
                        }}
                      >
                        Change Image
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground mb-2">
                          Drop your image here, or{' '}
                          <label htmlFor="file" className="text-primary cursor-pointer hover:underline">
                            browse
                          </label>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Supports: JPG, PNG, GIF (Max: 10MB)
                        </p>
                      </div>
                    </div>
                  )}
                  <input
                    id="file"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isUploading || isLoading}
                  />
                </div>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter NFT name"
                  disabled={isUploading || isLoading}
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your NFT"
                  rows={4}
                  disabled={isUploading || isLoading}
                />
              </div>

              {/* Price */}
              <div className="space-y-2">
                <Label htmlFor="price">Price (ETH) *</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.000001"
                  min="0"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="0.01"
                  disabled={isUploading || isLoading}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Listing fee: 0.0001 ETH (approx. will be deducted automatically)
                </p>
              </div>

              {/* Progress Bar */}
              {(isUploading || isLoading) && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>
                      {isUploading ? 'Uploading files...' : 'Creating NFT...'}
                    </span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={!account || isUploading || isLoading}
              >
                {isUploading || isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isUploading ? 'Uploading...' : 'Creating NFT...'}
                  </>
                ) : (
                  'Create NFT'
                )}
              </Button>

              {txHash && (
                <Alert>
                  <AlertDescription>
                    Transaction submitted! Hash: {txHash.slice(0, 10)}...
                  </AlertDescription>
                </Alert>
              )}
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}