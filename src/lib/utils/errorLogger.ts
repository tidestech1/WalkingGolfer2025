/**
 * Production Error Logging and Alerting System
 * Logs errors to console and could be extended to external services
 */

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM', 
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface ErrorLog {
  message: string;
  severity: ErrorSeverity;
  context?: Record<string, any>;
  userId?: string;
  courseId?: string;
  timestamp: string;
  stackTrace?: string;
  userAgent?: string;
  ip?: string;
}

export class ProductionLogger {
  private static instance: ProductionLogger;

  static getInstance(): ProductionLogger {
    if (!ProductionLogger.instance) {
      ProductionLogger.instance = new ProductionLogger();
    }
    return ProductionLogger.instance;
  }

  logError(error: Error | string, severity: ErrorSeverity, context?: Record<string, any>): void {
    const errorLog: ErrorLog = {
      message: typeof error === 'string' ? error : error.message,
      severity,
      context,
      timestamp: new Date().toISOString(),
      stackTrace: typeof error === 'object' ? error.stack : undefined,
    };

    // Console logging (always)
    console.error(`[${severity}] ${errorLog.message}`, {
      ...errorLog,
      context: context || {}
    });

    // In production, you would send to external services:
    // - Sentry, LogRocket, DataDog, etc.
    // - Email alerts for CRITICAL errors
    // - Slack notifications for HIGH errors
    
    if (severity === ErrorSeverity.CRITICAL) {
      this.sendCriticalAlert(errorLog);
    }
  }

  logApiError(
    endpoint: string, 
    error: Error, 
    userId?: string, 
    context?: Record<string, any>
  ): void {
    this.logError(error, ErrorSeverity.HIGH, {
      endpoint,
      userId,
      ...context
    });
  }

  logDatabaseError(
    operation: string, 
    error: Error, 
    context?: Record<string, any>
  ): void {
    this.logError(error, ErrorSeverity.CRITICAL, {
      operation,
      type: 'database_error',
      ...context
    });
  }

  logAuthError(
    error: Error, 
    userId?: string, 
    context?: Record<string, any>
  ): void {
    this.logError(error, ErrorSeverity.HIGH, {
      type: 'auth_error',
      userId,
      ...context
    });
  }

  private sendCriticalAlert(errorLog: ErrorLog): void {
    // In production, implement:
    // - Email to admin team
    // - Slack webhook
    // - PagerDuty integration
    console.warn('🚨 CRITICAL ERROR - MANUAL INTERVENTION REQUIRED 🚨', errorLog);
  }
}

// Singleton instance
export const logger = ProductionLogger.getInstance(); 