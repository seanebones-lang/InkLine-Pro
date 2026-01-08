# Environment Variables Setup

Create a `.env` file in the root directory with the following variables:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# RevenueCat Configuration
EXPO_PUBLIC_REVENUECAT_API_KEY_IOS=your_revenuecat_ios_api_key
EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID=your_revenuecat_android_api_key
```

## Supabase Edge Function Environment Variables

For the Grok proxy Edge Function, set these in your Supabase dashboard under **Settings > Edge Functions**:

- `GROK_API_KEY`: Your xAI Grok API key

The following are automatically available:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anon key

## Getting Your Keys

### Supabase
1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy the Project URL and anon/public key

### RevenueCat
1. Go to RevenueCat dashboard
2. Navigate to Project Settings > API Keys
3. Copy the iOS and Android API keys

### Grok API
1. Go to xAI platform
2. Generate an API key
3. Add it to Supabase Edge Functions environment variables
