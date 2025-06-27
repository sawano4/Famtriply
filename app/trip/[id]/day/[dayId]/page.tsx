"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { DayDetailView } from "@/components/day-detail-view"
import { itineraryService } from "@/lib/api"
import type { DayItinerary } from "@/lib/types"
import { Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function DayDetailPage() {
  const params = useParams()
  const dayId = params.dayId as string
  const [dayItinerary, setDayItinerary] = useState<DayItinerary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDay()
  }, [dayId])

  const loadDay = async () => {
    try {
      setError(null)
      const dayData = await itineraryService.getDayItinerary(dayId)
      if (!dayData) {
        setError("Day not found")
        return
      }
      setDayItinerary(dayData)
    } catch (error: any) {
      console.error("Error loading day:", error)
      setError(error.message || "Failed to load day")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading day details...</p>
        </div>
      </div>
    )
  }

  if (error || !dayItinerary) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error || "Day not found"}</AlertDescription>
          </Alert>
          <Button onClick={() => window.history.back()} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Trip
          </Button>
        </div>

        <DayDetailView dayItinerary={dayItinerary} onDayUpdate={loadDay} />
      </div>
    </div>
  )
}
