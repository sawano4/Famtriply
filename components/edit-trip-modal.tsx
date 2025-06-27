"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { tripService } from "@/lib/api"
import type { Trip } from "@/lib/types"
import { Loader2, Upload, X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"

interface EditTripModalProps {
  trip: Trip
  open: boolean
  onClose: () => void
  onTripUpdated: (trip: Trip) => void
}

export function EditTripModal({ trip, open, onClose, onTripUpdated }: EditTripModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    destination: "",
    start_date: "",
    end_date: "",
    budget: "",
    status: "planning" as Trip["status"],
  })

  useEffect(() => {
    if (trip) {
      setFormData({
        title: trip.title,
        destination: trip.destination,
        start_date: trip.start_date,
        end_date: trip.end_date,
        budget: trip.budget?.toString() || "",
        status: trip.status,
      })
      setCoverImagePreview(trip.cover_image_url)
    }
    setError("")
    setCoverImage(null)
  }, [trip, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Validate dates
    if (new Date(formData.start_date) >= new Date(formData.end_date)) {
      setError("End date must be after start date")
      setLoading(false)
      return
    }
    
    // Calculate trip duration
    const tripDuration = Math.floor((new Date(formData.end_date).getTime() - new Date(formData.start_date).getTime()) / (1000 * 3600 * 24)) + 1;
    
    // Validate trip duration (allowing up to 90 days)
    if (tripDuration > 90) {
      setError("Trip duration cannot exceed 90 days")
      setLoading(false)
      return
    }

    try {
      const updates: Partial<Trip> = {
        title: formData.title,
        destination: formData.destination,
        start_date: formData.start_date,
        end_date: formData.end_date,
        budget: formData.budget ? Number.parseFloat(formData.budget) : null,
        status: formData.status,
      }

      // Handle cover image upload if new image selected
      if (coverImage) {
        // Upload new image
        const user = await supabase.auth.getUser()
        if (user.data.user) {
          const fileExt = coverImage.name.split(".").pop()
          const fileName = `${user.data.user.id}/${Date.now()}.${fileExt}`

          const { error: uploadError } = await supabase.storage.from("trip-covers").upload(fileName, coverImage)

          if (uploadError) throw uploadError

          const {
            data: { publicUrl },
          } = supabase.storage.from("trip-covers").getPublicUrl(fileName)

          updates.cover_image_url = publicUrl
        }
      }

      const updatedTrip = await tripService.updateTrip(trip.id, updates)
      onTripUpdated(updatedTrip)
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCoverImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setCoverImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeCoverImage = () => {
    setCoverImage(null)
    setCoverImagePreview(trip.cover_image_url)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Trip</DialogTitle>
          <DialogDescription>Update your trip details</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Trip Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="destination">Destination</Label>
            <Input
              id="destination"
              value={formData.destination}
              onChange={(e) => handleInputChange("destination", e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => handleInputChange("start_date", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => handleInputChange("end_date", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budget">Budget ($)</Label>
              <Input
                id="budget"
                type="number"
                min="0"
                step="0.01"
                value={formData.budget}
                onChange={(e) => handleInputChange("budget", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="ongoing">Ongoing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Cover Image</Label>
            {coverImagePreview ? (
              <div className="relative">
                <img
                  src={coverImagePreview || "/placeholder.svg"}
                  alt="Cover preview"
                  className="w-full h-32 object-cover rounded-lg"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={removeCoverImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-2">Click to upload a cover image</p>
                <Input type="file" accept="image/*" onChange={handleImageChange} className="hidden" id="coverImage" />
                <Label htmlFor="coverImage" className="cursor-pointer text-blue-600 hover:text-blue-500">
                  Choose file
                </Label>
              </div>
            )}
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
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
