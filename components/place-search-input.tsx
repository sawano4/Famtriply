"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { googleMapsService } from "@/lib/google-maps"
import type { GooglePlaceResult } from "@/lib/types"

interface PlaceSearchInputProps {
  onPlaceSelect: (place: GooglePlaceResult) => void
  placeholder?: string
  defaultValue?: string
}

export function PlaceSearchInput({ onPlaceSelect, placeholder, defaultValue }: PlaceSearchInputProps) {
  const [query, setQuery] = useState(defaultValue || "")
  const [results, setResults] = useState<GooglePlaceResult[]>([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout>()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const searchPlaces = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      setShowResults(false)
      return
    }

    setLoading(true)
    try {
      const places = await googleMapsService.searchPlaces(searchQuery)
      setResults(places)
      setShowResults(true)
    } catch (error) {
      console.error("Error searching places:", error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (value: string) => {
    setQuery(value)

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Set new timeout for search
    searchTimeoutRef.current = setTimeout(() => {
      searchPlaces(value)
    }, 300)
  }

  const handlePlaceSelect = (place: GooglePlaceResult) => {
    setQuery(place.name)
    setShowResults(false)
    onPlaceSelect(place)
  }

  const getPlaceTypeIcon = (types: string[]) => {
    if (types.includes("restaurant") || types.includes("food")) return "🍽️"
    if (types.includes("tourist_attraction")) return "🎯"
    if (types.includes("lodging")) return "🏨"
    if (types.includes("museum")) return "🏛️"
    if (types.includes("park")) return "🌳"
    if (types.includes("shopping_mall") || types.includes("store")) return "🛍️"
    return "📍"
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={placeholder || "Search for a place..."}
          className="pr-10"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        )}
      </div>

      {showResults && results.length > 0 && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto">
          <CardContent className="p-0">
            {results.map((place, index) => (
              <Button
                key={place.place_id}
                variant="ghost"
                className="w-full justify-start p-3 h-auto text-left hover:bg-gray-50"
                onClick={() => handlePlaceSelect(place)}
              >
                <div className="flex items-start space-x-3">
                  <span className="text-lg">{getPlaceTypeIcon(place.types)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{place.name}</p>
                    <p className="text-sm text-gray-600 truncate">{place.formatted_address}</p>
                  </div>
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      {showResults && results.length === 0 && !loading && query.trim() && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1">
          <CardContent className="p-3 text-center text-gray-500">No places found for "{query}"</CardContent>
        </Card>
      )}
    </div>
  )
}
