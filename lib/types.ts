export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Trip {
  id: string
  user_id: string
  title: string
  destination: string
  start_date: string
  end_date: string
  budget: number | null
  cover_image_url: string | null
  status: "planning" | "ongoing" | "completed"
  created_at: string
  updated_at: string
  total_expenses?: number
}

export interface DayItinerary {
  id: string
  trip_id: string
  date: string
  notes: string | null
  created_at: string
  updated_at: string
  locations?: Location[]
  photos?: Photo[]
  expenses?: Expense[]
  day_total?: number
}

export interface Location {
  id: string
  day_itinerary_id: string
  name: string
  address: string | null
  type: "restaurant" | "attraction" | "hotel" | "activity" | "other"
  visit_time: string | null
  estimated_cost: number | null
  actual_cost: number | null
  latitude: number | null
  longitude: number | null
  place_id: string | null
  notes: string | null
  order_index: number
  photo_url: string | null
  created_at: string
  updated_at: string
}

export interface Photo {
  id: string
  trip_id: string
  day_itinerary_id: string | null
  location_id: string | null
  file_path: string
  file_name: string
  file_size: number | null
  mime_type: string | null
  caption: string | null
  photo_type: "trip_cover" | "location" | "souvenir" | "general"
  created_at: string
  updated_at: string
}

export interface Expense {
  id: string
  day_itinerary_id: string
  location_id: string | null
  description: string
  amount: number
  category: "food" | "transport" | "accommodation" | "activities" | "shopping" | "other"
  created_at: string
  updated_at: string
}

export interface CreateTripData {
  title: string
  destination: string
  start_date: string
  end_date: string
  budget?: number
  cover_image?: File
}

export interface CreateLocationData {
  day_itinerary_id: string
  name: string
  address?: string
  type: Location["type"]
  visit_time?: string
  estimated_cost?: number
  latitude?: number
  longitude?: number
  place_id?: string
  notes?: string
  photo?: File
}

export interface CreateExpenseData {
  day_itinerary_id: string
  location_id?: string
  description: string
  amount: number
  category: Expense["category"]
}

export interface GooglePlaceResult {
  place_id: string
  name: string
  formatted_address: string
  geometry: {
    location: {
      lat: number
      lng: number
    }
  }
  photos?: Array<{
    photo_reference: string
  }>
  types: string[]
}
