import type { GooglePlaceResult } from "./types" // Assuming GooglePlaceResult is defined in a separate file
import type { google } from "google-maps"

// Helper – always use the runtime Google Maps object on window
function gm() {
  if (typeof window === "undefined" || !("google" in window)) {
    throw new Error("Google Maps JS SDK not loaded")
  }
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return (window as any).google as typeof google
}

export class GoogleMapsService {
  private static instance: GoogleMapsService
  private isLoaded = false
  private loadPromise: Promise<void> | null = null

  static getInstance(): GoogleMapsService {
    if (!GoogleMapsService.instance) {
      GoogleMapsService.instance = new GoogleMapsService()
    }
    return GoogleMapsService.instance
  }

  async loadGoogleMaps(): Promise<void> {
    if (this.isLoaded) return

    if (this.loadPromise) {
      return this.loadPromise
    }

    this.loadPromise = new Promise((resolve, reject) => {
      if (typeof window === "undefined") {
        reject(new Error("Google Maps can only be loaded in browser"))
        return
      }

      if (window.google && window.google.maps) {
        this.isLoaded = true
        resolve()
        return
      }

      const script = document.createElement("script")
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`
      script.async = true
      script.defer = true

      script.onload = () => {
        this.isLoaded = true
        resolve()
      }

      script.onerror = () => {
        reject(new Error("Failed to load Google Maps"))
      }

      document.head.appendChild(script)
    })

    return this.loadPromise
  }

  async searchPlaces(query: string, location?: { lat: number; lng: number }): Promise<GooglePlaceResult[]> {
    await this.loadGoogleMaps()

    return new Promise((resolve, reject) => {
      if (!gm().maps.places) {
        reject(new Error("Google Places library not available – make sure `libraries=places` is in the JS URL"))
        return
      }

      const service = new gm().maps.places.PlacesService(document.createElement("div"))

      const request: google.maps.places.TextSearchRequest = {
        query,
        ...(location && { location: new gm().maps.LatLng(location.lat, location.lng), radius: 50000 }),
      }

      service.textSearch(request, (results, status) => {
        if (status === gm().maps.places.PlacesServiceStatus.OK && results) {
          const places: GooglePlaceResult[] = results.map((place) => ({
            place_id: place.place_id!,
            name: place.name!,
            formatted_address: place.formatted_address!,
            geometry: {
              location: {
                lat: place.geometry!.location!.lat(),
                lng: place.geometry!.location!.lng(),
              },
            },
            photos: place.photos?.map((photo) => ({
              photo_reference: photo.getUrl({ maxWidth: 400 }),
            })),
            types: place.types || [],
          }))
          resolve(places)
        } else {
          reject(new Error("Places search failed"))
        }
      })
    })
  }

  async getPlaceDetails(placeId: string): Promise<GooglePlaceResult> {
    await this.loadGoogleMaps()

    return new Promise((resolve, reject) => {
      if (!gm().maps.places) {
        reject(new Error("Google Places library not available – make sure `libraries=places` is in the JS URL"))
        return
      }

      const service = new gm().maps.places.PlacesService(document.createElement("div"))

      service.getDetails(
        {
          placeId,
          fields: ["place_id", "name", "formatted_address", "geometry", "photos", "types"],
        },
        (place, status) => {
          if (status === gm().maps.places.PlacesServiceStatus.OK && place) {
            resolve({
              place_id: place.place_id!,
              name: place.name!,
              formatted_address: place.formatted_address!,
              geometry: {
                location: {
                  lat: place.geometry!.location!.lat(),
                  lng: place.geometry!.location!.lng(),
                },
              },
              photos: place.photos?.map((photo) => ({
                photo_reference: photo.getUrl({ maxWidth: 400 }),
              })),
              types: place.types || [],
            })
          } else {
            reject(new Error("Place details not found"))
          }
        },
      )
    })
  }
}

export const googleMapsService = GoogleMapsService.getInstance()
