/**
 * Health Check Utility - Web Version
 *
 * Stub implementation for web demo
 *
 * @module healthCheck
 */

export interface HealthStatus {
  overall: boolean;
  services: {
    database: boolean;
    storage: boolean;
    grokApi: boolean;
  };
  timestamp: string;
}

let healthCheckInterval: NodeJS.Timeout | null = null;

/**
 * Start health checks (no-op for web)
 */
export function startHealthChecks(_intervalMs?: number): void {
  console.log('[HealthCheck] Disabled for web demo');
}

/**
 * Stop health checks (no-op for web)
 */
export function stopHealthChecks(): void {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
  }
}

/**
 * Get current health status (mock for web)
 */
export async function getHealthStatus(): Promise<HealthStatus> {
  return {
    overall: true,
    services: {
      database: true,
      storage: true,
      grokApi: true,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Check if all services are healthy (mock for web)
 */
export async function isHealthy(): Promise<boolean> {
  return true;
}
