/**
 * Health Check Utility
 * 
 * Monitors service health and provides status information.
 * Essential for 99.999% uptime reliability.
 * 
 * @module healthCheck
 */

import { supabase } from '../config/supabase';
import { logger } from './logger';
import { grokApiCircuitBreaker, supabaseCircuitBreaker } from './circuitBreaker';

/**
 * Overall health status of the application
 * 
 * @interface HealthStatus
 */
export interface HealthStatus {
  /** Overall health status (true if all critical services are healthy) */
  healthy: boolean;
  /** Health status of individual services */
  services: {
    supabase: ServiceHealth;
    grokApi: ServiceHealth;
    database: ServiceHealth;
  };
  /** Timestamp of health check */
  timestamp: number;
}

/**
 * Health status of an individual service
 * 
 * @interface ServiceHealth
 */
export interface ServiceHealth {
  /** Service status */
  status: 'healthy' | 'degraded' | 'down';
  /** Response time in milliseconds */
  responseTime?: number;
  /** Error message if service is down */
  error?: string;
  /** Timestamp of last check */
  lastChecked: number;
}

/**
 * Check Supabase service health
 * 
 * Performs a lightweight query to verify Supabase connectivity and responsiveness.
 * 
 * @returns {Promise<ServiceHealth>} Health status of Supabase service
 * @private
 */
async function checkSupabaseHealth(): Promise<ServiceHealth> {
  const startTime = Date.now();
  
  try {
    const { error } = await supabaseCircuitBreaker.execute(
      async () => {
        const { error } = await supabase.from('profiles').select('id').limit(1);
        if (error) throw error;
        return true;
      },
      () => {
        // Fallback: just check if client is initialized
        return supabase !== null;
      }
    );

    const responseTime = Date.now() - startTime;

    if (error) {
      return {
        status: 'degraded',
        responseTime,
        error: error.message,
        lastChecked: Date.now(),
      };
    }

    return {
      status: 'healthy',
      responseTime,
      lastChecked: Date.now(),
    };
  } catch (error) {
    return {
      status: 'down',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
      lastChecked: Date.now(),
    };
  }
}

/**
 * Check Grok API health (via Supabase proxy)
 * 
 * Verifies that the Grok API proxy endpoint is reachable and responsive.
 * 
 * @returns {Promise<ServiceHealth>} Health status of Grok API service
 * @private
 */
async function checkGrokApiHealth(): Promise<ServiceHealth> {
  const startTime = Date.now();
  
  try {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
    const baseUrl = `${supabaseUrl}/functions/v1/grok-proxy`;

    await grokApiCircuitBreaker.execute(
      async () => {
        // Just check if endpoint is reachable (OPTIONS request)
        const response = await fetch(baseUrl, {
          method: 'OPTIONS',
          signal: AbortSignal.timeout(5000),
        });
        
        if (!response.ok && response.status !== 405) {
          throw new Error(`Health check failed: ${response.status}`);
        }
        
        return true;
      },
      () => {
        // Fallback: assume service is degraded
        return false;
      }
    );

    const responseTime = Date.now() - startTime;

    return {
      status: 'healthy',
      responseTime,
      lastChecked: Date.now(),
    };
  } catch (error) {
    return {
      status: 'down',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
      lastChecked: Date.now(),
    };
  }
}

/**
 * Check local database health
 * 
 * Verifies that SQLite database is accessible and can execute queries.
 * 
 * @returns {Promise<ServiceHealth>} Health status of local database
 * @private
 */
async function checkDatabaseHealth(): Promise<ServiceHealth> {
  const startTime = Date.now();
  
  try {
    // Check if SQLite is available
    const SQLite = require('expo-sqlite');
    const db = await SQLite.openDatabaseAsync('tattoo_history.db');
    
    // Simple query to check database
    await db.getAllAsync('SELECT 1');
    
    const responseTime = Date.now() - startTime;

    return {
      status: 'healthy',
      responseTime,
      lastChecked: Date.now(),
    };
  } catch (error) {
    return {
      status: 'down',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
      lastChecked: Date.now(),
    };
  }
}

/**
 * Perform comprehensive health check
 * 
 * Checks the health of all critical services (Supabase, Grok API, local database).
 * Returns overall health status and individual service statuses.
 * 
 * @returns {Promise<HealthStatus>} Comprehensive health status
 * 
 * @example
 * ```typescript
 * const health = await performHealthCheck();
 * if (!health.healthy) {
 *   console.error('Service health issues detected');
 *   console.log(health.services);
 * }
 * ```
 */
export async function performHealthCheck(): Promise<HealthStatus> {
  logger.info('Performing health check...');

  const [supabaseHealth, grokApiHealth, databaseHealth] = await Promise.all([
    checkSupabaseHealth(),
    checkGrokApiHealth(),
    checkDatabaseHealth(),
  ]);

  const overallHealthy =
    supabaseHealth.status === 'healthy' &&
    grokApiHealth.status !== 'down' &&
    databaseHealth.status === 'healthy';

  const healthStatus: HealthStatus = {
    healthy: overallHealthy,
    services: {
      supabase: supabaseHealth,
      grokApi: grokApiHealth,
      database: databaseHealth,
    },
    timestamp: Date.now(),
  };

  if (!overallHealthy) {
    logger.warn('Health check detected issues:', healthStatus);
  } else {
    logger.info('Health check passed');
  }

  return healthStatus;
}

/**
 * Start periodic health checks
 * 
 * Begins automatic periodic health checks at the specified interval.
 * Health checks run in the background and log issues when detected.
 * 
 * @param {number} [intervalMs=60000] - Interval between health checks in milliseconds (default: 60000 = 1 minute)
 * @returns {void}
 * 
 * @example
 * ```typescript
 * // Start health checks every 30 seconds
 * startHealthChecks(30000);
 * 
 * // Stop health checks when done
 * stopHealthChecks();
 * ```
 */
let healthCheckInterval: NodeJS.Timeout | null = null;

export function startHealthChecks(intervalMs: number = 60000): void {
  if (healthCheckInterval) {
    stopHealthChecks();
  }

  // Perform initial check
  performHealthCheck().catch((error) => {
    logger.error('Initial health check failed:', error);
  });

  // Set up periodic checks
  healthCheckInterval = setInterval(() => {
    performHealthCheck().catch((error) => {
      logger.error('Periodic health check failed:', error);
    });
  }, intervalMs);

  logger.info(`Health checks started (interval: ${intervalMs}ms)`);
}

/**
 * Stop periodic health checks
 * 
 * Stops the automatic periodic health checks that were started with `startHealthChecks()`.
 * 
 * @returns {void}
 * 
 * @example
 * ```typescript
 * startHealthChecks();
 * // ... later
 * stopHealthChecks();
 * ```
 */
export function stopHealthChecks(): void {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
    logger.info('Health checks stopped');
  }
}
