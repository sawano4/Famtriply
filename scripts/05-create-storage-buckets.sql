-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('trip-photos', 'trip-photos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('trip-covers', 'trip-covers', true);

-- Create storage policies for trip-photos
CREATE POLICY "Users can upload photos to own folder" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'trip-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view photos in own folder" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'trip-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete photos in own folder" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'trip-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create storage policies for trip-covers
CREATE POLICY "Users can upload covers to own folder" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'trip-covers' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view covers in own folder" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'trip-covers' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete covers in own folder" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'trip-covers' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
