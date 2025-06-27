-- Update locations table to include Google Maps integration and photo
ALTER TABLE locations ADD COLUMN IF NOT EXISTS place_id TEXT;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Update photos table to include photo types
ALTER TABLE photos ADD COLUMN IF NOT EXISTS photo_type TEXT DEFAULT 'general' 
  CHECK (photo_type IN ('trip_cover', 'location', 'souvenir', 'general'));

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  day_itinerary_id UUID REFERENCES day_itineraries(id) ON DELETE CASCADE NOT NULL,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category TEXT DEFAULT 'other' CHECK (category IN ('food', 'transport', 'accommodation', 'activities', 'shopping', 'other')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_expenses_day_itinerary_id ON expenses(day_itinerary_id);
CREATE INDEX IF NOT EXISTS idx_expenses_location_id ON expenses(location_id);
CREATE INDEX IF NOT EXISTS idx_photos_photo_type ON photos(photo_type);

-- Add trigger for expenses updated_at
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create view for day totals
CREATE OR REPLACE VIEW day_totals AS
SELECT 
  di.id as day_itinerary_id,
  di.trip_id,
  di.date,
  COALESCE(SUM(e.amount), 0) as day_total
FROM day_itineraries di
LEFT JOIN expenses e ON di.id = e.day_itinerary_id
GROUP BY di.id, di.trip_id, di.date;

-- Create view for trip totals
CREATE OR REPLACE VIEW trip_totals AS
SELECT 
  t.id as trip_id,
  COALESCE(SUM(e.amount), 0) as total_expenses
FROM trips t
LEFT JOIN day_itineraries di ON t.id = di.trip_id
LEFT JOIN expenses e ON di.id = e.day_itinerary_id
GROUP BY t.id;
