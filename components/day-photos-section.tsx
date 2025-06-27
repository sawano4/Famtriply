"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Camera, Eye, Trash2, Plus } from "lucide-react"
import { PhotoLightbox } from "./photo-lightbox"
import { photoService } from "@/lib/api"
import type { Photo } from "@/lib/types"

interface DayPhotosSectionProps {
  photos: Photo[]
  onPhotoDeleted: () => void
  onAddPhotos: () => void
}

const photoTypeLabels = {
  trip_cover: "Cover",
  location: "Location",
  souvenir: "Souvenir",
  general: "General",
}

const photoTypeColors = {
  trip_cover: "bg-purple-100 text-purple-800",
  location: "bg-blue-100 text-blue-800",
  souvenir: "bg-green-100 text-green-800",
  general: "bg-gray-100 text-gray-800",
}

export function DayPhotosSection({ photos, onPhotoDeleted, onAddPhotos }: DayPhotosSectionProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm("Are you sure you want to delete this photo?")) return

    try {
      await photoService.deletePhoto(photoId)
      onPhotoDeleted()
    } catch (error: any) {
      console.error("Error deleting photo:", error)
    }
  }

  if (photos.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No photos yet</h3>
          <p className="text-gray-600 mb-4">Capture memories from this day by adding photos.</p>
          <Button onClick={onAddPhotos}>
            <Plus className="mr-2 h-4 w-4" />
            Add Photos
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Day Photos ({photos.length})</h3>
        <Button onClick={onAddPhotos} variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Add More
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo) => (
          <Card key={photo.id} className="group overflow-hidden">
            <div className="relative aspect-square">
              <img
                src={photoService.getPhotoUrl(photo.file_path) || "/placeholder.svg"}
                alt={photo.caption || photo.file_name}
                className="w-full h-full object-cover cursor-pointer transition-transform group-hover:scale-105"
                onClick={() => setSelectedPhoto(photo)}
              />

              {/* Photo Type Badge */}
              <Badge className={`absolute top-2 left-2 ${photoTypeColors[photo.photo_type]}`} variant="secondary">
                {photoTypeLabels[photo.photo_type]}
              </Badge>

              {/* Action Buttons */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
                  <Button size="sm" variant="secondary" onClick={() => setSelectedPhoto(photo)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleDeletePhoto(photo.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {photo.caption && (
              <CardContent className="p-3">
                <p className="text-sm text-gray-600 truncate">{photo.caption}</p>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Lightbox */}
      {selectedPhoto && (
        <PhotoLightbox
          photo={selectedPhoto}
          photos={photos}
          onClose={() => setSelectedPhoto(null)}
          onDelete={handleDeletePhoto}
        />
      )}
    </div>
  )
}
