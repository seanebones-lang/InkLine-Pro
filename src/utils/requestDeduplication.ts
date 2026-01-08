/**
 * Request deduplication utility
 * Prevents duplicate API calls by caching in-flight requests
 * Useful for preventing race conditions and redundant network calls
 */

interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: number;
}

class RequestDeduplication {
  private pendingRequests: Map<string, PendingRequest<any>> = new Map();
  private readonly maxAge: number = 30000; // 30 seconds

  /**
   * Deduplicate a request by key
   * If a request with the same key is already in-flight, returns the existing promise
   * Otherwise, creates a new request and caches it
   */
  async deduplicate<T>(
    key: string,
    requestFn: () => Promise<T>
  ): Promise<T> {
    // Check if there's a pending request with the same key
    const existing = this.pendingRequests.get(key);

    if (existing) {
      // Check if the request is still fresh (not expired)
      const age = Date.now() - existing.timestamp;
      if (age < this.maxAge) {
        // Return the existing promise
        return existing.promise;
      } else {
        // Request expired, remove it
        this.pendingRequests.delete(key);
      }
    }

    // Create new request
    const promise = requestFn()
      .then((result) => {
        // Remove from cache on success
        this.pendingRequests.delete(key);
        return result;
      })
      .catch((error) => {
        // Remove from cache on error
        this.pendingRequests.delete(key);
        throw error;
      });

    // Cache the request
    this.pendingRequests.set(key, {
      promise,
      timestamp: Date.now(),
    });

    return promise;
  }

  /**
   * Clear expired requests from cache
   */
  clearExpired(): void {
    const now = Date.now();
    for (const [key, request] of this.pendingRequests.entries()) {
      const age = now - request.timestamp;
      if (age >= this.maxAge) {
        this.pendingRequests.delete(key);
      }
    }
  }

  /**
   * Clear all cached requests
   */
  clear(): void {
    this.pendingRequests.clear();
  }

  /**
   * Get the number of pending requests
   */
  getPendingCount(): number {
    return this.pendingRequests.size;
  }
}

// Export singleton instance
export const requestDeduplication = new RequestDeduplication();

/**
 * Helper function to generate a cache key from request parameters
 */
export function generateCacheKey(
  url: string,
  method: string = 'GET',
  body?: unknown
): string {
  const bodyHash = body ? JSON.stringify(body) : '';
  return `${method}:${url}:${bodyHash}`;
}

/**
 * Higher-order function to wrap fetch with deduplication
 */
export async function fetchWithDeduplication(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const key = generateCacheKey(url, options.method || 'GET', options.body);

  return requestDeduplication.deduplicate(key, async () => {
    return fetch(url, options);
  });
}
