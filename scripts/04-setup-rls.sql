-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE day_itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Trips policies
CREATE POLICY "Users can view own trips" ON trips
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trips" ON trips
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trips" ON trips
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own trips" ON trips
  FOR DELETE USING (auth.uid() = user_id);

-- Day itineraries policies
CREATE POLICY "Users can view day itineraries of own trips" ON day_itineraries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM trips 
      WHERE trips.id = day_itineraries.trip_id 
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert day itineraries for own trips" ON day_itineraries
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM trips 
      WHERE trips.id = day_itineraries.trip_id 
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update day itineraries of own trips" ON day_itineraries
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM trips 
      WHERE trips.id = day_itineraries.trip_id 
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete day itineraries of own trips" ON day_itineraries
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM trips 
      WHERE trips.id = day_itineraries.trip_id 
      AND trips.user_id = auth.uid()
    )
  );

-- Locations policies
CREATE POLICY "Users can view locations of own trips" ON locations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM day_itineraries 
      JOIN trips ON trips.id = day_itineraries.trip_id
      WHERE day_itineraries.id = locations.day_itinerary_id 
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert locations for own trips" ON locations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM day_itineraries 
      JOIN trips ON trips.id = day_itineraries.trip_id
      WHERE day_itineraries.id = locations.day_itinerary_id 
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update locations of own trips" ON locations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM day_itineraries 
      JOIN trips ON trips.id = day_itineraries.trip_id
      WHERE day_itineraries.id = locations.day_itinerary_id 
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete locations of own trips" ON locations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM day_itineraries 
      JOIN trips ON trips.id = day_itineraries.trip_id
      WHERE day_itineraries.id = locations.day_itinerary_id 
      AND trips.user_id = auth.uid()
    )
  );

-- Photos policies
CREATE POLICY "Users can view photos of own trips" ON photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM trips 
      WHERE trips.id = photos.trip_id 
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert photos for own trips" ON photos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM trips 
      WHERE trips.id = photos.trip_id 
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update photos of own trips" ON photos
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM trips 
      WHERE trips.id = photos.trip_id 
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete photos of own trips" ON photos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM trips 
      WHERE trips.id = photos.trip_id 
      AND trips.user_id = auth.uid()
    )
  );
