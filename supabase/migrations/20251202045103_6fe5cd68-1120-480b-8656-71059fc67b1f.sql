-- Fix RLS policy for property_documents to allow uploads
DROP POLICY IF EXISTS "Users can manage their own property documents" ON property_documents;

CREATE POLICY "Users can manage their own property documents"
ON property_documents
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add purpose field to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS purpose TEXT;

-- Update storage policies for property-images bucket
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can upload property images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view property images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own property images" ON storage.objects;

CREATE POLICY "Users can upload property images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'property-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view property images"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'property-images');

CREATE POLICY "Users can delete own property images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'property-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);