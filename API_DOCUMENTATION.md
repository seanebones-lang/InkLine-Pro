# InkLine Pro API Documentation

**Version:** 1.0.0  
**Last Updated:** January 2026

---

## Table of Contents

- [Services](#services)
- [Utilities](#utilities)
- [Hooks](#hooks)
- [Contexts](#contexts)
- [Components](#components)

---

## Services

### AI Service (`src/services/aiService.ts`)

#### `processImageForAPI(imageUri, maxWidth?, maxHeight?, quality?)`

Compresses and resizes images for API efficiency while maintaining quality.

**Parameters:**
- `imageUri` (string): URI of the image to process
- `maxWidth` (number, optional): Maximum width (default: 2048)
- `maxHeight` (number, optional): Maximum height (default: 2048)
- `quality` (number, optional): Compression quality 0-1 (default: 0.9)

**Returns:** `Promise<string>` - Processed image URI

**Throws:** Error if image processing fails

---

#### `imageUriToBase64(imageUri)`

Converts image URI to base64 string for API transmission.

**Parameters:**
- `imageUri` (string): URI of the image (file://, http://, or data:)

**Returns:** `Promise<string>` - Base64 encoded image

**Throws:** Error if conversion fails

---

#### `generateTattooDesign(options, retries?)`

Calls Grok Vision API via Supabase proxy with retry logic and exponential backoff.

**Parameters:**
- `options` (ImageGenerationOptions): Generation options
  - `description?` (string): Text description (sanitized automatically)
  - `imageUri?` (string): Reference image URI
  - `highRes?` (boolean): Enable high-resolution output
- `retries` (number, optional): Number of retry attempts (default: 3)

**Returns:** `Promise<string>` - Base64 encoded generated image

**Throws:** Error if generation fails after all retries

**Features:**
- Automatic input sanitization
- Retry logic with exponential backoff
- Request timeout (60 seconds)
- Circuit breaker protection

---

#### `processLineart(imageBase64, model?)`

Processes image through Hugging Face ControlNet lineart model.

**Parameters:**
- `imageBase64` (string): Base64 encoded image
- `model` (string, optional): Model name (default: 'lllyasviel/control_v11p_sd15_lineart')

**Returns:** `Promise<string>` - Enhanced base64 image

**Throws:** Error if processing fails

**Features:**
- Automatic retry on 503 errors
- Respects Retry-After headers

---

#### `generateTattooDesignWithLineart(options)`

Main function to generate tattoo design with full pipeline.

**Parameters:**
- `options` (ImageGenerationOptions): Generation options

**Returns:** `Promise<{ svg: string; base64: string }>` - SVG and base64 image

**Pipeline:**
1. Process input image (if provided)
2. Generate design with Grok Vision
3. Process through Hugging Face lineart model
4. Convert to SVG format

---

### History Service (`src/services/historyService.ts`)

#### `saveGenerationLocally(generation)`

Saves generation to local SQLite database (offline-first).

**Parameters:**
- `generation` (Omit<TattooGeneration, 'id' | 'created_at' | 'updated_at'>): Generation data

**Returns:** `Promise<string>` - Generated ID

**Features:**
- Automatic thumbnail creation
- Background sync to Supabase
- Prepared statement optimization

---

#### `getGenerations(page?, pageSize?, searchQuery?)`

Gets generations with pagination (tries Supabase first, falls back to local).

**Parameters:**
- `page` (number, optional): Page number (default: 0)
- `pageSize` (number, optional): Items per page (default: 20)
- `searchQuery` (string, optional): Search filter

**Returns:** `Promise<{ data: TattooGeneration[]; hasMore: boolean }>`

**Features:**
- Automatic fallback to local storage
- Circuit breaker protection
- Search functionality

---

#### `deleteGeneration(id)`

Deletes generation from both local and Supabase.

**Parameters:**
- `id` (string): Generation ID

**Returns:** `Promise<void>`

---

#### `syncAllToSupabase()`

Syncs all unsynced local generations to Supabase.

**Returns:** `Promise<void>`

---

### Grok API Service (`src/services/grokApi.ts`)

#### `chatCompletion(options)`

Sends chat completion request to Grok API via proxy.

**Parameters:**
- `options` (GrokRequestOptions): Request options

**Returns:** `Promise<GrokResponse>`

**Features:**
- Request deduplication
- Automatic authentication
- Error handling

---

## Utilities

### Input Sanitization (`src/utils/inputSanitization.ts`)

#### `sanitizeTextInput(input)`

Sanitizes text input to prevent XSS attacks.

**Parameters:**
- `input` (string): Text to sanitize

**Returns:** `string` - Sanitized text

**Removes:**
- Script tags
- Event handlers
- JavaScript: URLs
- HTML tags

---

#### `sanitizeDescription(description)`

Validates and sanitizes description input.

**Parameters:**
- `description` (string): Description text

**Returns:** `string` - Sanitized description (max 5000 chars)

---

#### `isValidEmail(email)`

Validates email format.

**Parameters:**
- `email` (string): Email to validate

**Returns:** `boolean`

---

#### `validatePassword(password)`

Validates password strength.

**Parameters:**
- `password` (string): Password to validate

**Returns:** `{ valid: boolean; errors: string[] }`

**Requirements:**
- Minimum 8 characters
- Maximum 128 characters
- At least one lowercase letter
- At least one uppercase letter
- At least one number
- Not a common password

---

### Circuit Breaker (`src/utils/circuitBreaker.ts`)

#### `CircuitBreaker.execute(fn, fallback?)`

Executes function with circuit breaker protection.

**Parameters:**
- `fn` (() => Promise<T>): Function to execute
- `fallback?` (() => Promise<T> | T): Fallback function

**Returns:** `Promise<T>`

**States:**
- CLOSED: Normal operation
- OPEN: Service down, reject immediately
- HALF_OPEN: Testing recovery

**Configuration:**
- Grok API: 5 failures → 60s reset → 2 successes
- Supabase: 3 failures → 30s reset → 2 successes

---

### Health Check (`src/utils/healthCheck.ts`)

#### `performHealthCheck()`

Performs comprehensive health check of all services.

**Returns:** `Promise<HealthStatus>`

**Checks:**
- Supabase (database + auth)
- Grok API (via proxy)
- Local SQLite database

---

#### `startHealthChecks(intervalMs?)`

Starts periodic health checks.

**Parameters:**
- `intervalMs` (number, optional): Check interval (default: 60000)

---

### Logger (`src/utils/logger.ts`)

#### `logger.log(...args)`

Logs informational messages (dev only).

#### `logger.info(...args)`

Logs informational messages.

#### `logger.warn(...args)`

Logs warning messages (always logged).

#### `logger.error(...args)`

Logs error messages (always logged, sent to crash reporting in production).

#### `logger.debug(...args)`

Logs debug messages (dev only).

---

## Hooks

### `useApiWithRetry()` (`src/hooks/useApiWithRetry.ts`)

Custom hook for API calls with automatic retry logic.

**Returns:**
- `fetchWithRetry(url, options?, retryOptions?)`: Fetch with retry
- `cancelAllRequests()`: Cancel all pending requests

**Features:**
- Exponential backoff
- Request timeout
- Automatic cancellation on unmount

---

### `useNetworkStatus()` (`src/hooks/useNetworkStatus.ts`)

Monitors network connectivity status.

**Returns:** `NetworkStatus`
- `isConnected`: boolean
- `isInternetReachable`: boolean | null
- `type`: string
- `details`: unknown

---

## Contexts

### `AuthContext` (`src/contexts/AuthContext.tsx`)

Provides authentication state and methods.

**Methods:**
- `signUp(email, password)`: Sign up new user
- `signIn(email, password)`: Sign in existing user
- `signOut()`: Sign out current user
- `updateProfile(updates)`: Update user profile

**State:**
- `session`: Current session
- `user`: Current user
- `loading`: Loading state

---

### `SubscriptionContext` (`src/contexts/SubscriptionContext.tsx`)

Provides subscription state and methods.

**Methods:**
- `refreshSubscription()`: Refresh subscription status
- `purchaseSubscription(pkg)`: Purchase subscription
- `restoreSubscription()`: Restore purchases

**State:**
- `isSubscribed`: Subscription status
- `offerings`: Available offerings
- `customerInfo`: Customer information

---

## Components

### `ErrorBoundary` (`src/components/ErrorBoundary.tsx`)

Catches React errors and prevents app crashes.

**Props:**
- `children`: ReactNode
- `fallback?`: Custom fallback component
- `onError?`: Error handler callback

---

### `ProtectedRoute` (`src/components/ProtectedRoute.tsx`)

Protects routes requiring authentication/subscription.

**Props:**
- `requireSubscription?`: boolean
- `children`: ReactNode

---

### `NetworkIndicator` (`src/components/NetworkIndicator.tsx`)

Displays network status indicator.

**Features:**
- Animated appearance
- Accessibility support
- Auto-hide when online

---

## Error Handling

All services use consistent error handling:

1. **Input Validation**: Sanitize and validate inputs
2. **Retry Logic**: Automatic retries with exponential backoff
3. **Circuit Breaker**: Prevent cascading failures
4. **Graceful Degradation**: Fallback mechanisms
5. **Error Logging**: Comprehensive error logging

---

## Security

- All user inputs are sanitized
- API keys stored server-side only
- Rate limiting on edge functions
- Request size limits
- CORS protection
- Row Level Security (RLS) on database

---

## Performance

- Image caching with expo-image
- Request deduplication
- SQLite prepared statements
- Component memoization
- Progressive loading
- Request cancellation

---

**For more details, see inline JSDoc comments in source files.**
