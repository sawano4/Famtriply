"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from "date-fns"

interface TripDay {
  dayNumber: number
  date: string
  dayItinerary?: any
}

interface DaySelectorProps {
  tripDays: TripDay[]
  selectedDayNumber: number
  onDaySelect: (dayNumber: number) => void
}

export function DaySelector({ tripDays, selectedDayNumber, onDaySelect }: DaySelectorProps) {
  if (!tripDays || tripDays.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No days available for this trip</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <ScrollArea className="w-full whitespace-nowrap rounded-md border max-h-[300px]">
        <div className="flex flex-wrap gap-2 p-4">
          {tripDays.map((day) => {
            const isSelected = selectedDayNumber === day.dayNumber
            const hasItinerary = !!day.dayItinerary
            const locationCount = day.dayItinerary?.locations?.length || 0
            const photoCount = day.dayItinerary?.photos?.length || 0
            const expenseCount = day.dayItinerary?.expenses?.length || 0

            return (
              <Button
                key={day.dayNumber}
                variant={isSelected ? "default" : "outline"}
                onClick={() => onDaySelect(day.dayNumber)}
                className="flex-shrink-0 flex flex-col items-center space-y-1 h-auto py-3 px-4 min-w-[120px]"
              >
                <span className="text-xs font-medium">Day {day.dayNumber}</span>
                <span className="text-sm font-semibold">
                  {(() => {
                    try {
                      return format(new Date(day.date), "MMM d")
                    } catch (e) {
                      console.error("Invalid date format:", day.date)
                      return "Invalid date"
                    }
                  })()}
                </span>
                <div className="text-xs text-muted-foreground space-y-0.5">
                  {hasItinerary ? (
                    <>
                      {locationCount > 0 && (
                        <div>
                          {locationCount} location{locationCount !== 1 ? "s" : ""}
                        </div>
                      )}
                      {photoCount > 0 && (
                        <div>
                          {photoCount} photo{photoCount !== 1 ? "s" : ""}
                        </div>
                      )}
                      {expenseCount > 0 && (
                        <div>
                          {expenseCount} expense{expenseCount !== 1 ? "s" : ""}
                        </div>
                      )}
                      {locationCount === 0 && photoCount === 0 && expenseCount === 0 && (
                        <div className="text-gray-400">Empty</div>
                      )}
                    </>
                  ) : (
                    <div className="text-gray-400">Not planned</div>
                  )}
                </div>
              </Button>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
