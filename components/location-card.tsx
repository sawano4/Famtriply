"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock, Edit, Trash2, ExternalLink } from "lucide-react"
import type { Location } from "@/lib/types"

interface LocationCardProps {
  location: Location
  index: number
  onEdit: () => void
  onDelete: () => void
}

const locationTypeColors = {
  restaurant: "bg-red-100 text-red-800",
  attraction: "bg-blue-100 text-blue-800",
  hotel: "bg-purple-100 text-purple-800",
  activity: "bg-green-100 text-green-800",
  other: "bg-gray-100 text-gray-800",
}

const locationTypeLabels = {
  restaurant: "Restaurant",
  attraction: "Attraction",
  hotel: "Hotel",
  activity: "Activity",
  other: "Other",
}

export function LocationCard({ location, index, onEdit, onDelete }: LocationCardProps) {
  const openInMaps = () => {
    if (location.address && location.address.startsWith("http")) {
      // If address contains a Google Maps link, open it directly
      window.open(location.address, "_blank")
    } else if (location.address) {
      // Otherwise, search for the address
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.address)}`
      window.open(url, "_blank")
    }
  }

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start space-x-4">
          {/* Order Number */}
          <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
            {index + 1}
          </div>

          {/* Location Photo */}
          {location.photo_url && (
            <div className="flex-shrink-0">
              <img
                src={location.photo_url || "/placeholder.svg"}
                alt={location.name}
                className="w-24 h-24 object-cover rounded-lg"
              />
            </div>
          )}

          {/* Location Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="font-medium text-gray-900 truncate">{location.name}</h4>
                  <Badge className={locationTypeColors[location.type]} variant="secondary">
                    {locationTypeLabels[location.type]}
                  </Badge>
                </div>

                {location.address && (
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                    <span className="truncate">
                      {location.address.startsWith("http") ? "Maps Link Available" : location.address}
                    </span>
                    <Button variant="ghost" size="sm" className="ml-2 h-6 w-6 p-0" onClick={openInMaps}>
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                )}

                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  {location.visit_time && (
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {location.visit_time}
                    </div>
                  )}
                </div>

                {location.notes && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{location.notes}</p>}
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="sm" onClick={onEdit}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={onDelete} className="text-red-600 hover:text-red-700">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
