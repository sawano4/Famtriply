"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Calendar, MapPin, AlertCircle } from "lucide-react"
import { TripCard } from "./trip-card"
import { CreateTripModal } from "./create-trip-modal"
import { tripService } from "@/lib/api"
import type { Trip } from "@/lib/types"
import { useAuth } from "@/hooks/use-auth"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function Dashboard() {
  const { user } = useAuth()
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    if (user) {
      loadTrips()
    }
  }, [user])

  const loadTrips = async () => {
    try {
      setError(null)
      const data = await tripService.getTrips()
      setTrips(data)
    } catch (error: any) {
      console.error("Error loading trips:", error)
      setError(error.message || "Failed to load trips")
    } finally {
      setLoading(false)
    }
  }

  const filteredTrips = trips.filter(
    (trip) =>
      trip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.destination.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const stats = {
    total: trips.length,
    planning: trips.filter((t) => t.status === "planning").length,
    ongoing: trips.filter((t) => t.status === "ongoing").length,
    completed: trips.filter((t) => t.status === "completed").length,
  }

  const handleTripCreated = (newTrip: Trip) => {
    setTrips((prev) => [newTrip, ...prev])
    setShowCreateModal(false)
  }

  const handleViewTrip = (trip: Trip) => {
    // Navigate to trip detail view
    window.location.href = `/trip/${trip.id}`
  }

  const handleEditTrip = (trip: Trip) => {
    // Open edit modal or navigate to edit page
    console.log("Edit trip:", trip)
  }

  const handleDeleteTrip = async (trip: Trip) => {
    if (confirm("Are you sure you want to delete this trip?")) {
      try {
        await tripService.deleteTrip(trip.id)
        setTrips((prev) => prev.filter((t) => t.id !== trip.id))
      } catch (error: any) {
        console.error("Error deleting trip:", error)
        setError(error.message || "Failed to delete trip")
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your trips...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.user_metadata?.full_name || "Traveler"}!
        </h1>
        <p className="text-gray-600">Plan and manage your family adventures</p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="mb-6" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <Calendar className="h-5 w-5 text-blue-500 mr-2" />
            <div>
              <p className="text-sm text-gray-600">Total Trips</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <MapPin className="h-5 w-5 text-orange-500 mr-2" />
            <div>
              <p className="text-sm text-gray-600">Planning</p>
              <p className="text-2xl font-bold text-gray-900">{stats.planning}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="h-5 w-5 bg-green-500 rounded-full mr-2"></div>
            <div>
              <p className="text-sm text-gray-600">Ongoing</p>
              <p className="text-2xl font-bold text-gray-900">{stats.ongoing}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="h-5 w-5 bg-gray-500 rounded-full mr-2"></div>
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Create */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search trips by title or destination..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Create New Trip
        </Button>
      </div>

      {/* Trips Grid */}
      {filteredTrips.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {trips.length === 0 ? "No trips yet" : "No trips found"}
          </h3>
          <p className="text-gray-600 mb-6">
            {trips.length === 0 ? "Start planning your first family adventure!" : "Try adjusting your search terms."}
          </p>
          {trips.length === 0 && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Trip
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              onView={handleViewTrip}
              onEdit={handleEditTrip}
              onDelete={handleDeleteTrip}
            />
          ))}
        </div>
      )}

      {/* Create Trip Modal */}
      <CreateTripModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onTripCreated={handleTripCreated}
      />
    </div>
  )
}
