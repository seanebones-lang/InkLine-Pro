-- Add storage path columns to tattoo_generations table
-- Migration to support Supabase Storage instead of base64 in database

-- Add new columns for storage paths
ALTER TABLE tattoo_generations 
  ADD COLUMN IF NOT EXISTS image_storage_path TEXT,
  ADD COLUMN IF NOT EXISTS thumbnail_storage_path TEXT;

-- Create index on storage paths for faster lookups
CREATE INDEX IF NOT EXISTS tattoo_generations_image_storage_path_idx 
  ON tattoo_generations(image_storage_path) 
  WHERE image_storage_path IS NOT NULL;

CREATE INDEX IF NOT EXISTS tattoo_generations_thumbnail_storage_path_idx 
  ON tattoo_generations(thumbnail_storage_path) 
  WHERE thumbnail_storage_path IS NOT NULL;

-- Note: image_base64 and thumbnail_base64 columns are kept for backward compatibility
-- They will be gradually migrated to storage paths
