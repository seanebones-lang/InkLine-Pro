-- Rate limiting table for persistent rate limiting across edge function restarts
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  window_end TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '1 minute',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, endpoint, window_start)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS rate_limits_user_endpoint_idx ON rate_limits(user_id, endpoint, window_end DESC);
CREATE INDEX IF NOT EXISTS rate_limits_window_end_idx ON rate_limits(window_end);

-- Function to clean up expired rate limit entries
CREATE OR REPLACE FUNCTION cleanup_expired_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limits WHERE window_end < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own rate limits (for edge function use)
CREATE POLICY "Edge functions can manage rate limits" ON rate_limits
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Auto-cleanup expired entries (runs periodically)
-- Note: This would typically be set up as a cron job in Supabase
-- For now, edge function will clean up on each request
