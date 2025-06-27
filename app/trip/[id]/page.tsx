"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { TripDetailView } from "@/components/trip-detail-view"
import { tripService } from "@/lib/api"
import type { Trip } from "@/lib/types"
import { Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function TripDetailPage() {
  const params = useParams()
  const tripId = params.id as string
  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadTrip()
  }, [tripId])

  const loadTrip = async () => {
    try {
      setError(null)
      const tripData = await tripService.getTripById(tripId)
      if (!tripData) {
        setError("Trip not found")
        return
      }
      
      console.log("Loaded trip data:", tripData)
      
      // Ensure dates are properly formatted
      if (!tripData.start_date || !tripData.end_date) {
        console.error("Trip is missing start or end date:", tripData)
        setError("Trip data is missing required dates")
        return
      }
      
      // Validate that dates are in a parseable format
      try {
        const startDate = new Date(tripData.start_date)
        const endDate = new Date(tripData.end_date)
        
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          console.error("Invalid date format:", { start: tripData.start_date, end: tripData.end_date })
          setError("Trip has invalid date format")
          return
        }
        
        console.log("Validated dates:", { startDate, endDate })
      } catch (dateError) {
        console.error("Error parsing dates:", dateError)
        setError("Could not parse trip dates")
        return
      }
      
      setTrip(tripData)
    } catch (error: any) {
      console.error("Error loading trip:", error)
      setError(error.message || "Failed to load trip")
    } finally {
      setLoading(false)
    }
  }

  // This handler refreshes the trip data, including the updated expenses
  const handleTripDataRefresh = async () => {
    try {
      const refreshedTrip = await tripService.getTripById(tripId);
      if (refreshedTrip) {
        setTrip(refreshedTrip);
      }
    } catch (error) {
      console.error("Error refreshing trip data:", error);
    }
  }

  // Helper function to fix invalid dates if needed
  const fixTripDates = async () => {
    if (!trip) return;
    
    try {
      console.log("Attempting to fix trip dates");
      
      // Get today's date and format it as YYYY-MM-DD
      const today = new Date();
      const formattedToday = today.toISOString().split('T')[0];
      
      // Get a date 7 days from now and format it
      const weekLater = new Date();
      weekLater.setDate(today.getDate() + 7);
      const formattedWeekLater = weekLater.toISOString().split('T')[0];
      
      // Update the trip with valid dates
      const updatedTrip = await tripService.updateTrip(trip.id, {
        start_date: formattedToday,
        end_date: formattedWeekLater
      });
      
      if (updatedTrip) {
        console.log("Successfully fixed trip dates:", updatedTrip);
        setTrip(updatedTrip);
      }
    } catch (error) {
      console.error("Error fixing trip dates:", error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading trip details...</p>
        </div>
      </div>
    )
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error || "Trip not found"}</AlertDescription>
          </Alert>
          <Button onClick={() => (window.location.href = "/")} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      {trip && (!trip.start_date || !trip.end_date || new Date(trip.start_date) > new Date(trip.end_date)) && (
        <div className="bg-yellow-50 p-4 border-l-4 border-yellow-400">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                This trip has invalid dates. <a onClick={fixTripDates} className="font-medium text-yellow-700 underline hover:text-yellow-600 cursor-pointer">Click here to fix</a>.
              </p>
            </div>
          </div>
        </div>
      )}
      <TripDetailView trip={trip} onTripUpdate={setTrip} onDataRefresh={handleTripDataRefresh} />
    </>
  )
}
