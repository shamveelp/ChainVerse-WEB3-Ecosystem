"use client"

import { useState } from "react"
import { X, Download, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { VisuallyHidden } from "@/components/ui/visually-hidden"

interface MediaViewerProps {
  media: {
    type: 'image' | 'video'
    url: string
    filename: string
  }
  onClose: () => void
}

export function MediaViewer({ media, onClose }: MediaViewerProps) {
  const [loading, setLoading] = useState(true)

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = media.url
    link.download = media.filename
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleOpenInNewTab = () => {
    window.open(media.url, '_blank')
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full h-[80vh] flex flex-col p-0">
        <VisuallyHidden>
          <DialogTitle>Media Viewer</DialogTitle>
        </VisuallyHidden>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground truncate">{media.filename}</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownload}
              className="text-muted-foreground hover:text-foreground"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleOpenInNewTab}
              className="text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center p-4 bg-black/5">
          {media.type === 'image' ? (
            <img
              src={media.url}
              alt={media.filename}
              className="max-w-full max-h-full object-contain"
              onLoad={() => setLoading(false)}
              onError={() => setLoading(false)}
            />
          ) : (
            <video
              src={media.url}
              className="max-w-full max-h-full"
              controls
              autoPlay
              onLoadedData={() => setLoading(false)}
              onError={() => setLoading(false)}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
