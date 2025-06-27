"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, MapPin, Camera, DollarSign, Clock, AlertCircle } from "lucide-react"
import { LocationCard } from "./location-card"
import { DayPhotosSection } from "./day-photos-section"
import { DayExpensesSection } from "./day-expenses-section"
import { LocationModal } from "./location-modal"
import { ExpenseModal } from "./expense-modal"
import { PhotoUploadModal } from "./photo-upload-modal"
import { locationService, photoService, expenseService, itineraryService } from "@/lib/api"
import type { DayItinerary, Location, Photo, Expense, Trip } from "@/lib/types"
import { format } from "date-fns"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface DayDetailViewProps {
  tripId: string
  dayNumber: number
  date: string
  dayItinerary?: DayItinerary
  onDayUpdate: () => void
  onDataRefresh: () => Promise<void>
}

export function DayDetailView({ tripId, dayNumber, date, dayItinerary, onDayUpdate, onDataRefresh }: DayDetailViewProps) {
  const [currentDayItinerary, setCurrentDayItinerary] = useState<DayItinerary | null>(dayItinerary || null)
  const [locations, setLocations] = useState<Location[]>([])
  const [photos, setPhotos] = useState<Photo[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [activeTab, setActiveTab] = useState("locations")

  useEffect(() => {
    console.log("Day changed - updating DayDetailView state for day", dayNumber, "with date", date)
    // Reset all state when day changes
    setCurrentDayItinerary(dayItinerary || null)
    setLocations([])
    setPhotos([])
    setExpenses([])
    setActiveTab("locations")
    
    // Then load the data for the new day
    loadDayData()
  }, [dayNumber, date, dayItinerary])

  const ensureDayItinerary = async (): Promise<DayItinerary> => {
    if (currentDayItinerary) {
      return currentDayItinerary
    }

    // Create day itinerary if it doesn't exist
    try {
      console.log("Creating day itinerary for date:", date)
      const newDayItinerary = await itineraryService.createDayItinerary({
        trip_id: tripId,
        date: date,
        notes: null,
      })
      setCurrentDayItinerary(newDayItinerary)
      onDayUpdate()
      return newDayItinerary
    } catch (error: any) {
      console.error("Error creating day itinerary:", error)
      throw error
    }
  }

  const loadDayData = async () => {
    try {
      setError(null)

      if (!currentDayItinerary) {
        // No itinerary exists yet, show empty state
        setLocations([])
        setPhotos([])
        setExpenses([])
        return
      }

      setLoading(true)
      console.log("Loading day data for:", currentDayItinerary.id)

      // Use pre-loaded data if available
      if (currentDayItinerary.locations && currentDayItinerary.photos && currentDayItinerary.expenses) {
        console.log("Using pre-loaded day data")
        setLocations(currentDayItinerary.locations)
        setPhotos(currentDayItinerary.photos)
        setExpenses(currentDayItinerary.expenses)
        return
      }

      // Otherwise fetch fresh data
      const [locationsData, photosData, expensesData] = await Promise.all([
        locationService.getLocationsByDay(currentDayItinerary.id),
        photoService.getPhotos(tripId, currentDayItinerary.id),
        expenseService.getExpenses(currentDayItinerary.id),
      ])

      console.log("Loaded day data:", { locationsData, photosData, expensesData })

      setLocations(locationsData)
      setPhotos(photosData)
      setExpenses(expensesData)
    } catch (error: any) {
      console.error("Error loading day data:", error)
      setError(error.message || "Failed to load day data")
    } finally {
      setLoading(false)
    }
  }

  const handleLocationSaved = async () => {
    setShowLocationModal(false)
    setEditingLocation(null)
    await loadDayData()
    onDayUpdate()
  }

  const handleExpenseSaved = async () => {
    try {
      setShowExpenseModal(false)
      setEditingExpense(null)
      
      // Immediately reload day data for UI refresh
      await loadDayData()
      
      // Then refresh parent components
      onDayUpdate()
      await onDataRefresh() // Refresh trip data including total expenses
    } catch (error: any) {
      console.error("Error refreshing data after expense saved:", error)
      setError(error.message || "Failed to refresh data after saving expense")
    }
  }

  const handlePhotoUploaded = async () => {
    setShowPhotoModal(false)
    await loadDayData()
    onDayUpdate()
  }

  const handleAddLocation = async () => {
    try {
      await ensureDayItinerary()
      setShowLocationModal(true)
    } catch (error: any) {
      setError(error.message || "Failed to create day itinerary")
    }
  }

  const handleAddExpense = async () => {
    try {
      await ensureDayItinerary()
      setShowExpenseModal(true)
    } catch (error: any) {
      setError(error.message || "Failed to create day itinerary")
    }
  }

  const handleAddPhotos = async () => {
    try {
      console.log("Add photos clicked")
      const dayItinerary = await ensureDayItinerary()
      console.log("Day itinerary ensured:", dayItinerary)
      setShowPhotoModal(true)
      console.log("Photo modal should be open now")
    } catch (error: any) {
      console.error("Error in handleAddPhotos:", error)
      setError(error.message || "Failed to create day itinerary")
    }
  }

  const handleDeleteLocation = async (locationId: string) => {
    if (!confirm("Are you sure you want to delete this location?")) return

    try {
      await locationService.deleteLocation(locationId)
      await loadDayData()
      onDayUpdate()
    } catch (error: any) {
      setError(error.message || "Failed to delete location")
    }
  }

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) return

    try {
      setLoading(true)
      const result = await expenseService.deleteExpense(expenseId)
      
      // Update expenses directly with the result
      setExpenses(result.dayExpenses)
      
      // Notify parent components immediately
      onDayUpdate()
      await onDataRefresh() // Refresh trip data including total expenses
    } catch (error: any) {
      console.error("Error deleting expense:", error)
      setError(error.message || "Failed to delete expense")
    } finally {
      setLoading(false)
    }
  }

  const dayTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0)

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Day Header */}
      <div className="border rounded-lg p-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Day {dayNumber} - {format(new Date(date), "EEEE, MMMM d, yyyy")}
            </h3>
            <p className="text-gray-600 mt-1">{currentDayItinerary?.notes || "No notes for this day"}</p>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-green-600">TL {dayTotal.toFixed(2)}</div>
            <p className="text-sm text-gray-600">Total spent</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center mt-4 pt-4 border-t">
          <div>
            <div className="text-lg font-semibold">{locations.length}</div>
            <div className="text-sm text-gray-600">Locations</div>
          </div>
          <div>
            <div className="text-lg font-semibold">{photos.length}</div>
            <div className="text-sm text-gray-600">Photos</div>
          </div>
          <div>
            <div className="text-lg font-semibold">{expenses.length}</div>
            <div className="text-sm text-gray-600">Expenses</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={handleAddLocation} className="flex items-center">
          <MapPin className="mr-2 h-4 w-4" />
          Add Location
        </Button>
        <Button onClick={handleAddPhotos} variant="outline" className="flex items-center bg-transparent">
          <Camera className="mr-2 h-4 w-4" />
          Add Photos
        </Button>
        <Button onClick={handleAddExpense} variant="outline" className="flex items-center bg-transparent">
          <DollarSign className="mr-2 h-4 w-4" />
          Add Expense
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="locations">Locations ({locations.length})</TabsTrigger>
          <TabsTrigger value="photos">Photos ({photos.length})</TabsTrigger>
          <TabsTrigger value="expenses">Expenses ({expenses.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="locations">
          <div className="space-y-4">
            {locations.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No locations yet</h3>
                  <p className="text-gray-600 mb-4">Start planning your day by adding locations to visit.</p>
                  <Button onClick={handleAddLocation}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add First Location
                  </Button>
                </CardContent>
              </Card>
            ) : (
              locations
                .sort((a, b) => a.order_index - b.order_index)
                .map((location, index) => (
                  <LocationCard
                    key={location.id}
                    location={location}
                    index={index}
                    onEdit={() => {
                      setEditingLocation(location)
                      setShowLocationModal(true)
                    }}
                    onDelete={() => handleDeleteLocation(location.id)}
                  />
                ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="photos">
          <DayPhotosSection photos={photos} onPhotoDeleted={loadDayData} onAddPhotos={handleAddPhotos} />
        </TabsContent>

        <TabsContent value="expenses">
          <DayExpensesSection
            expenses={expenses}
            onEditExpense={(expense) => {
              setEditingExpense(expense)
              setShowExpenseModal(true)
            }}
            onDeleteExpense={handleDeleteExpense}
            onAddExpense={handleAddExpense}
          />
        </TabsContent>
      </Tabs>

      {/* Modals - Always render them */}
      <LocationModal
        open={showLocationModal}
        onClose={() => {
          setShowLocationModal(false)
          setEditingLocation(null)
        }}
        dayItinerary={currentDayItinerary}
        location={editingLocation}
        onLocationSaved={handleLocationSaved}
      />

      <ExpenseModal
        open={showExpenseModal}
        onClose={() => {
          setShowExpenseModal(false)
          setEditingExpense(null)
        }}
        dayItinerary={currentDayItinerary}
        expense={editingExpense}
        onExpenseSaved={handleExpenseSaved}
      />

      <PhotoUploadModal
        open={showPhotoModal}
        onClose={() => {
          console.log("Photo modal closing")
          setShowPhotoModal(false)
        }}
        trip={{ id: tripId } as Trip}
        dayItineraryId={currentDayItinerary?.id}
        onPhotoUploaded={handlePhotoUploaded}
      />
    </div>
  )
}
