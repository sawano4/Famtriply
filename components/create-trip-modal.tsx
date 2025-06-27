"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { tripService } from "@/lib/api"
import type { Trip } from "@/lib/types"
import { Loader2, Upload, X } from "lucide-react"

interface CreateTripModalProps {
  open: boolean
  onClose: () => void
  onTripCreated: (trip: Trip) => void
}

export function CreateTripModal({ open, onClose, onTripCreated }: CreateTripModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const title = formData.get("title") as string
    const destination = formData.get("destination") as string
    const startDate = formData.get("startDate") as string
    const endDate = formData.get("endDate") as string
    const budget = formData.get("budget") as string

    // Validate dates
    if (new Date(startDate) >= new Date(endDate)) {
      setError("End date must be after start date")
      setLoading(false)
      return
    }
    
    // Calculate trip duration
    const tripDuration = Math.floor((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 3600 * 24)) + 1;
    
    // Validate trip duration (allowing up to 90 days)
    if (tripDuration > 90) {
      setError("Trip duration cannot exceed 90 days")
      setLoading(false)
      return
    }

    try {
      const tripData = {
        title,
        destination,
        start_date: startDate,
        end_date: endDate,
        budget: budget ? Number.parseFloat(budget) : undefined,
        cover_image: coverImage || undefined,
      }

      const newTrip = await tripService.createTrip(tripData)
      onTripCreated(newTrip)

      // Reset form
      e.currentTarget.reset()
      setCoverImage(null)
      setCoverImagePreview(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
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
    setCoverImagePreview(null)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Trip</DialogTitle>
          <DialogDescription>Start planning your next family adventure</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Trip Title</Label>
            <Input id="title" name="title" placeholder="e.g., Summer Family Vacation" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="destination">Destination</Label>
            <Input id="destination" name="destination" placeholder="e.g., Orlando, Florida" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input id="startDate" name="startDate" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input id="endDate" name="endDate" type="date" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget">Budget (Optional)</Label>
            <Input id="budget" name="budget" type="number" placeholder="e.g., 5000" min="0" step="0.01" />
          </div>

          <div className="space-y-2">
            <Label>Cover Image (Optional)</Label>
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

          {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}

          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Trip
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
