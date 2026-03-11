/**
 * Debug Logging Utility for rspress-terminology
 *
 * Provides conditional, namespace-based logging with environment variable control.
 * Inspired by the 'debug' package but tailored for this plugin.
 */

export interface DebugOptions {
  /** Enable debug logging */
  enabled?: boolean;
  /** Include timestamps in log output */
  timestamps?: boolean;
  /** Custom namespace patterns to enable (e.g., ['build:*', 'inject']) */
  namespaces?: string[];
}

export interface DebugLogger {
  (message: string, ...args: unknown[]): void;
  enabled: boolean;
  namespace: string;
  extend: (subNamespace: string) => DebugLogger;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
}

/**
 * Debug state management
 */
class DebugState {
  private enabled = false;
  private timestamps = false;
  private namespacePatterns: RegExp[] = [];

  configure(options: DebugOptions = {}): void {
    // Check environment variable first
    const envDebug = typeof process !== 'undefined'
      ? process.env.RSPRESS_TERMINOLOGY_DEBUG
      : undefined;

    if (envDebug !== undefined) {
      // Environment variable takes precedence
      this.enabled = envDebug !== '' && envDebug !== '0' && envDebug.toLowerCase() !== 'false';
      if (envDebug && envDebug !== '1' && envDebug.toLowerCase() !== 'true') {
        // Parse namespace patterns from env var
        this.namespacePatterns = this.parseNamespacePatterns(envDebug);
      }
    } else if (options.enabled !== undefined) {
      // Use option from config
      this.enabled = options.enabled;
    }

    this.timestamps = options.timestamps ?? false;

    // Parse namespace patterns from options
    if (options.namespaces && options.namespaces.length > 0) {
      this.namespacePatterns = this.parseNamespacePatterns(options.namespaces.join(','));
    }
  }

  private parseNamespacePatterns(patternsStr: string): RegExp[] {
    return patternsStr
      .split(',')
      .map(p => p.trim())
      .filter(p => p.length > 0)
      .map(pattern => {
        // Convert glob-style patterns to regex
        // e.g., 'build:*' -> /^build:.*$/
        const regexPattern = pattern
          .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // Escape special chars
          .replace(/\*/g, '.*'); // Convert * to .*
        return new RegExp(`^${regexPattern}$`);
      });
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  hasTimestamps(): boolean {
    return this.timestamps;
  }

  isNamespaceEnabled(namespace: string): boolean {
    if (!this.enabled) return false;

    // If no specific patterns, enable all when debug is on
    if (this.namespacePatterns.length === 0) return true;

    // Check if namespace matches any pattern
    return this.namespacePatterns.some(pattern => pattern.test(namespace));
  }
}

const debugState = new DebugState();

/**
 * ANSI color codes for terminal output
 */
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

/**
 * Select a color for a namespace (hash-based for consistency)
 */
function getNamespaceColor(namespace: string): string {
  const colorKeys = Object.keys(colors).filter(k => k !== 'reset' && k !== 'bright' && k !== 'dim');
  let hash = 0;
  for (let i = 0; i < namespace.length; i++) {
    hash = ((hash << 5) - hash) + namespace.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  const colorIndex = Math.abs(hash) % colorKeys.length;
  return colors[colorKeys[colorIndex] as keyof typeof colors] || colors.cyan;
}

/**
 * Format timestamp if enabled
 */
function formatTimestamp(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const ms = String(now.getMilliseconds()).padStart(3, '0');
  return `${hours}:${minutes}:${seconds}.${ms}`;
}

/**
 * Check if we're in a browser environment
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * Format log message for output
 */
function formatLogMessage(namespace: string, message: string, args: unknown[]): [string, ...string[]] {
  const color = getNamespaceColor(namespace);
  const timestamp = debugState.hasTimestamps()
    ? `${colors.dim}[${formatTimestamp()}]${colors.reset} `
    : '';

  if (isBrowser()) {
    // Browser: use console.log with styling
    const prefix = `${timestamp}%c${namespace}%c`;
    const styles = [
      `color: ${color === colors.cyan ? '#06b6d4' : color}; font-weight: bold`,
      'color: inherit; font-weight: normal'
    ];
    return [prefix, ...styles, message, ...args.map(String)];
  } else {
    // Node.js: use ANSI colors
    const prefix = `${timestamp}${color}${namespace}${colors.reset}`;
    return [`${prefix} ${message}`, ...args.map(String)];
  }
}

/**
 * Create a debug logger for a specific namespace
 */
export function createDebugLogger(namespace: string): DebugLogger {
  const createLogFn = (level: 'log' | 'warn' | 'error') => {
    return function (message: string, ...args: unknown[]) {
      if (!debugState.isNamespaceEnabled(namespace)) {
        return;
      }

      const formatted = formatLogMessage(namespace, message, args);

      if (isBrowser()) {
        // Browser: use first arg as prefix with styles, rest as args
        const [prefix, style1, style2, msg, ...rest] = formatted;
        console[level](prefix, style1, style2, msg, ...rest);
      } else {
        // Node.js: spread formatted array
        console[level](...formatted);
      }
    };
  };

  const logger = createLogFn('log') as DebugLogger;

  // Add metadata
  logger.enabled = debugState.isNamespaceEnabled(namespace);
  logger.namespace = namespace;

  // Add warn and error methods
  logger.warn = createLogFn('warn');
  logger.error = createLogFn('error');

  // Add extend method for creating sub-namespaces
  logger.extend = function (subNamespace: string): DebugLogger {
    const newNamespace = `${namespace}:${subNamespace}`;
    return createDebugLogger(newNamespace);
  };

  return logger;
}

/**
 * Configure debug logging globally
 *
 * @example
 * ```ts
 * import { configureDebug } from './debug';
 *
 * // Enable all debug logs
 * configureDebug({ enabled: true });
 *
 * // Enable specific namespaces with timestamps
 * configureDebug({
 *   enabled: true,
 *   namespaces: ['build:*', 'inject'],
 *   timestamps: true
 * });
 * ```
 */
export function configureDebug(options: DebugOptions): void {
  debugState.configure(options);
}

/**
 * Check if debug logging is enabled for any namespace
 */
export function isDebugEnabled(): boolean {
  return debugState.isEnabled();
}

/**
 * Check if debug logging is enabled for a specific namespace
 */
export function isNamespaceDebugEnabled(namespace: string): boolean {
  return debugState.isNamespaceEnabled(namespace);
}

/**
 * Get current debug configuration (for debugging purposes)
 */
export function getDebugConfig(): {
  enabled: boolean;
  timestamps: boolean;
  namespacePatterns: string[];
} {
  return {
    enabled: debugState.isEnabled(),
    timestamps: debugState.hasTimestamps(),
    namespacePatterns: debugState['namespacePatterns'].map((p: RegExp) => p.source)
  };
}
