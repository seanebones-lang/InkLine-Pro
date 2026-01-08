/**
 * Sentry Configuration - Web Version
 *
 * Stub implementation for web demo
 *
 * @module sentry
 */

let isInitialized = false;

/**
 * Initialize Sentry (no-op for web)
 */
export function initSentry(_dsn?: string): void {
  if (isInitialized) {
    return;
  }
  console.log('[Sentry] Disabled for web demo');
  isInitialized = true;
}

/**
 * Capture exception (no-op for web)
 */
export function captureException(_error: Error, _context?: Record<string, any>): void {
  // No-op for web
}

/**
 * Capture message (no-op for web)
 */
export function captureMessage(_message: string, _level?: string): void {
  // No-op for web
}

/**
 * Set user context (no-op for web)
 */
export function setUser(_user: { id: string; email?: string; username?: string } | null): void {
  // No-op for web
}

/**
 * Add breadcrumb (no-op for web)
 */
export function addBreadcrumb(_breadcrumb: any): void {
  // No-op for web
}

/**
 * Set context (no-op for web)
 */
export function setContext(_name: string, _context: Record<string, any>): void {
  // No-op for web
}

/**
 * Wrap async function with error tracking (no-op for web)
 */
export function withErrorTracking<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  _context?: string
): T {
  return fn;
}
