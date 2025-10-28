-- Create storage bucket for submission documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('submissions', 'submissions', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files to their own submission folders
CREATE POLICY "Users can upload submission files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'submissions' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM submissions WHERE user_id = auth.uid()
  )
);

-- Allow authenticated users to read their own submission files
CREATE POLICY "Users can view their own submission files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'submissions' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM submissions WHERE user_id = auth.uid()
  )
);

-- Allow admins to view all submission files
CREATE POLICY "Admins can view all submission files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'submissions' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Allow public read access (for viewing documents in reviews)
CREATE POLICY "Public can view submission files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'submissions');
