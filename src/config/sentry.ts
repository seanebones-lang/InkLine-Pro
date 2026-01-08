/**
 * Sentry Configuration
 * 
 * Error tracking and crash reporting for production
 * 
 * @module sentry
 */

import * as Sentry from '@sentry/react-native';

let isInitialized = false;

/**
 * Initialize Sentry
 * Call this in App.tsx before rendering
 */
export function initSentry(dsn?: string): void {
  if (isInitialized) {
    return;
  }

  // Only initialize in production or if DSN is provided
  const shouldInit = __DEV__ === false || dsn;

  if (!shouldInit || !dsn) {
    // In development, just log that Sentry is disabled
    if (__DEV__) {
      console.log('[Sentry] Disabled in development mode');
    }
    return;
  }

  try {
    Sentry.init({
      dsn: dsn || process.env.EXPO_PUBLIC_SENTRY_DSN,
      enableInExpoDevelopment: false,
      debug: __DEV__,
      environment: __DEV__ ? 'development' : 'production',
      tracesSampleRate: 1.0, // 100% of transactions for showcase
      enableAutoSessionTracking: true,
      sessionTrackingIntervalMillis: 30000,
      // Capture unhandled promise rejections
      enableCaptureFailedRequests: true,
      // Attach screenshots (optional, can be disabled for privacy)
      attachScreenshot: false,
      // Custom error filters
      beforeSend(event, hint) {
        // Filter out development errors
        if (__DEV__) {
          return null;
        }
        return event;
      },
    });

    isInitialized = true;
    console.log('[Sentry] Initialized successfully');
  } catch (error) {
    console.error('[Sentry] Initialization failed:', error);
  }
}

/**
 * Capture exception
 */
export function captureException(error: Error, context?: Record<string, any>): void {
  if (!isInitialized) return;

  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Capture message
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info'): void {
  if (!isInitialized) return;

  Sentry.captureMessage(message, level);
}

/**
 * Set user context
 */
export function setUser(user: { id: string; email?: string; username?: string } | null): void {
  if (!isInitialized) return;

  Sentry.setUser(user);
}

/**
 * Add breadcrumb
 */
export function addBreadcrumb(breadcrumb: Sentry.Breadcrumb): void {
  if (!isInitialized) return;

  Sentry.addBreadcrumb(breadcrumb);
}

/**
 * Set context
 */
export function setContext(name: string, context: Record<string, any>): void {
  if (!isInitialized) return;

  Sentry.setContext(name, context);
}

/**
 * Wrap async function with error tracking
 */
export function withErrorTracking<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: string
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      captureException(error as Error, {
        function: context || fn.name,
        args: args.length,
      });
      throw error;
    }
  }) as T;
}
