"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { photoService } from "@/lib/api"
import type { Photo, Trip } from "@/lib/types"
import { Upload, X, ImageIcon, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface PhotoUploadModalProps {
  open: boolean
  onClose: () => void
  trip: Trip
  dayItineraryId?: string
  onPhotoUploaded: () => void
}

interface UploadFile {
  file: File
  preview: string
  caption: string
  photoType: Photo["photo_type"]
  uploading: boolean
  uploaded: boolean
  error?: string
}

const photoTypes = [
  { value: "general", label: "General Photo" },
  { value: "location", label: "Location Photo" },
  { value: "souvenir", label: "Souvenir/Shopping" },
]

export function PhotoUploadModal({ open, onClose, trip, dayItineraryId, onPhotoUploaded }: PhotoUploadModalProps) {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    console.log("Files selected:", selectedFiles.length)
    addFiles(selectedFiles)
    // Reset the input so the same file can be selected again
    e.target.value = ""
  }, [])

  const addFiles = useCallback((newFiles: File[]) => {
    console.log("Adding files:", newFiles.length)
    const imageFiles = newFiles.filter((file) => file.type.startsWith("image/"))
    console.log("Image files filtered:", imageFiles.length)

    const uploadFiles: UploadFile[] = imageFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      caption: "",
      photoType: "general",
      uploading: false,
      uploaded: false,
    }))

    console.log("Upload files created:", uploadFiles)
    setFiles((prev) => [...prev, ...uploadFiles])
  }, [])

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev]
      URL.revokeObjectURL(newFiles[index].preview)
      newFiles.splice(index, 1)
      return newFiles
    })
  }, [])

  const updateFileData = useCallback((index: number, field: string, value: string) => {
    setFiles((prev) => {
      const newFiles = [...prev]
      newFiles[index] = { ...newFiles[index], [field]: value }
      return newFiles
    })
  }, [])

  const handleUpload = async () => {
    if (files.length === 0) return

    console.log("Starting upload for", files.length, "files")
    setUploading(true)
    setUploadProgress(0)

    try {
      const totalFiles = files.length
      let completedFiles = 0

      for (let i = 0; i < files.length; i++) {
        const uploadFile = files[i]

        if (uploadFile.uploaded) {
          completedFiles++
          continue
        }

        console.log(`Uploading file ${i + 1}/${totalFiles}:`, uploadFile.file.name)

        // Update file status
        setFiles((prev) => {
          const newFiles = [...prev]
          newFiles[i].uploading = true
          newFiles[i].error = undefined
          return newFiles
        })

        try {
          await photoService.uploadPhoto(trip.id, uploadFile.file, {
            dayItineraryId,
            caption: uploadFile.caption || undefined,
            photoType: uploadFile.photoType,
          })

          console.log(`File ${i + 1} uploaded successfully`)

          // Mark as uploaded
          setFiles((prev) => {
            const newFiles = [...prev]
            newFiles[i].uploading = false
            newFiles[i].uploaded = true
            return newFiles
          })

          completedFiles++
          setUploadProgress((completedFiles / totalFiles) * 100)
        } catch (error: any) {
          console.error(`Error uploading file ${i + 1}:`, error)
          // Mark as error
          setFiles((prev) => {
            const newFiles = [...prev]
            newFiles[i].uploading = false
            newFiles[i].error = error.message
            return newFiles
          })
        }
      }

      console.log(`Upload complete. ${completedFiles}/${totalFiles} files uploaded`)

      // If all files uploaded successfully, close modal
      if (completedFiles === totalFiles) {
        onPhotoUploaded()
        handleClose()
      }
    } catch (error: any) {
      console.error("Upload error:", error)
    } finally {
      setUploading(false)
    }
  }

  const handleClose = () => {
    console.log("Closing photo upload modal")
    // Clean up preview URLs
    files.forEach((file) => URL.revokeObjectURL(file.preview))
    setFiles([])
    setUploadProgress(0)
    onClose()
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const droppedFiles = Array.from(e.dataTransfer.files)
      console.log("Files dropped:", droppedFiles.length)
      addFiles(droppedFiles)
    },
    [addFiles],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const allUploaded = files.every((file) => file.uploaded)

  console.log("PhotoUploadModal render:", { open, filesCount: files.length, dayItineraryId })

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Photos</DialogTitle>
          <DialogDescription>Add photos to your day's memories</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Drop Zone */}
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select photos to upload</h3>
            <p className="text-gray-600 mb-4">Drag and drop images here, or click to select files</p>
            <Input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="photo-upload"
            />
            <Label htmlFor="photo-upload" className="cursor-pointer inline-block">
              <Button type="button" variant="outline" asChild>
                <span>
                  <Upload className="mr-2 h-4 w-4" />
                  Choose Photos
                </span>
              </Button>
            </Label>
          </div>

          {/* Selected Files */}
          {files.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Selected Photos ({files.length})</h4>
                <Input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="add-more-photos"
                />
                <Label htmlFor="add-more-photos" className="cursor-pointer inline-block">
                  <Button type="button" variant="outline" size="sm" asChild>
                    <span>
                      <Upload className="mr-2 h-4 w-4" />
                      Add More
                    </span>
                  </Button>
                </Label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {files.map((uploadFile, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="relative">
                      <img
                        src={uploadFile.preview || "/placeholder.svg"}
                        alt="Preview"
                        className="w-full h-32 object-cover rounded"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      {uploadFile.uploading && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded">
                          <Loader2 className="h-6 w-6 text-white animate-spin" />
                        </div>
                      )}
                      {uploadFile.uploaded && (
                        <div className="absolute inset-0 bg-green-500 bg-opacity-20 flex items-center justify-center rounded">
                          <div className="bg-green-500 text-white rounded-full p-1">✓</div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`photo-type-${index}`}>Photo Type</Label>
                      <Select
                        value={uploadFile.photoType}
                        onValueChange={(value) => updateFileData(index, "photoType", value)}
                        disabled={uploadFile.uploading || uploadFile.uploaded}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {photoTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`caption-${index}`}>Caption (optional)</Label>
                      <Textarea
                        id={`caption-${index}`}
                        value={uploadFile.caption}
                        onChange={(e) => updateFileData(index, "caption", e.target.value)}
                        placeholder="Add a caption for this photo..."
                        rows={2}
                        disabled={uploadFile.uploading || uploadFile.uploaded}
                      />
                    </div>

                    {uploadFile.error && (
                      <Alert variant="destructive">
                        <AlertDescription>{uploadFile.error}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Uploading photos...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={handleClose}>
              {allUploaded ? "Done" : "Cancel"}
            </Button>
            {files.length > 0 && !allUploaded && (
              <Button onClick={handleUpload} disabled={uploading}>
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload {files.filter((f) => !f.uploaded).length} Photos
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
