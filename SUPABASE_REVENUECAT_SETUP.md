# Supabase and RevenueCat Integration - Complete Setup

This document outlines the complete integration of Supabase Authentication, RevenueCat subscriptions, paywall gating, and Grok API proxy.

## ✅ Completed Features

### 1. Supabase Authentication
- ✅ Supabase client configuration with SecureStore for token persistence
- ✅ Authentication context (`AuthContext`) with hooks
- ✅ Sign up, sign in, and sign out functionality
- ✅ Profile management utilities
- ✅ Automatic session management and token refresh

### 2. RevenueCat Subscriptions
- ✅ RevenueCat configuration for iOS and Android
- ✅ Subscription context (`SubscriptionContext`) with hooks
- ✅ Offerings and packages fetching
- ✅ Purchase and restore functionality
- ✅ Subscription status checking
- ✅ User ID synchronization with Supabase

### 3. Paywall Gating
- ✅ Paywall component with animated UI
- ✅ Subscription-based route protection (`ProtectedRoute`)
- ✅ Automatic paywall display for premium features
- ✅ Integration in Generate screen (subscription required)
- ✅ Profile screen with subscription status and upgrade option

### 4. Profile Status Handling
- ✅ Profile status utility functions
- ✅ Subscription tier tracking (free, premium, pro)
- ✅ Profile data synchronization between Supabase and RevenueCat
- ✅ Usage analytics ready

### 5. Grok API Proxy (Edge Function)
- ✅ Supabase Edge Function for Grok API proxy
- ✅ Authentication verification
- ✅ API key management (supports white-labeling)
- ✅ Usage logging for analytics
- ✅ Streaming response support
- ✅ CORS handling
- ✅ Client-side API service (`grokApi.ts`)

## File Structure

```
src/
├── config/
│   ├── supabase.ts          # Supabase client configuration
│   └── revenuecat.ts        # RevenueCat configuration
├── contexts/
│   ├── AuthContext.tsx      # Authentication context and hooks
│   └── SubscriptionContext.tsx  # Subscription context and hooks
├── components/
│   ├── AuthScreen.tsx       # Authentication UI
│   ├── Paywall.tsx          # Paywall component
│   └── ProtectedRoute.tsx   # Route protection component
├── screens/
│   ├── GenerateScreen.tsx   # Protected premium feature screen
│   └── ProfileScreen.tsx    # Profile with subscription status
├── services/
│   └── grokApi.ts           # Grok API service client
└── utils/
    └── profileStatus.ts     # Profile status utilities

supabase/
├── functions/
│   └── grok-proxy/
│       ├── index.ts         # Edge Function for Grok proxy
│       └── README.md        # Deployment instructions
└── migrations/
    └── 001_profiles.sql     # Database schema for profiles and usage logs
```

## Setup Instructions

### 1. Environment Variables

Create a `.env` file or set environment variables:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_REVENUECAT_API_KEY_IOS=your_ios_key
EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID=your_android_key
```

### 2. Supabase Database Setup

Run the migration in your Supabase dashboard:

```bash
# Via Supabase Dashboard: SQL Editor
# Or via Supabase CLI:
supabase db push
```

This creates:
- `profiles` table with RLS policies
- `grok_usage_logs` table for analytics
- Automatic timestamp triggers

### 3. Deploy Edge Function

```bash
# Install Supabase CLI
npm install -g supabase

# Login and link project
supabase login
supabase link --project-ref your-project-ref

# Deploy function
supabase functions deploy grok-proxy

# Set environment variable in Supabase dashboard
# Settings > Edge Functions > grok-proxy > Secrets
# Add: GROK_API_KEY=your_grok_api_key
```

### 4. RevenueCat Setup

1. Create products in RevenueCat dashboard
2. Set up entitlements (e.g., "premium", "pro")
3. Configure offerings and packages
4. Add iOS and Android API keys to environment variables

## Usage Examples

### Authentication

```typescript
import { useAuth } from '../contexts/AuthContext';

const MyComponent = () => {
  const { user, signIn, signOut, loading } = useAuth();
  
  // Sign in
  await signIn('email@example.com', 'password');
  
  // Sign out
  await signOut();
};
```

### Subscription Status

```typescript
import { useSubscription } from '../contexts/SubscriptionContext';

const MyComponent = () => {
  const { isSubscribed, offerings, purchaseSubscription } = useSubscription();
  
  // Check subscription
  if (isSubscribed) {
    // Show premium features
  }
  
  // Purchase
  await purchaseSubscription(package);
};
```

### Protected Routes

```typescript
import { ProtectedRoute } from '../components/ProtectedRoute';

// Require authentication
<ProtectedRoute requireSubscription={false}>
  <MyComponent />
</ProtectedRoute>

// Require subscription
<ProtectedRoute requireSubscription={true}>
  <PremiumFeature />
</ProtectedRoute>
```

### Grok API Calls

```typescript
import { grokApi } from '../services/grokApi';

// Regular completion
const response = await grokApi.chatCompletion({
  messages: [
    { role: 'user', content: 'Hello!' }
  ],
  model: 'grok-beta',
});

// Streaming
for await (const chunk of grokApi.chatCompletionStream({
  messages: [{ role: 'user', content: 'Hello!' }],
})) {
  console.log(chunk);
}
```

## Security Features

1. **Authentication**: All API calls require valid Supabase session
2. **RLS Policies**: Database tables protected with Row Level Security
3. **API Key Management**: Grok API key stored securely in Edge Function secrets
4. **Token Storage**: Auth tokens stored in SecureStore
5. **Subscription Verification**: RevenueCat validates all purchases server-side

## White-labeling Support

The Edge Function can be extended to support multiple API keys:

1. Create a `client_api_keys` table in Supabase
2. Store API keys per client/organization
3. Modify Edge Function to lookup key based on user's `client_id`
4. Use appropriate API key for each request

## Next Steps

1. Set up environment variables
2. Run database migrations
3. Deploy Edge Function
4. Configure RevenueCat products
5. Test authentication flow
6. Test subscription flow
7. Test Grok API proxy

## Troubleshooting

- **Auth not working**: Check Supabase URL and anon key
- **Subscriptions not loading**: Verify RevenueCat API keys
- **Grok proxy errors**: Check Edge Function logs and API key configuration
- **Profile creation failing**: Ensure migrations are run and RLS policies are correct
