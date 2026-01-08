/**
 * Monitoring Utilities
 * 
 * Track memory usage, database size, and performance metrics
 * 
 * @module monitoring
 */

import { logger } from './logger';
import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import { captureMessage } from '../config/sentry';

interface MemoryStats {
  used: number;
  total: number;
  percentage: number;
}

interface DatabaseStats {
  size: number;
  recordCount: number;
  averageRecordSize: number;
}

interface PerformanceMetrics {
  memory: MemoryStats;
  database: DatabaseStats;
  timestamp: number;
}

let db: SQLite.SQLiteDatabase | null = null;

/**
 * Get SQLite database instance
 */
async function getDatabase(): Promise<SQLite.SQLiteDatabase | null> {
  if (!db) {
    try {
      db = await SQLite.openDatabaseAsync('tattoo_history.db');
    } catch (error) {
      logger.error('Error opening database for monitoring:', error);
      return null;
    }
  }
  return db;
}

/**
 * Get database size in bytes
 */
export async function getDatabaseSize(): Promise<number> {
  try {
    const database = await getDatabase();
    if (!database) return 0;
    
    // Get database file path
    const dbPath = `${FileSystem.documentDirectory}SQLite/tattoo_history.db`;
    
    // Check if file exists
    const fileInfo = await FileSystem.getInfoAsync(dbPath);
    if (!fileInfo.exists) return 0;
    
    // Get file size
    return fileInfo.size || 0;
  } catch (error) {
    logger.error('Error getting database size:', error);
    return 0;
  }
}

/**
 * Get record count from database
 */
export async function getRecordCount(): Promise<number> {
  try {
    const database = await getDatabase();
    if (!database) return 0;
    
    const result = await database.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM tattoo_generations'
    );
    
    return result?.count || 0;
  } catch (error) {
    logger.error('Error getting record count:', error);
    return 0;
  }
}

/**
 * Get database statistics
 */
export async function getDatabaseStats(): Promise<DatabaseStats> {
  const size = await getDatabaseSize();
  const recordCount = await getRecordCount();
  const averageRecordSize = recordCount > 0 ? size / recordCount : 0;
  
  return {
    size,
    recordCount,
    averageRecordSize,
  };
}

/**
 * Get memory usage (approximate)
 * Note: React Native doesn't provide exact memory stats, this is an approximation
 */
export async function getMemoryStats(): Promise<MemoryStats> {
  try {
    // Get database size as proxy for memory usage
    const dbSize = await getDatabaseSize();
    
    // Estimate: database size + 50MB base + 10MB per 100 records
    const recordCount = await getRecordCount();
    const estimatedUsed = dbSize + 50 * 1024 * 1024 + (recordCount / 100) * 10 * 1024 * 1024;
    
    // Assume 2GB total memory on average device
    const total = 2 * 1024 * 1024 * 1024;
    const percentage = (estimatedUsed / total) * 100;
    
    return {
      used: estimatedUsed,
      total,
      percentage: Math.min(percentage, 100),
    };
  } catch (error) {
    logger.error('Error getting memory stats:', error);
    return {
      used: 0,
      total: 0,
      percentage: 0,
    };
  }
}

/**
 * Get comprehensive performance metrics
 */
export async function getPerformanceMetrics(): Promise<PerformanceMetrics> {
  const memory = await getMemoryStats();
  const database = await getDatabaseStats();
  
  return {
    memory,
    database,
    timestamp: Date.now(),
  };
}

/**
 * Check if database size is approaching limits
 * Warns if database exceeds 100MB
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  const stats = await getDatabaseStats();
  const WARNING_THRESHOLD = 100 * 1024 * 1024; // 100MB
  
  if (stats.size > WARNING_THRESHOLD) {
    const message = `Database size warning: ${(stats.size / 1024 / 1024).toFixed(2)}MB (${stats.recordCount} records)`;
    logger.warn(message);
    captureMessage(message, 'warning');
    return false;
  }
  
  return true;
}

/**
 * Check if memory usage is high
 * Warns if estimated usage exceeds 80%
 */
export async function checkMemoryHealth(): Promise<boolean> {
  const stats = await getMemoryStats();
  const WARNING_THRESHOLD = 80; // 80%
  
  if (stats.percentage > WARNING_THRESHOLD) {
    const message = `Memory usage warning: ${stats.percentage.toFixed(2)}% (${(stats.used / 1024 / 1024).toFixed(2)}MB)`;
    logger.warn(message);
    captureMessage(message, 'warning');
    return false;
  }
  
  return true;
}

/**
 * Perform health check and log metrics
 */
export async function performHealthCheck(): Promise<void> {
  try {
    const metrics = await getPerformanceMetrics();
    
    logger.info('Performance Metrics:', {
      memory: `${(metrics.memory.used / 1024 / 1024).toFixed(2)}MB / ${(metrics.memory.total / 1024 / 1024).toFixed(2)}MB (${metrics.memory.percentage.toFixed(2)}%)`,
      database: `${(metrics.database.size / 1024 / 1024).toFixed(2)}MB (${metrics.database.recordCount} records)`,
      avgRecordSize: `${(metrics.database.averageRecordSize / 1024).toFixed(2)}KB`,
    });
    
    // Check health thresholds
    await checkDatabaseHealth();
    await checkMemoryHealth();
  } catch (error) {
    logger.error('Error performing health check:', error);
  }
}

/**
 * Start periodic monitoring
 */
let monitoringInterval: NodeJS.Timeout | null = null;

export function startMonitoring(intervalMs: number = 300000): void { // 5 minutes
  if (monitoringInterval) {
    stopMonitoring();
  }
  
  // Perform initial check
  performHealthCheck();
  
  // Set up periodic checks
  monitoringInterval = setInterval(() => {
    performHealthCheck();
  }, intervalMs);
  
  logger.info(`Monitoring started (interval: ${intervalMs}ms)`);
}

/**
 * Stop periodic monitoring
 */
export function stopMonitoring(): void {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
    logger.info('Monitoring stopped');
  }
}
