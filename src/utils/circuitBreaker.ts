/**
 * Circuit Breaker Pattern Implementation
 * 
 * Prevents cascading failures by stopping requests when service is down.
 * Compliant with reliability best practices for 99.999% uptime.
 * 
 * @module circuitBreaker
 * @see {@link https://martinfowler.com/bliki/CircuitBreaker.html} Circuit Breaker Pattern
 */

import { logger } from './logger';

/**
 * Circuit breaker state enumeration
 * 
 * @enum {string}
 */
export enum CircuitState {
  /** Normal operation - requests are allowed */
  CLOSED = 'CLOSED',
  /** Service is down - requests are rejected immediately */
  OPEN = 'OPEN',
  /** Testing if service recovered - limited requests allowed */
  HALF_OPEN = 'HALF_OPEN',
}

/**
 * Configuration options for circuit breaker
 * 
 * @interface CircuitBreakerOptions
 */
export interface CircuitBreakerOptions {
  /** Number of failures before opening circuit (default: 5) */
  failureThreshold?: number;
  /** Time before attempting to close circuit in milliseconds (default: 60000) */
  resetTimeout?: number;
  /** Number of successes needed to close circuit (default: 2) */
  successThreshold?: number;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
}

/**
 * Circuit breaker statistics
 * 
 * @interface CircuitBreakerStats
 */
export interface CircuitBreakerStats {
  /** Current circuit state */
  state: CircuitState;
  /** Current failure count */
  failures: number;
  /** Current success count (in HALF_OPEN state) */
  successes: number;
  /** Timestamp of last failure */
  lastFailureTime: number | null;
  /** Total requests processed */
  totalRequests: number;
  /** Total failures encountered */
  totalFailures: number;
  /** Total successes */
  totalSuccesses: number;
}

/**
 * Circuit Breaker class for managing service reliability
 * 
 * Implements the circuit breaker pattern to prevent cascading failures.
 * Automatically opens circuit after threshold failures and attempts recovery.
 * 
 * @class CircuitBreaker
 * @example
 * ```typescript
 * const breaker = new CircuitBreaker({
 *   failureThreshold: 5,
 *   resetTimeout: 60000
 * });
 * 
 * try {
 *   const result = await breaker.execute(
 *     () => apiCall(),
 *     () => fallbackValue
 *   );
 * } catch (error) {
 *   // Handle error
 * }
 * ```
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: number = 0;
  private successes: number = 0;
  private lastFailureTime: number | null = null;
  private totalRequests: number = 0;
  private totalFailures: number = 0;
  private totalSuccesses: number = 0;

  private readonly failureThreshold: number;
  private readonly resetTimeout: number;
  private readonly successThreshold: number;
  private readonly timeout: number;

  constructor(options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold ?? 5;
    this.resetTimeout = options.resetTimeout ?? 60000; // 1 minute
    this.successThreshold = options.successThreshold ?? 2;
    this.timeout = options.timeout ?? 30000; // 30 seconds
  }

  /**
   * Execute a function with circuit breaker protection
   * 
   * @template T - Return type of the function
   * @param {() => Promise<T>} fn - Function to execute
   * @param {() => Promise<T> | T} [fallback] - Optional fallback function if circuit is open
   * @returns {Promise<T>} Result of function execution or fallback
   * @throws {Error} If circuit is open and no fallback provided, or if function fails
   * 
   * @example
   * ```typescript
   * const result = await breaker.execute(
   *   async () => await fetch('/api/data'),
   *   () => ({ data: [] }) // Fallback if circuit is open
   * );
   * ```
   */
  async execute<T>(
    fn: () => Promise<T>,
    fallback?: () => Promise<T> | T
  ): Promise<T> {
    this.totalRequests++;

    // Check circuit state
    if (this.state === CircuitState.OPEN) {
      // Check if enough time has passed to try again
      if (
        this.lastFailureTime &&
        Date.now() - this.lastFailureTime >= this.resetTimeout
      ) {
        this.state = CircuitState.HALF_OPEN;
        this.successes = 0;
        logger.info('Circuit breaker entering HALF_OPEN state');
      } else {
        // Circuit is open, reject immediately
        logger.warn('Circuit breaker is OPEN, rejecting request');
        if (fallback) {
          return await Promise.resolve(fallback());
        }
        throw new Error('Service unavailable (circuit breaker open)');
      }
    }

    // Execute the function with timeout
    try {
      const result = await Promise.race([
        fn(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), this.timeout)
        ),
      ]);

      // Success
      this.onSuccess();
      return result;
    } catch (error) {
      // Failure
      this.onFailure();
      
      // Try fallback if available
      if (fallback) {
        logger.info('Using fallback due to circuit breaker failure');
        try {
          return await Promise.resolve(fallback());
        } catch (fallbackError) {
          logger.error('Fallback also failed:', fallbackError);
        }
      }

      throw error;
    }
  }

  /**
   * Handle successful request
   */
  private onSuccess(): void {
    this.totalSuccesses++;
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.successes++;
      
      // If we have enough successes, close the circuit
      if (this.successes >= this.successThreshold) {
        this.state = CircuitState.CLOSED;
        this.failures = 0;
        this.successes = 0;
        logger.info('Circuit breaker CLOSED - service recovered');
      }
    } else if (this.state === CircuitState.CLOSED) {
      // Reset failure count on success
      this.failures = 0;
    }
  }

  /**
   * Handle failed request
   */
  private onFailure(): void {
    this.totalFailures++;
    this.lastFailureTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      // Failed during half-open, open circuit again
      this.state = CircuitState.OPEN;
      this.successes = 0;
      logger.warn('Circuit breaker OPENED - service still down');
    } else if (this.state === CircuitState.CLOSED) {
      this.failures++;
      
      // If we exceed threshold, open the circuit
      if (this.failures >= this.failureThreshold) {
        this.state = CircuitState.OPEN;
        logger.error(
          `Circuit breaker OPENED after ${this.failures} failures`
        );
      }
    }
  }

  /**
   * Reset circuit breaker to closed state
   * 
   * Manually resets the circuit breaker, clearing all failure counts and statistics.
   * Useful for manual recovery or testing.
   * 
   * @returns {void}
   * 
   * @example
   * ```typescript
   * breaker.reset(); // Manually reset circuit
   * ```
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = null;
    logger.info('Circuit breaker manually reset');
  }

  /**
   * Get current statistics
   * 
   * Returns comprehensive statistics about circuit breaker state and performance.
   * 
   * @returns {CircuitBreakerStats} Current statistics
   * 
   * @example
   * ```typescript
   * const stats = breaker.getStats();
   * console.log(`Circuit state: ${stats.state}`);
   * console.log(`Total requests: ${stats.totalRequests}`);
   * ```
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailureTime: this.lastFailureTime,
      totalRequests: this.totalRequests,
      totalFailures: this.totalFailures,
      totalSuccesses: this.totalSuccesses,
    };
  }

  /**
   * Check if circuit is open
   * 
   * @returns {boolean} True if circuit is OPEN
   */
  isOpen(): boolean {
    return this.state === CircuitState.OPEN;
  }

  /**
   * Check if circuit is closed
   * 
   * @returns {boolean} True if circuit is CLOSED
   */
  isClosed(): boolean {
    return this.state === CircuitState.CLOSED;
  }
}

/**
 * Circuit breaker instance for Grok API
 * 
 * Configured with:
 * - Failure threshold: 5 failures
 * - Reset timeout: 60 seconds
 * - Success threshold: 2 successes
 * - Request timeout: 30 seconds
 * 
 * @constant {CircuitBreaker}
 */
export const grokApiCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  resetTimeout: 60000, // 1 minute
  successThreshold: 2,
  timeout: 30000,
});

/**
 * Circuit breaker instance for Supabase
 * 
 * Configured with:
 * - Failure threshold: 3 failures
 * - Reset timeout: 30 seconds
 * - Success threshold: 2 successes
 * - Request timeout: 10 seconds
 * 
 * @constant {CircuitBreaker}
 */
export const supabaseCircuitBreaker = new CircuitBreaker({
  failureThreshold: 3,
  resetTimeout: 30000, // 30 seconds
  successThreshold: 2,
  timeout: 10000,
});
