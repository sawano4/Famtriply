"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Calendar, MapPin, DollarSign, Edit, Share } from "lucide-react"
import { ItineraryTab } from "./itinerary-tab"
import { PhotosTab } from "./photos-tab"
import { BudgetTab } from "./budget-tab"
import { EditTripModal } from "./edit-trip-modal"
import type { Trip } from "@/lib/types"
import { format, differenceInDays } from "date-fns"

interface TripDetailViewProps {
  trip: Trip
  onTripUpdate: (trip: Trip) => void
  onDataRefresh: () => Promise<void>
}

const statusColors = {
  planning: "bg-orange-100 text-orange-800",
  ongoing: "bg-green-100 text-green-800",
  completed: "bg-gray-100 text-gray-800",
}

const statusLabels = {
  planning: "Planning",
  ongoing: "Ongoing",
  completed: "Completed",
}

export function TripDetailView({ trip, onTripUpdate, onDataRefresh }: TripDetailViewProps) {
  const [showEditModal, setShowEditModal] = useState(false)
  const [activeTab, setActiveTab] = useState("itinerary")

  const startDate = new Date(trip.start_date)
  const endDate = new Date(trip.end_date)
  const duration = differenceInDays(endDate, startDate) + 1

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: trip.title,
          text: `Check out my trip to ${trip.destination}!`,
          url: window.location.href,
        })
      } catch (error) {
        console.log("Error sharing:", error)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      // You could show a toast notification here
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <Button
              variant="ghost"
              onClick={() => (window.location.href = "/")}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share className="mr-2 h-4 w-4" />
                Share
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowEditModal(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Trip
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Trip Header */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Trip Info */}
            <div className="lg:col-span-2">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <Badge className={statusColors[trip.status]} variant="secondary">
                    {statusLabels[trip.status]}
                  </Badge>
                  <h1 className="text-3xl font-bold text-gray-900 mt-2">{trip.title}</h1>
                  <div className="flex items-center text-gray-600 mt-2">
                    <MapPin className="h-5 w-5 mr-2" />
                    <span className="text-lg">{trip.destination}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                <div className="flex items-center text-gray-600">
                  <Calendar className="h-5 w-5 mr-3" />
                  <div>
                    <p className="font-medium">
                      {format(startDate, "MMM d")} - {format(endDate, "MMM d, yyyy")}
                    </p>
                    <p className="text-sm text-gray-500">{duration} days</p>
                  </div>
                </div>

                {trip.budget && (
                  <div className="flex items-center text-gray-600">
                    <DollarSign className="h-5 w-5 mr-3" />
                    <div>
                      <p className="font-medium">TL {trip.budget.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">Total budget</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Cover Image */}
            {trip.cover_image_url && (
              <div className="lg:col-span-1">
                <div className="aspect-video lg:aspect-square rounded-lg overflow-hidden">
                  <img
                    src={trip.cover_image_url || "/placeholder.svg"}
                    alt={trip.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
            <TabsTrigger value="photos">Photos</TabsTrigger>
            <TabsTrigger value="budget">Budget</TabsTrigger>
          </TabsList>

          <TabsContent value="itinerary">
            <ItineraryTab trip={trip} onDataRefresh={onDataRefresh} />
          </TabsContent>

          <TabsContent value="photos">
            <PhotosTab trip={trip} />
          </TabsContent>

          <TabsContent value="budget">
            <BudgetTab trip={trip} onDataRefresh={onDataRefresh} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Trip Modal */}
      <EditTripModal
        trip={trip}
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        onTripUpdated={onTripUpdate}
      />
    </div>
  )
}
