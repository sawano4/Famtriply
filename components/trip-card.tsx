"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, DollarSign, MoreHorizontal } from "lucide-react"
import type { Trip } from "@/lib/types"
import { format } from "date-fns"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface TripCardProps {
  trip: Trip
  onView: (trip: Trip) => void
  onEdit: (trip: Trip) => void
  onDelete: (trip: Trip) => void
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

export function TripCard({ trip, onView, onEdit, onDelete }: TripCardProps) {
  const startDate = new Date(trip.start_date)
  const endDate = new Date(trip.end_date)
  const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

  return (
    <Card className="group hover:shadow-lg transition-shadow duration-200 cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1" onClick={() => onView(trip)}>
            <div className="flex items-center justify-between mb-2">
              <Badge className={statusColors[trip.status]}>{statusLabels[trip.status]}</Badge>
            </div>
            <h3 className="font-semibold text-lg text-gray-900 mb-1">{trip.title}</h3>
            <div className="flex items-center text-gray-600 mb-2">
              <MapPin className="h-4 w-4 mr-1" />
              <span className="text-sm">{trip.destination}</span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(trip)}>View Details</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(trip)}>Edit Trip</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(trip)} className="text-red-600">
                Delete Trip
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-0" onClick={() => onView(trip)}>
        {trip.cover_image_url && (
          <div className="mb-4 rounded-lg overflow-hidden">
            <img
              src={trip.cover_image_url || "/placeholder.svg"}
              alt={trip.title}
              className="w-full h-32 object-cover"
            />
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="h-4 w-4 mr-2" />
            <span>
              {format(startDate, "MMM d")} - {format(endDate, "MMM d, yyyy")}
            </span>
            <span className="ml-2 text-gray-400">({duration} days)</span>
          </div>

          {trip.budget && (
            <div className="flex items-center text-sm text-gray-600">
              <DollarSign className="h-4 w-4 mr-2" />
              <span>${trip.budget.toLocaleString()}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
