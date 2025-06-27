import { supabase } from "./supabase"
import type {
  Trip,
  DayItinerary,
  Location,
  Photo,
  Expense,
  CreateTripData,
  CreateLocationData,
  CreateExpenseData,
} from "./types"

// Helper function to ensure user is authenticated
async function ensureAuthenticated() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error) {
    console.error("Session error:", error)
    throw new Error("Authentication error")
  }

  if (!session?.user) {
    throw new Error("User not authenticated")
  }

  return session.user
}

// Fallback‐safe view/query helper
function isMissingRelation(err: any) {
  // Postgres code 42P01 = undefined_table
  return err?.code === "42P01" || /does not exist/.test(err?.message || "")
}
  
export const tripService = {
  async getTrips(): Promise<Trip[]> {
    await ensureAuthenticated()

    // 1. Fetch all trips for the user
    const { data: trips, error: tripError } = await supabase
      .from("trips")
      .select("*")
      .order("created_at", { ascending: false })

    if (tripError) throw tripError

    if (!trips?.length) return []

    // 2. Fetch totals from the view for only those trip IDs
    const { data: totals, error: totalError } = await supabase
      .from("trip_totals")
      .select("trip_id, total_expenses")
      .in(
        "trip_id",
        trips.map((t) => t.id),
      )

    if (totalError && !isMissingRelation(totalError)) throw totalError

    // Create a map for quick lookup
    const totalMap = new Map(totals?.map((t) => [t.trip_id, t.total_expenses]) || [])

    return trips.map((trip) => ({
      ...trip,
      total_expenses: totalMap.get(trip.id) || 0,
    }))
  },

  async getTripById(id: string): Promise<Trip | null> {
    await ensureAuthenticated()

    // 1. Get the trip
    const { data: trip, error: tripError } = await supabase.from("trips").select("*").eq("id", id).single()

    if (tripError) {
      if (tripError.code === "PGRST116") return null
      throw tripError
    }

    // 2. Get its total
    const { data: totalRow, error: totalError } = await supabase
      .from("trip_totals")
      .select("total_expenses")
      .eq("trip_id", id)
      .single()

    if (totalError && !isMissingRelation(totalError)) {
      throw totalError
    }

    return {
      ...trip,
      total_expenses: totalRow?.total_expenses || 0,
    }
  },

  async createTrip(tripData: CreateTripData): Promise<Trip> {
    const user = await ensureAuthenticated()

    let coverImageUrl = null

    if (tripData.cover_image) {
      const fileExt = tripData.cover_image.name.split(".").pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage.from("trip-covers").upload(fileName, tripData.cover_image)

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from("trip-covers").getPublicUrl(fileName)

      coverImageUrl = publicUrl
    }

    const { data, error } = await supabase
      .from("trips")
      .insert({
        user_id: user.id,
        title: tripData.title,
        destination: tripData.destination,
        start_date: tripData.start_date,
        end_date: tripData.end_date,
        budget: tripData.budget || null,
        cover_image_url: coverImageUrl,
      })
      .select()
      .single()

    if (error) throw error
    return { ...data, total_expenses: 0 }
  },

  async updateTrip(id: string, updates: Partial<Trip>): Promise<Trip> {
    await ensureAuthenticated()

    const { data, error } = await supabase.from("trips").update(updates).eq("id", id).select().single()

    if (error) throw error
    return data
  },

  async deleteTrip(id: string): Promise<void> {
    await ensureAuthenticated()

    const { error } = await supabase.from("trips").delete().eq("id", id)

    if (error) throw error
  },
}

export const itineraryService = {
  async getDayItineraries(tripId: string): Promise<DayItinerary[]> {
    await ensureAuthenticated()

    // 1. Get day itineraries
    const { data: days, error: daysError } = await supabase
      .from("day_itineraries")
      .select("*")
      .eq("trip_id", tripId)
      .order("date", { ascending: true })
      .limit(100) // Increased limit to handle longer trips up to 90 days

    if (daysError) throw daysError

    if (!days?.length) return []

    const dayIds = days.map((d) => d.id)

    // 2. Get locations for all days
    const { data: locations, error: locationsError } = await supabase
      .from("locations")
      .select("*")
      .in("day_itinerary_id", dayIds)
      .order("order_index", { ascending: true })

    if (locationsError) throw locationsError

    // 3. Get photos for all days
    const { data: photos, error: photosError } = await supabase
      .from("photos")
      .select("*")
      .eq("trip_id", tripId)
      .in("day_itinerary_id", dayIds)
      .order("created_at", { ascending: false })

    if (photosError) throw photosError

    // 4. Get expenses for all days
    let expenses: Expense[] | null = []
    try {
      const res = await supabase
        .from("expenses")
        .select("*")
        .in("day_itinerary_id", dayIds)
        .order("created_at", { ascending: false })

      if (res.error && !isMissingRelation(res.error)) throw res.error
      expenses = res.data || []
    } catch (err: any) {
      if (!isMissingRelation(err)) throw err
      // Table/view missing - treat as legacy schema (no expenses yet)
      expenses = []
    }

    // 5. Get day totals
    const { data: dayTotals, error: totalsError } = await supabase
      .from("day_totals")
      .select("day_itinerary_id, day_total")
      .in("day_itinerary_id", dayIds)

    if (totalsError && !isMissingRelation(totalsError)) throw totalsError

    // Create lookup maps
    const locationsMap = new Map<string, Location[]>()
    const photosMap = new Map<string, Photo[]>()
    const expensesMap = new Map<string, Expense[]>()
    const totalsMap = new Map<string, number>()

    locations?.forEach((location) => {
      if (!locationsMap.has(location.day_itinerary_id)) {
        locationsMap.set(location.day_itinerary_id, [])
      }
      locationsMap.get(location.day_itinerary_id)!.push(location)
    })

    photos?.forEach((photo) => {
      if (photo.day_itinerary_id) {
        if (!photosMap.has(photo.day_itinerary_id)) {
          photosMap.set(photo.day_itinerary_id, [])
        }
        photosMap.get(photo.day_itinerary_id)!.push(photo)
      }
    })

    expenses?.forEach((expense) => {
      if (!expensesMap.has(expense.day_itinerary_id)) {
        expensesMap.set(expense.day_itinerary_id, [])
      }
      expensesMap.get(expense.day_itinerary_id)!.push(expense)
    })

    dayTotals?.forEach((total) => {
      totalsMap.set(total.day_itinerary_id, total.day_total || 0)
    })

    // Combine everything
    return days.map((day) => ({
      ...day,
      locations: locationsMap.get(day.id) || [],
      photos: photosMap.get(day.id) || [],
      expenses: expensesMap.get(day.id) || [],
      day_total: totalsMap.get(day.id) || 0,
    }))
  },

  async getDayItinerary(dayId: string): Promise<DayItinerary | null> {
    await ensureAuthenticated()

    // 1. Get the day itinerary
    const { data: day, error: dayError } = await supabase.from("day_itineraries").select("*").eq("id", dayId).single()

    if (dayError) {
      if (dayError.code === "PGRST116") return null
      throw dayError
    }

    // 2. Get locations for this day
    const { data: locations, error: locationsError } = await supabase
      .from("locations")
      .select("*")
      .eq("day_itinerary_id", dayId)
      .order("order_index", { ascending: true })

    if (locationsError) throw locationsError

    // 3. Get photos for this day
    const { data: photos, error: photosError } = await supabase
      .from("photos")
      .select("*")
      .eq("day_itinerary_id", dayId)
      .order("created_at", { ascending: false })

    if (photosError) throw photosError

    // 4. Get expenses for this day
    let expenses: Expense[] | null = []
    try {
      const res = await supabase
        .from("expenses")
        .select("*")
        .eq("day_itinerary_id", dayId)
        .order("created_at", { ascending: false })

      if (res.error && !isMissingRelation(res.error)) throw res.error
      expenses = res.data || []
    } catch (err: any) {
      if (!isMissingRelation(err)) throw err
      expenses = []
    }

    // 5. Get day total
    const { data: dayTotal, error: totalError } = await supabase
      .from("day_totals")
      .select("day_total")
      .eq("day_itinerary_id", dayId)
      .single()

    if (totalError && !isMissingRelation(totalError)) throw totalError

    return {
      ...day,
      locations: locations || [],
      photos: photos || [],
      expenses: expenses || [],
      day_total: dayTotal?.day_total || 0,
    }
  },

  async createDayItinerary(data: { trip_id: string; date: string; notes?: string | null }): Promise<DayItinerary> {
    await ensureAuthenticated()

    const { data: dayItinerary, error } = await supabase.from("day_itineraries").insert(data).select().single()

    if (error) throw error
    return {
      ...dayItinerary,
      locations: [],
      photos: [],
      expenses: [],
      day_total: 0,
    }
  },

  async updateDayItinerary(id: string, updates: { notes?: string }): Promise<DayItinerary> {
    await ensureAuthenticated()

    const { data, error } = await supabase.from("day_itineraries").update(updates).eq("id", id).select().single()

    if (error) throw error
    return data
  },
}

export const locationService = {
  async getLocationsByDay(dayItineraryId: string): Promise<Location[]> {
    await ensureAuthenticated()

    const { data, error } = await supabase
      .from("locations")
      .select("*")
      .eq("day_itinerary_id", dayItineraryId)
      .order("order_index", { ascending: true })

    if (error) throw error
    return data || []
  },

  async createLocation(locationData: CreateLocationData): Promise<Location> {
    const user = await ensureAuthenticated()

    let photoUrl = null

    if (locationData.photo) {
      const fileExt = locationData.photo.name.split(".").pop()
      const fileName = `${user.id}/locations/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage.from("trip-photos").upload(fileName, locationData.photo)

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from("trip-photos").getPublicUrl(fileName)

      photoUrl = publicUrl
    }

    // Remove photo from locationData before sending to database
    const { photo, ...cleanLocationData } = locationData;

    const { data, error } = await supabase
      .from("locations")
      .insert({
        ...cleanLocationData,
        photo_url: photoUrl,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updateLocation(id: string, updates: Partial<CreateLocationData>): Promise<Location> {
    const user = await ensureAuthenticated()
    
    // Handle photo upload if provided
    let photoUrl = undefined
    
    if (updates.photo) {
      // First get the current location to check if there's an existing photo
      const { data: currentLocation } = await supabase
        .from("locations")
        .select("photo_url")
        .eq("id", id)
        .single();
        
      // If there's an existing photo, extract its path to delete it
      if (currentLocation?.photo_url) {
        const urlParts = currentLocation.photo_url.split('/');
        const storagePath = urlParts.slice(urlParts.indexOf('trip-photos') + 1).join('/');
        
        // Try to delete the old photo
        try {
          await supabase.storage.from("trip-photos").remove([storagePath]);
        } catch (err) {
          console.error("Failed to delete old photo:", err);
          // Continue anyway - we'll still upload the new one
        }
      }
      
      // Upload new photo
      const fileExt = updates.photo.name.split(".").pop();
      const fileName = `${user.id}/locations/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("trip-photos")
        .upload(fileName, updates.photo);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("trip-photos").getPublicUrl(fileName);

      photoUrl = publicUrl;
    }

    // Create a clean updates object without the photo property
    const { photo, ...cleanUpdates } = updates;
    
    // Only include photo_url in updates if we uploaded a new photo
    const updateData = photoUrl !== undefined 
      ? { ...cleanUpdates, photo_url: photoUrl } 
      : cleanUpdates;

    // Make sure we don't send any 'photo' field to the database
    // as that column doesn't exist in the schema
    if ('photo' in updateData) {
      delete (updateData as any).photo;
    }

    const { data, error } = await supabase
      .from("locations")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteLocation(id: string): Promise<void> {
    await ensureAuthenticated()

    const { error } = await supabase.from("locations").delete().eq("id", id)

    if (error) throw error
  },

  async reorderLocations(locations: { id: string; order_index: number }[]): Promise<void> {
    await ensureAuthenticated()

    const updates = locations.map(({ id, order_index }) =>
      supabase.from("locations").update({ order_index }).eq("id", id),
    )

    await Promise.all(updates)
  },
}

export const photoService = {
  async getPhotos(tripId: string, dayItineraryId?: string): Promise<Photo[]> {
    await ensureAuthenticated()

    let query = supabase.from("photos").select("*").eq("trip_id", tripId)

    if (dayItineraryId) {
      query = query.eq("day_itinerary_id", dayItineraryId)
    }

    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) throw error
    return data || []
  },

  async uploadPhoto(
    tripId: string,
    file: File,
    options?: {
      dayItineraryId?: string
      locationId?: string
      caption?: string
      photoType?: Photo["photo_type"]
    },
  ): Promise<Photo> {
    const user = await ensureAuthenticated()

    const fileExt = file.name.split(".").pop()
    const fileName = `${user.id}/${tripId}/${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage.from("trip-photos").upload(fileName, file)

    if (uploadError) throw uploadError

    // 🚩 NEW robust insert that works even when `photo_type` is missing
    let data: Photo | null = null

    try {
      // First attempt – assumes the column exists
      const res = await supabase
        .from("photos")
        .insert({
          trip_id: tripId,
          day_itinerary_id: options?.dayItineraryId || null,
          location_id: options?.locationId || null,
          file_path: fileName,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          caption: options?.caption || null,
          photo_type: options?.photoType || "general",
        })
        .select()
        .single()

      if (res.error) throw res.error
      data = res.data as Photo
    } catch (err: any) {
      // 🔁 Fallback when the column doesn't exist
      const missingColumn = err?.code === "42703" || /photo_type.+does not exist/i.test(err?.message || "")

      if (!missingColumn) throw err

      // Retry without the extra column
      const fallback = await supabase
        .from("photos")
        .insert({
          trip_id: tripId,
          day_itinerary_id: options?.dayItineraryId || null,
          location_id: options?.locationId || null,
          file_path: fileName,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          caption: options?.caption || null,
        })
        .select()
        .single()

      if (fallback.error) throw fallback.error
      data = fallback.data as Photo
    }

    return data!
  },

  async deletePhoto(id: string): Promise<void> {
    await ensureAuthenticated()

    const { data: photo, error: fetchError } = await supabase.from("photos").select("file_path").eq("id", id).single()

    if (fetchError) throw fetchError

    const { error: storageError } = await supabase.storage.from("trip-photos").remove([photo.file_path])

    if (storageError) throw storageError

    const { error } = await supabase.from("photos").delete().eq("id", id)

    if (error) throw error
  },

  getPhotoUrl(filePath: string): string {
    const { data } = supabase.storage.from("trip-photos").getPublicUrl(filePath)
    return data.publicUrl
  },
}

export const expenseService = {
  async getExpenses(dayItineraryId: string): Promise<Expense[]> {
    await ensureAuthenticated()

    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("day_itinerary_id", dayItineraryId)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data || []
  },

  async createExpense(expenseData: CreateExpenseData): Promise<{ 
    expense: Expense; 
    dayTotal: number; 
    tripTotal: number;
    dayExpenses: Expense[];
  }> {
    await ensureAuthenticated()

    // 1. Create the expense
    const { data: expense, error } = await supabase
      .from("expenses")
      .insert(expenseData)
      .select()
      .single()
    
    if (error) throw error

    // 2. Get all expenses for the day after adding new one
    const { data: dayExpenses, error: expensesError } = await supabase
      .from("expenses")
      .select("*")
      .eq("day_itinerary_id", expenseData.day_itinerary_id)
      .order("created_at", { ascending: false })
    
    if (expensesError) throw expensesError
    
    // 3. Get the day itinerary to find the trip id
    const { data: dayItinerary, error: dayItineraryError } = await supabase
      .from("day_itineraries")
      .select("trip_id")
      .eq("id", expenseData.day_itinerary_id)
      .single()
      
    if (dayItineraryError) throw dayItineraryError
    
    // 4. Calculate the new day total
    const dayTotal = (dayExpenses || []).reduce((sum, exp) => sum + exp.amount, 0)
    
    // 5. Get the updated trip total
    const { data: tripTotalData, error: tripTotalError } = await supabase
      .from("trip_totals")
      .select("total_expenses")
      .eq("trip_id", dayItinerary.trip_id)
      .single()
      
    if (tripTotalError && !isMissingRelation(tripTotalError)) throw tripTotalError

    // Use the database value or calculate manually if the view isn't available
    const tripTotal = tripTotalData?.total_expenses || await calculateTripTotal(dayItinerary.trip_id)

    return {
      expense,
      dayTotal,
      tripTotal,
      dayExpenses: dayExpenses || [],
    }
  },

  async updateExpense(id: string, updates: Partial<Expense>): Promise<{ 
    expense: Expense; 
    dayTotal: number; 
    tripTotal: number;
    dayExpenses: Expense[];
  }> {
    await ensureAuthenticated()

    // 1. Update the expense
    const { data: expense, error } = await supabase
      .from("expenses")
      .update(updates)
      .eq("id", id)
      .select()
      .single()
    
    if (error) throw error

    // 2. Get all expenses for this day after update
    const { data: dayExpenses, error: expensesError } = await supabase
      .from("expenses")
      .select("*")
      .eq("day_itinerary_id", expense.day_itinerary_id)
      .order("created_at", { ascending: false })
    
    if (expensesError) throw expensesError
    
    // 3. Get the day itinerary to find the trip id
    const { data: dayItinerary, error: dayItineraryError } = await supabase
      .from("day_itineraries")
      .select("trip_id")
      .eq("id", expense.day_itinerary_id)
      .single()
      
    if (dayItineraryError) throw dayItineraryError
    
    // 4. Calculate the new day total
    const dayTotal = (dayExpenses || []).reduce((sum, exp) => sum + exp.amount, 0)
    
    // 5. Get the updated trip total
    const { data: tripTotalData, error: tripTotalError } = await supabase
      .from("trip_totals")
      .select("total_expenses")
      .eq("trip_id", dayItinerary.trip_id)
      .single()
      
    if (tripTotalError && !isMissingRelation(tripTotalError)) throw tripTotalError

    // Use the database value or calculate manually if the view isn't available
    const tripTotal = tripTotalData?.total_expenses || await calculateTripTotal(dayItinerary.trip_id)

    return {
      expense,
      dayTotal,
      tripTotal,
      dayExpenses: dayExpenses || [],
    }
  },

  async deleteExpense(id: string): Promise<{ 
    dayItineraryId: string; 
    dayTotal: number; 
    tripTotal: number;
    dayExpenses: Expense[];
  }> {
    await ensureAuthenticated()

    // 1. Get the expense to know its day_itinerary_id before deletion
    const { data: expense, error: expenseError } = await supabase
      .from("expenses")
      .select("day_itinerary_id")
      .eq("id", id)
      .single()
      
    if (expenseError) throw expenseError
    
    // 2. Delete the expense
    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", id)
      
    if (error) throw error

    // 3. Get all remaining expenses for the day
    const { data: dayExpenses, error: expensesError } = await supabase
      .from("expenses")
      .select("*")
      .eq("day_itinerary_id", expense.day_itinerary_id)
      .order("created_at", { ascending: false })
    
    if (expensesError) throw expensesError

    // 4. Get the day itinerary to find the trip id
    const { data: dayItinerary, error: dayItineraryError } = await supabase
      .from("day_itineraries")
      .select("trip_id")
      .eq("id", expense.day_itinerary_id)
      .single()
      
    if (dayItineraryError) throw dayItineraryError
    
    // 5. Calculate the new day total
    const dayTotal = (dayExpenses || []).reduce((sum, exp) => sum + exp.amount, 0)
    
    // 6. Get the updated trip total
    const { data: tripTotalData, error: tripTotalError } = await supabase
      .from("trip_totals")
      .select("total_expenses")
      .eq("trip_id", dayItinerary.trip_id)
      .single()
      
    if (tripTotalError && !isMissingRelation(tripTotalError)) throw tripTotalError

    // Use the database value or calculate manually if the view isn't available
    const tripTotal = tripTotalData?.total_expenses || await calculateTripTotal(dayItinerary.trip_id)

    return {
      dayItineraryId: expense.day_itinerary_id,
      dayTotal,
      tripTotal,
      dayExpenses: dayExpenses || [],
    }
  },

  async getTripExpenses(tripId: string): Promise<{ dayExpenses: any[]; totalExpenses: number }> {
    await ensureAuthenticated()

    const { data, error } = await supabase
      .from("day_totals")
      .select("*")
      .eq("trip_id", tripId)
      .order("date", { ascending: true })

    if (error) throw error

    const dayExpenses = data || []
    const totalExpenses = dayExpenses.reduce((sum, day) => sum + (day.day_total || 0), 0)

    return { dayExpenses, totalExpenses }
  },

  // Get all expense data for a trip at once for better performance
  async getFullTripExpenseData(tripId: string): Promise<{
    dayTotals: Record<string, number>;
    expensesByDay: Record<string, Expense[]>;
    tripTotal: number;
  }> {
    await ensureAuthenticated()

    // 1. Get all day itineraries for this trip
    const { data: dayItineraries, error: dayItinerariesError } = await supabase
      .from("day_itineraries")
      .select("id, date")
      .eq("trip_id", tripId)
      .order("date", { ascending: true })

    if (dayItinerariesError) throw dayItinerariesError

    if (!dayItineraries || dayItineraries.length === 0) {
      return {
        dayTotals: {},
        expensesByDay: {},
        tripTotal: 0
      }
    }

    // 2. Get all expenses for all days in one query
    const dayIds = dayItineraries.map(day => day.id)
    const { data: allExpenses, error: expensesError } = await supabase
      .from("expenses")
      .select("*")
      .in("day_itinerary_id", dayIds)
      .order("created_at", { ascending: false })

    if (expensesError) throw expensesError

    // 3. Organize expenses by day
    const expensesByDay: Record<string, Expense[]> = {}
    const dayTotals: Record<string, number> = {}

    // Initialize with all days (even empty ones)
    dayItineraries.forEach(day => {
      expensesByDay[day.id] = []
      dayTotals[day.id] = 0
    })

    // Fill in the expenses
    if (allExpenses) {
      allExpenses.forEach(expense => {
        const dayId = expense.day_itinerary_id
        if (!expensesByDay[dayId]) {
          expensesByDay[dayId] = []
        }
        expensesByDay[dayId].push(expense)
        dayTotals[dayId] = (dayTotals[dayId] || 0) + expense.amount
      })
    }

    // 4. Calculate trip total
    const tripTotal = Object.values(dayTotals).reduce((sum, total) => sum + total, 0)

    return {
      dayTotals,
      expensesByDay,
      tripTotal
    }
  }
}

// Helper function to calculate trip total expenses
async function calculateTripTotal(tripId: string): Promise<number> {
  const { data: allDayItineraries, error: dayItinerariesError } = await supabase
    .from("day_itineraries")
    .select("id")
    .eq("trip_id", tripId)

  if (dayItinerariesError) throw dayItinerariesError
  
  if (!allDayItineraries || allDayItineraries.length === 0) {
    return 0
  }
  
  const dayIds = allDayItineraries.map(day => day.id)
  
  const { data: allExpenses, error: expensesError } = await supabase
    .from("expenses")
    .select("amount")
    .in("day_itinerary_id", dayIds)
    
  if (expensesError) throw expensesError
  
  return (allExpenses || []).reduce((sum, expense) => sum + expense.amount, 0)
}
