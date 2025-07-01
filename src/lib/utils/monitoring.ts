/**
 * Production Performance Monitoring
 * Tracks API response times, success rates, and system health
 */

interface MetricData {
  name: string;
  value: number;
  timestamp: string;
  tags?: Record<string, string>;
}

interface PerformanceMetrics {
  apiResponseTime: number;
  apiSuccessRate: number;
  activeUsers: number;
  errorRate: number;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: MetricData[] = [];

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startApiTimer(endpoint: string): () => void {
    const startTime = Date.now();
    
    return () => {
      const duration = Date.now() - startTime;
      this.recordMetric('api_response_time', duration, {
        endpoint: endpoint
      });
      
      // Alert on slow API responses (>5 seconds)
      if (duration > 5000) {
        console.warn(`⚠️ Slow API Response: ${endpoint} took ${duration}ms`);
      }
    };
  }

  recordApiSuccess(endpoint: string): void {
    this.recordMetric('api_success', 1, { endpoint });
  }

  recordApiError(endpoint: string, errorType: string): void {
    this.recordMetric('api_error', 1, { endpoint, error_type: errorType });
  }

  recordUserAction(action: string, userId?: string): void {
    this.recordMetric('user_action', 1, { 
      action, 
      user_id: userId || 'anonymous'
    });
  }

  private recordMetric(name: string, value: number, tags?: Record<string, string>): void {
    const metric: MetricData = {
      name,
      value,
      timestamp: new Date().toISOString(),
      tags
    };

    this.metrics.push(metric);

    // Keep only last 1000 metrics in memory
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // In production, send to monitoring service:
    // - DataDog, New Relic, CloudWatch
    console.log(`📊 Metric: ${name} = ${value}`, tags);
  }

  getHealthStatus(): PerformanceMetrics {
    const recentMetrics = this.metrics.filter(m => 
      Date.now() - new Date(m.timestamp).getTime() < 5 * 60 * 1000 // Last 5 minutes
    );

    const responseTimeMetrics = recentMetrics.filter(m => m.name === 'api_response_time');
    const avgResponseTime = responseTimeMetrics.length > 0 
      ? responseTimeMetrics.reduce((sum, m) => sum + m.value, 0) / responseTimeMetrics.length
      : 0;

    const successMetrics = recentMetrics.filter(m => m.name === 'api_success');
    const errorMetrics = recentMetrics.filter(m => m.name === 'api_error');
    const totalRequests = successMetrics.length + errorMetrics.length;
    const successRate = totalRequests > 0 ? (successMetrics.length / totalRequests) * 100 : 100;

    return {
      apiResponseTime: Math.round(avgResponseTime),
      apiSuccessRate: Math.round(successRate * 100) / 100,
      activeUsers: recentMetrics.filter(m => m.name === 'user_action').length,
      errorRate: Math.round((errorMetrics.length / Math.max(totalRequests, 1)) * 10000) / 100
    };
  }
}

export const monitor = PerformanceMonitor.getInstance(); 