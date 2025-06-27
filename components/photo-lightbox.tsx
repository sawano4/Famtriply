"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { X, ChevronLeft, ChevronRight, Trash2, Download } from "lucide-react"
import { photoService } from "@/lib/api"
import type { Photo } from "@/lib/types"

interface PhotoLightboxProps {
  photo: Photo
  photos: Photo[]
  onClose: () => void
  onDelete: (photoId: string) => void
}

export function PhotoLightbox({ photo, photos, onClose, onDelete }: PhotoLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const index = photos.findIndex((p) => p.id === photo.id)
    setCurrentIndex(index)
  }, [photo, photos])

  const currentPhoto = photos[currentIndex]

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0))
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowLeft") goToPrevious()
    if (e.key === "ArrowRight") goToNext()
    if (e.key === "Escape") onClose()
  }

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = photoService.getPhotoUrl(currentPhoto.file_path)
    link.download = currentPhoto.file_name
    link.click()
  }

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this photo?")) {
      onDelete(currentPhoto.id)
      if (photos.length === 1) {
        onClose()
      } else {
        // Move to next photo or previous if at end
        if (currentIndex === photos.length - 1) {
          setCurrentIndex(currentIndex - 1)
        }
      }
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black border-0">
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Close Button */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </Button>

          {/* Navigation Buttons */}
          {photos.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 text-white hover:bg-white/20"
                onClick={goToPrevious}
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 text-white hover:bg-white/20"
                onClick={goToNext}
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            </>
          )}

          {/* Action Buttons */}
          <div className="absolute top-4 left-4 z-10 flex space-x-2">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20" onClick={handleDownload}>
              <Download className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 hover:text-red-400"
              onClick={handleDelete}
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          </div>

          {/* Photo Counter */}
          {photos.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
              {currentIndex + 1} of {photos.length}
            </div>
          )}

          {/* Main Image */}
          <img
            src={photoService.getPhotoUrl(currentPhoto.file_path) || "/placeholder.svg"}
            alt={currentPhoto.caption || currentPhoto.file_name}
            className="max-w-full max-h-full object-contain"
          />

          {/* Caption */}
          {currentPhoto.caption && (
            <div className="absolute bottom-4 left-4 right-4 z-10 bg-black/50 text-white p-3 rounded-lg">
              <p className="text-center">{currentPhoto.caption}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
