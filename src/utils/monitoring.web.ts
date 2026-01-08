/**
 * Monitoring Utilities - Web Version
 *
 * Stub implementation for web demo
 *
 * @module monitoring
 */

interface MemoryStats {
  used: number;
  total: number;
  percentage: number;
}

interface DatabaseStats {
  size: number;
  recordCount: number;
}

interface PerformanceMetrics {
  memory: MemoryStats;
  database: DatabaseStats;
  timestamp: string;
}

let monitoringInterval: NodeJS.Timeout | null = null;

/**
 * Start performance monitoring (no-op for web)
 */
export function startMonitoring(_intervalMs?: number): void {
  console.log('[Monitoring] Disabled for web demo');
}

/**
 * Stop performance monitoring (no-op for web)
 */
export function stopMonitoring(): void {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
  }
}

/**
 * Get current performance metrics (mock for web)
 */
export async function getPerformanceMetrics(): Promise<PerformanceMetrics> {
  return {
    memory: {
      used: 50 * 1024 * 1024, // 50MB
      total: 100 * 1024 * 1024, // 100MB
      percentage: 50,
    },
    database: {
      size: 10 * 1024 * 1024, // 10MB
      recordCount: 100,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get memory usage (mock for web)
 */
export async function getMemoryUsage(): Promise<MemoryStats> {
  return {
    used: 50 * 1024 * 1024,
    total: 100 * 1024 * 1024,
    percentage: 50,
  };
}

/**
 * Get database statistics (mock for web)
 */
export async function getDatabaseStats(): Promise<DatabaseStats> {
  return {
    size: 10 * 1024 * 1024,
    recordCount: 100,
  };
}
