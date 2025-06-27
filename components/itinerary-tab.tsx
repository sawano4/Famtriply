"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, AlertCircle } from "lucide-react"
import { DaySelector } from "./day-selector"
import { DayDetailView } from "./day-detail-view"
import { itineraryService } from "@/lib/api"
import type { Trip, DayItinerary } from "@/lib/types"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { addDays, differenceInDays } from "date-fns"

interface ItineraryTabProps {
  trip: Trip
  onDataRefresh: () => Promise<void>
}

interface TripDay {
  dayNumber: number
  date: string
  dayItinerary?: DayItinerary
}

export function ItineraryTab({ trip, onDataRefresh }: ItineraryTabProps) {
  const [tripDays, setTripDays] = useState<TripDay[]>([])
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(1)
  const [dayItineraries, setDayItineraries] = useState<DayItinerary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log("Trip data received in ItineraryTab:", trip)
    
    // Make sure we have valid dates before proceeding
    if (!trip.start_date || !trip.end_date) {
      console.error("Trip is missing start or end date:", trip)
      setError("Trip is missing required dates")
      setLoading(false)
      return
    }
    
    const days = calculateTripDays()
    loadItineraries(days)
  }, [trip.id, trip.start_date, trip.end_date])

  // Validate date before attempting to create a Date object
  const isValidDate = (dateString: string): boolean => {
    if (!dateString) return false
    const date = new Date(dateString)
    return !isNaN(date.getTime())
  }

  const calculateTripDays = () => {
    // Validate dates first
    if (!isValidDate(trip.start_date) || !isValidDate(trip.end_date)) {
      console.error("Invalid trip dates:", { start: trip.start_date, end: trip.end_date })
      setError("Trip has invalid dates")
      setLoading(false)
      return []
    }

    const startDate = new Date(trip.start_date)
    const endDate = new Date(trip.end_date)
    console.log("Trip dates:", { start: trip.start_date, startDate, end: trip.end_date, endDate })
    
    const totalDays = differenceInDays(endDate, startDate) + 1
    console.log("Total days calculated:", totalDays)

    // Safety check for reasonable number of days (up to 90 days)
    const maxDays = 90;
    if (totalDays <= 0) {
      console.error("Invalid trip duration:", totalDays, "Start:", startDate, "End:", endDate)
      setError("Trip has an invalid duration (end date is before start date)")
      return []
    } else if (totalDays > maxDays) {
      console.warn(`Trip duration (${totalDays}) exceeds maximum allowed (${maxDays})`)
      // We'll still process but limit to max days
    }

    const days: TripDay[] = []
    // Use the smaller of actual trip days and max days
    const daysToCreate = Math.min(totalDays, maxDays)
    for (let i = 0; i < daysToCreate; i++) {
      const currentDate = addDays(startDate, i)
      days.push({
        dayNumber: i + 1,
        date: currentDate.toISOString().split("T")[0], // YYYY-MM-DD format
      })
    }

    setTripDays(days)
    console.log("Calculated trip days:", days)
    return days
  }

  const loadItineraries = async (daysList?: TripDay[]) => {
    try {
      setError(null)
      setLoading(true)
      console.log("Loading itineraries for trip:", trip.id)

      const data = await itineraryService.getDayItineraries(trip.id)
      console.log("Loaded day itineraries:", data)

      setDayItineraries(data)

      // Use the provided days list or the current state
      const days = daysList || tripDays
      if (days.length) {
        // Match day itineraries with trip days
        const updatedDays = days.map(day => {
          const matchingItinerary = data.find(
            di => di.date === day.date
          )
          return {
            ...day,
            dayItinerary: matchingItinerary,
          }
        })

        console.log("Updated trip days with itineraries:", updatedDays)
        setTripDays(updatedDays)
        
        // If no day is selected yet and we have days, select the first one
        if (updatedDays.length > 0 && !selectedDayNumber) {
          setSelectedDayNumber(1)
        }
      }
    } catch (error: any) {
      console.error("Error loading itineraries:", error)
      setError(error.message || "Failed to load itineraries")
    } finally {
      setLoading(false)
    }
  }

  const handleDaySelect = (dayNumber: number) => {
    console.log("Selected day:", dayNumber)
    setSelectedDayNumber(dayNumber)
    
    // Force reload of day itineraries to ensure fresh data
    loadItineraries().then(() => {
      console.log("Reloaded itineraries after day selection")
    })
  }

  const handleDayUpdate = async () => {
    console.log("Day updated - refreshing itinerary data")
    // First reload itineraries
    await loadItineraries()
    // Then trigger parent refresh to update totals
    await onDataRefresh()
  }

  const selectedDay = tripDays.find((day) => day.dayNumber === selectedDayNumber)
  const selectedDayItinerary = selectedDay?.dayItinerary

  const tripStats = {
    totalDays: tripDays.length,
    totalLocations: dayItineraries.reduce((sum, day) => sum + (day.locations?.length || 0), 0),
    totalPhotos: dayItineraries.reduce((sum, day) => sum + (day.photos?.length || 0), 0),
    totalExpenses: dayItineraries.reduce((sum, day) => sum + (day.day_total || 0), 0),
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading itinerary...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }
  
  // Show special message if we have no trip days
  if (!loading && (!tripDays || tripDays.length === 0)) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No days available for this trip</h3>
            <p className="text-gray-600 mb-4">
              There seems to be an issue with the trip dates. The start date might be after the end date, or the dates might be invalid.
            </p>
            <div className="text-sm text-gray-500 mb-4">
              Trip Dates: {trip.start_date} to {trip.end_date}
            </div>
            <Button onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Trip Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Trip Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{tripStats.totalDays}</div>
              <div className="text-sm text-gray-600">Days</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{tripStats.totalLocations}</div>
              <div className="text-sm text-gray-600">Locations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{tripStats.totalPhotos}</div>
              <div className="text-sm text-gray-600">Photos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">TL {tripStats.totalExpenses.toFixed(2)}</div>
              <div className="text-sm text-gray-600">Spent</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Day Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select a Day</CardTitle>
        </CardHeader>
        <CardContent>
          <DaySelector tripDays={tripDays} selectedDayNumber={selectedDayNumber} onDaySelect={handleDaySelect} />
        </CardContent>
      </Card>

      {/* Selected Day Detail */}
      {selectedDay ? (
        <Card>
          <CardHeader>
            <CardTitle>Day {selectedDayNumber} Details</CardTitle>
          </CardHeader>
          <CardContent>
            <DayDetailView
              tripId={trip.id}
              dayNumber={selectedDayNumber}
              date={selectedDay.date}
              dayItinerary={selectedDayItinerary}
              onDayUpdate={handleDayUpdate}
              onDataRefresh={onDataRefresh}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select a day to start planning</h3>
            <p className="text-gray-600">Choose a day from the timeline above to view and edit your itinerary.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
