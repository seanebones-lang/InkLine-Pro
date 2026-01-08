import { useCallback, useRef } from 'react';
import { logger } from '../utils/logger';

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  timeout?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

interface FetchOptions extends RequestInit {
  timeout?: number;
}

/**
 * Custom hook for API calls with automatic retry logic and timeout handling
 * Provides exponential backoff and request cancellation on unmount
 */
export function useApiWithRetry() {
  const abortControllersRef = useRef<Set<AbortController>>(new Set());

  const fetchWithRetry = useCallback(
    async (
      url: string,
      options: FetchOptions = {},
      retryOptions: RetryOptions = {}
    ): Promise<Response> => {
      const {
        maxRetries = 3,
        initialDelay = 1000,
        maxDelay = 10000,
        backoffFactor = 2,
        timeout = 30000,
        onRetry,
      } = retryOptions;

      // Create abort controller for this request
      const abortController = new AbortController();
      abortControllersRef.current.add(abortController);

      // Combine abort signals
      const signal = abortController.signal;

      // Set timeout
      const timeoutId = timeout
        ? setTimeout(() => {
            abortController.abort();
          }, timeout)
        : null;

      try {
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          let attemptTimeoutId: ReturnType<typeof setTimeout> | null = null;
          
          try {
            // Clear timeout if it exists
            if (timeoutId) {
              clearTimeout(timeoutId);
            }

            // Create new timeout for this attempt
            attemptTimeoutId = timeout
              ? setTimeout(() => {
                  abortController.abort();
                }, timeout)
              : null;

            const response = await fetch(url, {
              ...options,
              signal,
            });

            // Clear timeout on success
            if (attemptTimeoutId) {
              clearTimeout(attemptTimeoutId);
            }

            // Remove abort controller from set
            abortControllersRef.current.delete(abortController);

            // Check if response is ok
            if (!response.ok && attempt < maxRetries) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return response;
          } catch (error) {
            // Cleanup timeout if it exists
            if (attemptTimeoutId) {
              clearTimeout(attemptTimeoutId);
            }
            
            // Don't retry if aborted or last attempt
            if (signal.aborted || attempt === maxRetries) {
              throw error;
            }

            // Calculate delay with exponential backoff
            const delay = Math.min(
              initialDelay * Math.pow(backoffFactor, attempt),
              maxDelay
            );

            logger.warn(
              `API request failed (attempt ${attempt + 1}/${maxRetries + 1}):`,
              error instanceof Error ? error.message : 'Unknown error'
            );

            if (onRetry) {
              onRetry(attempt + 1, error as Error);
            }

            // Wait before retrying
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }

        throw new Error('Max retries exceeded');
      } catch (error) {
        // Cleanup
        abortControllersRef.current.delete(abortController);
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        if (error instanceof Error && error.name === 'AbortError') {
          logger.info('Request aborted');
          throw new Error('Request cancelled');
        }

        throw error;
      }
    },
    []
  );

  // Cleanup function to cancel all pending requests
  const cancelAllRequests = useCallback(() => {
    abortControllersRef.current.forEach((controller) => {
      controller.abort();
    });
    abortControllersRef.current.clear();
  }, []);

  return {
    fetchWithRetry,
    cancelAllRequests,
  };
}
