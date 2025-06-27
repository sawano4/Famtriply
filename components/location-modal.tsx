"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { locationService } from "@/lib/api"
import type { DayItinerary, Location } from "@/lib/types"
import { Loader2, Upload, X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface LocationModalProps {
  open: boolean
  onClose: () => void
  dayItinerary: DayItinerary | null
  location?: Location | null
  onLocationSaved: () => void
}

const locationTypes = [
  { value: "restaurant", label: "Restaurant" },
  { value: "attraction", label: "Attraction" },
  { value: "hotel", label: "Hotel" },
  { value: "activity", label: "Activity" },
  { value: "other", label: "Other" },
]

export function LocationModal({ open, onClose, dayItinerary, location, onLocationSaved }: LocationModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [locationPhoto, setLocationPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    maps_link: "",
    type: "other" as Location["type"],
    visit_time: "",
    notes: "",
  })

  useEffect(() => {
    if (location) {
      setFormData({
        name: location.name,
        maps_link: location.address || "", // Use address field to store maps link
        type: location.type,
        visit_time: location.visit_time || "",
        notes: location.notes || "",
      })
      setPhotoPreview(location.photo_url)
    } else {
      setFormData({
        name: "",
        maps_link: "",
        type: "other",
        visit_time: "",
        notes: "",
      })
      setPhotoPreview(null)
    }
    setError("")
    setLocationPhoto(null)
  }, [location, open])

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLocationPhoto(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removePhoto = () => {
    setLocationPhoto(null)
    setPhotoPreview(location?.photo_url || null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!dayItinerary) return

    setLoading(true)
    setError("")

    try {
      const locationData = {
        day_itinerary_id: dayItinerary.id,
        name: formData.name,
        address: formData.maps_link || undefined, // Store maps link in address field
        type: formData.type,
        visit_time: formData.visit_time || undefined,
        notes: formData.notes || undefined,
        photo: locationPhoto || undefined,
      }

      if (location) {
        await locationService.updateLocation(location.id, locationData)
      } else {
        await locationService.createLocation(locationData)
      }

      onLocationSaved()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{location ? "Edit Location" : "Add Location"}</DialogTitle>
          <DialogDescription>
            {location ? "Update the location details" : "Add a new location to your itinerary"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Location Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="e.g., Eiffel Tower, Joe's Pizza"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {locationTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Google Maps Link */}
          <div className="space-y-2">
            <Label htmlFor="maps_link">Google Maps Link (Optional)</Label>
            <Input
              id="maps_link"
              value={formData.maps_link}
              onChange={(e) => handleInputChange("maps_link", e.target.value)}
              placeholder="https://maps.google.com/..."
              type="url"
            />
            <p className="text-xs text-gray-500">Copy and paste the Google Maps link for this location</p>
          </div>

          {/* Photo Upload */}
          <div className="space-y-2">
            <Label>Location Photo (Optional)</Label>
            {photoPreview ? (
              <div className="relative">
                <img
                  src={photoPreview || "/placeholder.svg"}
                  alt="Location preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={removePhoto}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-2">Upload a photo of this location</p>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                  id="locationPhoto"
                />
                <Label htmlFor="locationPhoto" className="cursor-pointer text-blue-600 hover:text-blue-500">
                  Choose photo
                </Label>
              </div>
            )}
          </div>

          {/* Time */}
          <div className="space-y-2">
            <Label htmlFor="visit_time">Visit Time (Optional)</Label>
            <Input
              id="visit_time"
              type="time"
              value={formData.visit_time}
              onChange={(e) => handleInputChange("visit_time", e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Any additional notes or details..."
              rows={3}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {location ? "Update Location" : "Add Location"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
