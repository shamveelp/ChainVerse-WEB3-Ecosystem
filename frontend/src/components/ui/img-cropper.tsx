"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from './button';
import { Slider } from './slider';
import { 
  Crop, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Move, 
  Check, 
  X,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (croppedImageBlob: Blob) => void;
  onCancel: () => void;
  aspectRatio?: number;
  cropType: 'profile' | 'banner';
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function ImageCropper({
  imageSrc,
  onCropComplete,
  onCancel,
  aspectRatio = 1,
  cropType
}: ImageCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 200, height: 200 });
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [processing, setProcessing] = useState(false);

  const maxCropSize = cropType === 'profile' ? 400 : 800;
  const minCropSize = cropType === 'profile' ? 100 : 200;

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImage(img);
      setIsImageLoaded(true);
      
      // Initialize crop area based on image dimensions and aspect ratio
      const containerWidth = 400;
      const containerHeight = 300;
      
      let initialWidth, initialHeight;
      
      if (aspectRatio === 1) {
        // Square crop for profile
        const size = Math.min(containerWidth, containerHeight) * 0.8;
        initialWidth = initialHeight = size;
      } else {
        // Rectangle crop for banner
        initialHeight = containerHeight * 0.6;
        initialWidth = initialHeight * aspectRatio;
        
        if (initialWidth > containerWidth * 0.9) {
          initialWidth = containerWidth * 0.9;
          initialHeight = initialWidth / aspectRatio;
        }
      }
      
      setCropArea({
        x: (containerWidth - initialWidth) / 2,
        y: (containerHeight - initialHeight) / 2,
        width: initialWidth,
        height: initialHeight
      });
    };
    
    img.src = imageSrc;
    
    return () => {
      img.onload = null;
    };
  }, [imageSrc, aspectRatio]);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    
    if (!canvas || !ctx || !image || !isImageLoaded) return;

    canvas.width = 400;
    canvas.height = 300;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Fill background with dark overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Save context for transformations
    ctx.save();
    
    // Apply transformations
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    ctx.translate(centerX + imagePosition.x, centerY + imagePosition.y);
    ctx.scale(scale, scale);
    ctx.rotate((rotation * Math.PI) / 180);
    
    // Draw image centered
    const imgWidth = image.naturalWidth;
    const imgHeight = image.naturalHeight;
    const scaleFactor = Math.min(canvas.width / imgWidth, canvas.height / imgHeight);
    const drawWidth = imgWidth * scaleFactor;
    const drawHeight = imgHeight * scaleFactor;
    
    ctx.drawImage(
      image,
      -drawWidth / 2,
      -drawHeight / 2,
      drawWidth,
      drawHeight
    );
    
    ctx.restore();
    
    // Clear crop area (make it visible)
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);
    
    // Draw crop area border
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);
    
    // Draw corner handles
    const handleSize = 8;
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(cropArea.x - handleSize/2, cropArea.y - handleSize/2, handleSize, handleSize);
    ctx.fillRect(cropArea.x + cropArea.width - handleSize/2, cropArea.y - handleSize/2, handleSize, handleSize);
    ctx.fillRect(cropArea.x - handleSize/2, cropArea.y + cropArea.height - handleSize/2, handleSize, handleSize);
    ctx.fillRect(cropArea.x + cropArea.width - handleSize/2, cropArea.y + cropArea.height - handleSize/2, handleSize, handleSize);
    
    ctx.setLineDash([]);
  }, [image, isImageLoaded, cropArea, scale, rotation, imagePosition]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDragging(true);
    setDragStart({ x, y });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const deltaX = x - dragStart.x;
    const deltaY = y - dragStart.y;
    
    setCropArea(prev => ({
      ...prev,
      x: Math.max(0, Math.min(canvas.width - prev.width, prev.x + deltaX)),
      y: Math.max(0, Math.min(canvas.height - prev.height, prev.y + deltaY))
    }));
    
    setDragStart({ x, y });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleScaleChange = useCallback((value: number[]) => {
    setScale(value[0]);
  }, []);

  const handleRotationChange = useCallback(() => {
    setRotation(prev => (prev + 90) % 360);
  }, []);

  const resetTransforms = useCallback(() => {
    setScale(1);
    setRotation(0);
    setImagePosition({ x: 0, y: 0 });
  }, []);

  const handleCrop = useCallback(async () => {
    if (!image || processing) return;
    
    setProcessing(true);
    
    try {
      // Create a new canvas for the cropped image
      const cropCanvas = document.createElement('canvas');
      const cropCtx = cropCanvas.getContext('2d');
      
      if (!cropCtx) {
        throw new Error('Could not get canvas context');
      }
      
      // Set crop canvas size
      const outputSize = cropType === 'profile' ? 400 : 800;
      const outputHeight = cropType === 'profile' ? 400 : Math.round(outputSize / aspectRatio);
      
      cropCanvas.width = outputSize;
      cropCanvas.height = outputHeight;
      
      // Calculate the source coordinates on the original canvas
      const canvas = canvasRef.current;
      if (!canvas) throw new Error('Canvas not found');
      
      const scaleX = image.naturalWidth / (canvas.width / scale);
      const scaleY = image.naturalHeight / (canvas.height / scale);
      
      // Calculate source rectangle
      const sourceX = (cropArea.x - canvas.width/2 - imagePosition.x) * scaleX / scale;
      const sourceY = (cropArea.y - canvas.height/2 - imagePosition.y) * scaleY / scale;
      const sourceWidth = cropArea.width * scaleX / scale;
      const sourceHeight = cropArea.height * scaleY / scale;
      
      // Apply rotation if needed
      if (rotation !== 0) {
        cropCtx.translate(cropCanvas.width / 2, cropCanvas.height / 2);
        cropCtx.rotate((rotation * Math.PI) / 180);
        cropCtx.translate(-cropCanvas.width / 2, -cropCanvas.height / 2);
      }
      
      // Draw the cropped portion
      cropCtx.drawImage(
        image,
        sourceX + image.naturalWidth / 2,
        sourceY + image.naturalHeight / 2,
        sourceWidth,
        sourceHeight,
        0,
        0,
        cropCanvas.width,
        cropCanvas.height
      );
      
      // Convert to blob
      cropCanvas.toBlob((blob) => {
        if (blob) {
          onCropComplete(blob);
        } else {
          throw new Error('Failed to create blob');
        }
        setProcessing(false);
      }, 'image/jpeg', 0.9);
      
    } catch (error) {
      console.error('Error cropping image:', error);
      setProcessing(false);
    }
  }, [image, cropArea, scale, rotation, imagePosition, aspectRatio, cropType, onCropComplete, processing]);

  if (!isImageLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
          <p className="text-gray-400">Loading image...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Canvas */}
      <div
        ref={containerRef}
        className="relative bg-gray-900 rounded-lg overflow-hidden border border-gray-700"
      >
        <canvas
          ref={canvasRef}
          width={400}
          height={300}
          className="cursor-move"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>

      {/* Controls */}
      <div className="space-y-4">
        {/* Zoom Control */}
        <div className="flex items-center gap-3">
          <ZoomOut className="h-4 w-4 text-gray-400" />
          <Slider
            value={[scale]}
            onValueChange={handleScaleChange}
            min={0.1}
            max={3}
            step={0.1}
            className="flex-1"
          />
          <ZoomIn className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-300 min-w-[3rem]">
            {Math.round(scale * 100)}%
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              onClick={handleRotationChange}
              variant="outline"
              size="sm"
              className="border-gray-600 hover:bg-gray-800"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              onClick={resetTransforms}
              variant="outline"
              size="sm"
              className="border-gray-600 hover:bg-gray-800"
            >
              Reset
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={onCancel}
              variant="outline"
              className="border-gray-600 hover:bg-gray-800"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleCrop}
              disabled={processing}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {processing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              {processing ? 'Processing...' : 'Apply Crop'}
            </Button>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="text-sm text-gray-400 bg-gray-800/50 p-3 rounded-lg">
        <p className="flex items-center gap-2 mb-1">
          <Move className="h-4 w-4" />
          Drag to move the crop area
        </p>
        <p className="flex items-center gap-2">
          <Crop className="h-4 w-4" />
          Use the zoom slider to resize the image
        </p>
      </div>
    </div>
  );
}