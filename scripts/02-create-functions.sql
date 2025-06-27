-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create day itineraries when trip is created
CREATE OR REPLACE FUNCTION create_day_itineraries()
RETURNS TRIGGER AS $$
DECLARE
  current_date DATE;
BEGIN
  current_date := NEW.start_date;
  
  WHILE current_date <= NEW.end_date LOOP
    INSERT INTO day_itineraries (trip_id, date)
    VALUES (NEW.id, current_date);
    
    current_date := current_date + INTERVAL '1 day';
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
