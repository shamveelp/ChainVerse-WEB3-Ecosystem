"use client"

import { useState, useRef, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { RotateCw, ZoomIn, ZoomOut, Download, X } from 'lucide-react'
import Cropper from 'react-easy-crop'
import { getCroppedImg } from '@/utils/crop-utils'

interface ImageCropperProps {
  open: boolean
  onClose: () => void
  imageSrc: string
  aspectRatio: number
  onCropComplete: (croppedImage: File) => void
  cropShape?: 'rect' | 'round'
  fileName: string
}

export function ImageCropper({
  open,
  onClose,
  imageSrc,
  aspectRatio,
  onCropComplete,
  cropShape = 'rect',
  fileName
}: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [rotation, setRotation] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [loading, setLoading] = useState(false)

  const onCropCompleteHandler = useCallback((croppedArea: unknown, croppedAreaPixels: { x: number; y: number; width: number; height: number }) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleCrop = async () => {
    try {
      setLoading(true)
      const croppedImage = await getCroppedImg(
        imageSrc,
        croppedAreaPixels!,
        rotation,
        fileName
      )
      onCropComplete(croppedImage)
      onClose()
    } catch (e: unknown) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-black border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Download className="h-5 w-5" />
            Crop Image
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Crop Area */}
          <div className="relative h-96 bg-gray-900 rounded-lg overflow-hidden">
            <Cropper
              image={imageSrc}
              crop={crop}
              rotation={rotation}
              zoom={zoom}
              aspect={aspectRatio}
              onCropChange={setCrop}
              onRotationChange={setRotation}
              onCropComplete={onCropCompleteHandler}
              onZoomChange={setZoom}
              cropShape={cropShape}
              style={{
                containerStyle: {
                  background: '#111827',
                },
                cropAreaStyle: {
                  border: '2px solid #3B82F6',
                  boxShadow: '0 0 0 9999em rgba(0, 0, 0, 0.5)',
                },
              }}
            />
          </div>

          {/* Controls */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Zoom Control */}
              <div className="space-y-2">
                <Label className="text-white flex items-center gap-2">
                  <ZoomIn className="h-4 w-4" />
                  Zoom: {Math.round(zoom * 100)}%
                </Label>
                <Slider
                  value={[zoom]}
                  onValueChange={(value: number[]) => setZoom(value[0])}
                  min={1}
                  max={3}
                  step={0.1}
                  className="w-full"
                />
              </div>

              {/* Rotation Control */}
              <div className="space-y-2">
                <Label className="text-white flex items-center gap-2">
                  <RotateCw className="h-4 w-4" />
                  Rotation: {rotation}°
                </Label>
                <Slider
                  value={[rotation]}
                  onValueChange={(value: number[]) => setRotation(value[0])}
                  min={0}
                  max={360}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(1)}
                className="border-gray-700 text-gray-300 hover:text-white hover:border-gray-600"
              >
                Reset Zoom
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRotation(0)}
                className="border-gray-700 text-gray-300 hover:text-white hover:border-gray-600"
              >
                Reset Rotation
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRotation(rotation + 90)}
                className="border-gray-700 text-gray-300 hover:text-white hover:border-gray-600"
              >
                Rotate 90°
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-gray-700 text-gray-300 hover:text-white hover:border-gray-600"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleCrop}
            disabled={loading || !croppedAreaPixels}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Processing...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Crop Image
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}