-- Enable RLS on expenses table
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Expenses policies
CREATE POLICY "Users can view expenses of own trips" ON expenses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM day_itineraries di
      JOIN trips t ON t.id = di.trip_id
      WHERE di.id = expenses.day_itinerary_id 
      AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert expenses for own trips" ON expenses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM day_itineraries di
      JOIN trips t ON t.id = di.trip_id
      WHERE di.id = expenses.day_itinerary_id 
      AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update expenses of own trips" ON expenses
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM day_itineraries di
      JOIN trips t ON t.id = di.trip_id
      WHERE di.id = expenses.day_itinerary_id 
      AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete expenses of own trips" ON expenses
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM day_itineraries di
      JOIN trips t ON t.id = di.trip_id
      WHERE di.id = expenses.day_itinerary_id 
      AND t.user_id = auth.uid()
    )
  );
