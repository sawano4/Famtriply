"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Upload, Camera, Search, Trash2, Eye } from "lucide-react"
import { PhotoUploadModal } from "./photo-upload-modal"
import { PhotoLightbox } from "./photo-lightbox"
import { photoService } from "@/lib/api"
import type { Trip, Photo } from "@/lib/types"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface PhotosTabProps {
  trip: Trip
}

export function PhotosTab({ trip }: PhotosTabProps) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [dragOver, setDragOver] = useState(false)

  useEffect(() => {
    loadPhotos()
  }, [trip.id])

  const loadPhotos = async () => {
    try {
      setError(null)
      const data = await photoService.getPhotos(trip.id)
      setPhotos(data)
    } catch (error: any) {
      console.error("Error loading photos:", error)
      setError(error.message || "Failed to load photos")
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoUploaded = useCallback(() => {
    loadPhotos()
    setShowUploadModal(false)
  }, [])

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm("Are you sure you want to delete this photo?")) return

    try {
      await photoService.deletePhoto(photoId)
      setPhotos((prev) => prev.filter((p) => p.id !== photoId))
    } catch (error: any) {
      console.error("Error deleting photo:", error)
      setError(error.message || "Failed to delete photo")
    }
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)

    const files = Array.from(e.dataTransfer.files).filter((file) => file.type.startsWith("image/"))

    if (files.length > 0) {
      setShowUploadModal(true)
      // You could pass the files to the upload modal here
    }
  }, [])

  const filteredPhotos = photos.filter(
    (photo) =>
      photo.caption?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      photo.file_name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading photos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Trip Photos</h2>
          <p className="text-gray-600">{photos.length} photos uploaded</p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search photos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button onClick={() => setShowUploadModal(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Photos
          </Button>
        </div>
      </div>

      {/* Drag and Drop Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragOver ? "border-blue-500 bg-blue-50" : "border-gray-300"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Drag and drop photos here</h3>
        <p className="text-gray-600 mb-4">or click the button below to select files</p>
        <Button onClick={() => setShowUploadModal(true)} variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Choose Photos
        </Button>
      </div>

      {/* Photos Grid */}
      {filteredPhotos.length === 0 ? (
        <div className="text-center py-12">
          <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {photos.length === 0 ? "No photos yet" : "No photos found"}
          </h3>
          <p className="text-gray-600 mb-4">
            {photos.length === 0
              ? "Start capturing memories by uploading your first photos!"
              : "Try adjusting your search terms."}
          </p>
          {photos.length === 0 && (
            <Button onClick={() => setShowUploadModal(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Upload First Photo
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredPhotos.map((photo) => (
            <Card key={photo.id} className="group overflow-hidden">
              <div className="relative aspect-square">
                <img
                  src={photoService.getPhotoUrl(photo.file_path) || "/placeholder.svg"}
                  alt={photo.caption || photo.file_name}
                  className="w-full h-full object-cover cursor-pointer transition-transform group-hover:scale-105"
                  onClick={() => setSelectedPhoto(photo)}
                />
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
      )}

      {/* Upload Modal */}
      <PhotoUploadModal
        open={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        trip={trip}
        onPhotoUploaded={handlePhotoUploaded}
      />

      {/* Lightbox */}
      {selectedPhoto && (
        <PhotoLightbox
          photo={selectedPhoto}
          photos={filteredPhotos}
          onClose={() => setSelectedPhoto(null)}
          onDelete={handleDeletePhoto}
        />
      )}
    </div>
  )
}
