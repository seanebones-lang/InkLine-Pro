# InkLine Pro Architecture Documentation

**Version:** 1.0.0  
**Last Updated:** January 2026

---

## Overview

InkLine Pro is built with a modern, scalable architecture following React Native and Expo best practices. The application uses an offline-first approach with cloud synchronization, ensuring reliability and performance.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        App.tsx                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Theme      │  │     Auth     │  │ Subscription │      │
│  │  Provider    │  │   Provider    │  │   Provider   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              TabNavigator                            │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │   │
│  │  │  Home    │ │ Generate │ │ History  │ │Profile │ │   │
│  │  │  Screen  │ │  Screen  │ │  Screen  │ │ Screen │ │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └────────┘ │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   AI Service │  │ History      │  │  Print       │      │
│  │              │  │  Service     │  │  Service     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                 │                    │            │
│         ▼                 ▼                    ▼            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Grok API    │  │  Supabase    │  │  Bluetooth   │      │
│  │  Service     │  │  + SQLite    │  │  / WiFi      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Utility Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Circuit     │  │   Health     │  │   Input      │      │
│  │   Breaker     │  │   Check     │  │ Sanitization │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Logger     │  │   Image      │  │   Request    │      │
│  │              │  │   Cache      │  │ Deduplication│      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## Layer Architecture

### 1. Presentation Layer

**Components:**
- `App.tsx` - Root component with providers
- `TabNavigator` - Navigation structure
- Screen components (Home, Generate, History, Profile)
- Reusable components (ErrorBoundary, NetworkIndicator, Paywall)

**Responsibilities:**
- UI rendering
- User interaction handling
- State presentation
- Accessibility

---

### 2. Context Layer

**Contexts:**
- `ThemeContext` - Dark mode and theming
- `AuthContext` - Authentication state
- `SubscriptionContext` - Subscription management

**Responsibilities:**
- Global state management
- Cross-component communication
- Provider pattern implementation

---

### 3. Service Layer

**Services:**
- `aiService.ts` - AI generation pipeline
- `historyService.ts` - Data persistence and sync
- `printService.ts` - Printing functionality
- `grokApi.ts` - Grok API client

**Responsibilities:**
- Business logic
- API communication
- Data transformation
- Error handling

---

### 4. Utility Layer

**Utilities:**
- `circuitBreaker.ts` - Fault tolerance
- `healthCheck.ts` - Service monitoring
- `inputSanitization.ts` - Security
- `logger.ts` - Logging
- `imageCache.ts` - Image optimization
- `requestDeduplication.ts` - Performance

**Responsibilities:**
- Cross-cutting concerns
- Reusable functionality
- Performance optimization
- Security utilities

---

## Data Flow

### Generation Flow

```
User Input (GenerateScreen)
    ↓
Input Sanitization
    ↓
AI Service (generateTattooDesignWithLineart)
    ↓
Circuit Breaker Check
    ↓
Grok API (via Supabase Proxy)
    ↓
Hugging Face Lineart Processing
    ↓
Result Processing
    ↓
History Service (saveGenerationLocally)
    ↓
SQLite (Local) + Supabase (Cloud Sync)
    ↓
UI Update (Display Result)
```

### Sync Flow

```
Local SQLite Database
    ↓
History Service (syncAllToSupabase)
    ↓
Circuit Breaker Check
    ↓
Supabase API
    ↓
Cloud Database
    ↓
Sync Status Update
```

---

## Key Design Patterns

### 1. Offline-First Architecture

- **Local-first**: All data stored in SQLite
- **Background sync**: Automatic sync to Supabase
- **Conflict resolution**: Last-write-wins strategy
- **Graceful degradation**: App works without network

### 2. Circuit Breaker Pattern

- **Purpose**: Prevent cascading failures
- **Implementation**: `circuitBreaker.ts`
- **States**: CLOSED → OPEN → HALF_OPEN
- **Benefits**: Fast failure detection, automatic recovery

### 3. Retry with Exponential Backoff

- **Purpose**: Handle transient failures
- **Implementation**: `useApiWithRetry` hook
- **Strategy**: Exponential delay between retries
- **Benefits**: Improved reliability, reduced server load

### 4. Request Deduplication

- **Purpose**: Prevent duplicate API calls
- **Implementation**: `requestDeduplication.ts`
- **Strategy**: Cache in-flight requests
- **Benefits**: Reduced network usage, faster responses

### 5. Memoization

- **Purpose**: Optimize re-renders
- **Implementation**: `useMemo`, `useCallback`
- **Strategy**: Cache expensive computations
- **Benefits**: Better performance, reduced CPU usage

---

## Security Architecture

### Authentication Flow

```
User Credentials
    ↓
Supabase Auth
    ↓
JWT Token (SecureStore)
    ↓
API Requests (Bearer Token)
    ↓
Supabase RLS Policies
    ↓
Data Access
```

### Data Protection

- **Encryption at Rest**: SecureStore for tokens
- **Encryption in Transit**: HTTPS/TLS
- **Input Sanitization**: XSS prevention
- **Rate Limiting**: DoS protection
- **Row Level Security**: Database-level access control

---

## Performance Optimizations

### Image Handling

- **Caching**: expo-image with memory+disk cache
- **Compression**: Automatic image optimization
- **Progressive Loading**: Async image loading
- **Thumbnails**: Smaller previews for lists

### Database Optimization

- **Prepared Statements**: Faster queries
- **Indexes**: Optimized lookups
- **Pagination**: Efficient data loading
- **Connection Pooling**: Reused connections

### Network Optimization

- **Request Deduplication**: Prevent duplicates
- **Circuit Breaker**: Fast failure
- **Retry Logic**: Handle transient errors
- **Timeout Handling**: Prevent hanging requests

---

## Error Handling Strategy

### Error Boundaries

- **App-level**: Catches all React errors
- **Component-level**: Isolated error handling
- **Recovery**: Automatic retry mechanisms

### Error Types

1. **Network Errors**: Retry with backoff
2. **Authentication Errors**: Redirect to login
3. **Validation Errors**: User-friendly messages
4. **System Errors**: Logged and reported

---

## Testing Strategy

### Unit Tests

- Services: Business logic
- Utilities: Helper functions
- Hooks: Custom hooks

### Integration Tests

- Service interactions
- Context providers
- Navigation flows

### E2E Tests

- Critical user flows
- Authentication
- Generation pipeline

---

## Deployment Architecture

### Build Process

```
Source Code
    ↓
TypeScript Compilation
    ↓
Metro Bundler
    ↓
Code Splitting
    ↓
EAS Build
    ↓
iOS/Android Apps
```

### Environment Management

- **Development**: Local development
- **Preview**: Internal testing
- **Production**: App stores

---

## Scalability Considerations

### Current Capacity

- **Users**: Designed for 10,000+ concurrent users
- **Generations**: 100+ per minute
- **Storage**: Scalable with Supabase

### Future Scaling

- **Horizontal Scaling**: Multiple instances
- **CDN**: Static asset delivery
- **Database Sharding**: If needed
- **Caching Layer**: Redis integration

---

## Monitoring & Observability

### Health Checks

- **Automatic**: Every 60 seconds
- **Services**: Supabase, Grok API, Database
- **Metrics**: Response time, status

### Logging

- **Development**: Full logging
- **Production**: Errors and warnings only
- **Crash Reporting**: Integrated (ready for Sentry)

### Metrics

- **Performance**: Response times
- **Reliability**: Success rates
- **Usage**: Feature adoption

---

## Technology Stack

### Core

- **React Native**: 0.79.0
- **Expo**: SDK 54
- **TypeScript**: 5.7.0
- **React**: 19.0.0

### Backend

- **Supabase**: Database, Auth, Storage
- **Edge Functions**: Grok API proxy

### AI

- **Grok Vision API**: Image generation
- **Hugging Face**: Lineart processing

### State Management

- **React Context**: Global state
- **SQLite**: Local state

### Styling

- **NativeWind**: Tailwind for React Native
- **Reanimated**: Animations

---

## Future Enhancements

### Planned

- React 19 upgrade
- GraphQL API
- Real-time collaboration
- Advanced analytics

### Under Consideration

- WebAssembly for performance
- Edge AI optimization
- Quantum-resistant encryption
- Multi-region deployment

---

**For implementation details, see source code with JSDoc comments.**
