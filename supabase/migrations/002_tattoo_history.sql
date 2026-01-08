-- Create tattoo_generations table for storing generation history
CREATE TABLE IF NOT EXISTS tattoo_generations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  description TEXT,
  image_base64 TEXT,
  svg_content TEXT,
  thumbnail_base64 TEXT,
  width INTEGER DEFAULT 2400,
  height INTEGER DEFAULT 2400,
  dpi INTEGER DEFAULT 300,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS tattoo_generations_user_id_idx ON tattoo_generations(user_id);
CREATE INDEX IF NOT EXISTS tattoo_generations_created_at_idx ON tattoo_generations(created_at DESC);
CREATE INDEX IF NOT EXISTS tattoo_generations_description_idx ON tattoo_generations USING gin(to_tsvector('english', description));

-- Enable Row Level Security
ALTER TABLE tattoo_generations ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read their own generations
CREATE POLICY "Users can read own generations" ON tattoo_generations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy for users to insert their own generations
CREATE POLICY "Users can insert own generations" ON tattoo_generations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy for users to update their own generations
CREATE POLICY "Users can update own generations" ON tattoo_generations
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policy for users to delete their own generations
CREATE POLICY "Users can delete own generations" ON tattoo_generations
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_tattoo_generations_updated_at
  BEFORE UPDATE ON tattoo_generations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
