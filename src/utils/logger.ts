/**
 * Logger utility to replace console statements in production
 * Ensures sensitive data is not logged in production builds
 */

const __DEV__ = process.env.NODE_ENV !== 'production';

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: unknown;
  timestamp: string;
}

class Logger {
  private enabled: boolean;
  private logHistory: LogEntry[] = [];
  private maxHistorySize: number = 100;

  constructor(enabled: boolean = true) {
    this.enabled = enabled;
  }

  private createLogEntry(level: LogLevel, ...args: unknown[]): LogEntry {
    const message = args
      .map((arg) => {
        if (typeof arg === 'string') return arg;
        if (arg instanceof Error) return arg.message;
        return JSON.stringify(arg);
      })
      .join(' ');

    return {
      level,
      message,
      data: args.length > 1 ? args.slice(1) : undefined,
      timestamp: new Date().toISOString(),
    };
  }

  private addToHistory(entry: LogEntry): void {
    this.logHistory.push(entry);
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory.shift();
    }
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.enabled) return false;
    // In production, only log errors and warnings
    if (!__DEV__ && (level === 'log' || level === 'debug')) {
      return false;
    }
    return true;
  }

  /**
   * Log informational messages (dev only)
   */
  log(...args: unknown[]): void {
    if (!this.shouldLog('log')) return;
    const entry = this.createLogEntry('log', ...args);
    this.addToHistory(entry);
    console.log('[LOG]', ...args);
  }

  /**
   * Log debug messages (dev only)
   */
  debug(...args: unknown[]): void {
    if (!this.shouldLog('debug')) return;
    const entry = this.createLogEntry('debug', ...args);
    this.addToHistory(entry);
    if (__DEV__) {
      console.debug('[DEBUG]', ...args);
    }
  }

  /**
   * Log informational messages
   */
  info(...args: unknown[]): void {
    if (!this.shouldLog('info')) return;
    const entry = this.createLogEntry('info', ...args);
    this.addToHistory(entry);
    console.info('[INFO]', ...args);
  }

  /**
   * Log warning messages (always logged)
   */
  warn(...args: unknown[]): void {
    if (!this.shouldLog('warn')) return;
    const entry = this.createLogEntry('warn', ...args);
    this.addToHistory(entry);
    console.warn('[WARN]', ...args);
  }

  /**
   * Log error messages (always logged)
   */
  error(...args: unknown[]): void {
    const entry = this.createLogEntry('error', ...args);
    this.addToHistory(entry);
    console.error('[ERROR]', ...args);

    // In production, send errors to crash reporting service
    if (!__DEV__ && typeof window !== 'undefined') {
      // TODO: Integrate with crash reporting service
      // Example: Sentry.captureException(args[0], { extra: args.slice(1) });
    }
  }

  /**
   * Get log history (useful for debugging)
   */
  getHistory(): ReadonlyArray<LogEntry> {
    return [...this.logHistory];
  }

  /**
   * Clear log history
   */
  clearHistory(): void {
    this.logHistory = [];
  }

  /**
   * Enable/disable logging
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
}

// Export singleton instance
export const logger = new Logger(true);

// Export type for TypeScript
export type { LogEntry, LogLevel };
