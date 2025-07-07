/**
 * Security monitoring utility for tracking suspicious activity and potential attacks
 */

interface SecurityEvent {
  type: 'rate_limit_exceeded' | 'suspicious_request' | 'failed_auth' | 'potential_bot' | 'admin_access' | 'invalid_token' | 'sql_injection_attempt' | 'xss_attempt';
  severity: 'low' | 'medium' | 'high' | 'critical';
  ip: string;
  userAgent?: string;
  userId?: string;
  email?: string;
  endpoint?: string;
  details?: string;
  timestamp: Date;
}

interface SecurityAlert {
  id: string;
  type: string;
  count: number;
  firstSeen: Date;
  lastSeen: Date;
  ips: string[];
  details: string;
}

class SecurityMonitor {
  private events: SecurityEvent[] = [];
  private alerts: SecurityAlert[] = [];
  private suspiciousIPs: Set<string> = new Set();

  /**
   * Log a security event
   */
  logEvent(event: Omit<SecurityEvent, 'timestamp'>): void {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: new Date()
    };
    
    this.events.push(securityEvent);
    
    // Keep only last 1000 events in memory
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }
    
    // Check for patterns that indicate attacks
    this.analyzeEvent(securityEvent);
    
    // Log to console for now (in production, send to logging service)
    console.warn(`🔒 Security Event [${event.severity.toUpperCase()}]: ${event.type} from ${event.ip}`, event);
  }

  /**
   * Analyze security event for patterns
   */
  private analyzeEvent(event: SecurityEvent): void {
    const recentEvents = this.getRecentEvents(5 * 60 * 1000); // Last 5 minutes
    const ipEvents = recentEvents.filter(e => e.ip === event.ip);
    
    // Multiple failed auth attempts
    if (event.type === 'failed_auth' && ipEvents.filter(e => e.type === 'failed_auth').length >= 3) {
      this.createAlert('multiple_failed_auth', event.ip, 'high', 'Multiple failed authentication attempts detected');
    }
    
    // Rate limit exceeded multiple times
    if (event.type === 'rate_limit_exceeded' && ipEvents.filter(e => e.type === 'rate_limit_exceeded').length >= 5) {
      this.createAlert('persistent_rate_limit', event.ip, 'high', 'Persistent rate limit violations detected');
      this.suspiciousIPs.add(event.ip);
    }
    
    // Potential bot behavior
    if (event.type === 'potential_bot' && ipEvents.length >= 10) {
      this.createAlert('bot_activity', event.ip, 'medium', 'High volume of automated requests detected');
      this.suspiciousIPs.add(event.ip);
    }
    
    // Admin access attempts
    if (event.type === 'admin_access' && ipEvents.filter(e => e.type === 'admin_access').length >= 3) {
      this.createAlert('admin_access_attempts', event.ip, 'critical', 'Multiple admin access attempts detected');
    }
  }

  /**
   * Create a security alert
   */
  private createAlert(type: string, ip: string, severity: 'low' | 'medium' | 'high' | 'critical', details: string): void {
    const existingAlert = this.alerts.find(a => a.type === type && a.ips.includes(ip));
    
    if (existingAlert) {
      existingAlert.count++;
      existingAlert.lastSeen = new Date();
      if (!existingAlert.ips.includes(ip)) {
        existingAlert.ips.push(ip);
      }
    } else {
      const alert: SecurityAlert = {
        id: `${type}_${Date.now()}`,
        type,
        count: 1,
        firstSeen: new Date(),
        lastSeen: new Date(),
        ips: [ip],
        details
      };
      this.alerts.push(alert);
    }
    
    // Log critical alerts immediately
    if (severity === 'critical') {
      console.error(`🚨 CRITICAL SECURITY ALERT: ${type} - ${details} from ${ip}`);
    }
  }

  /**
   * Get recent security events
   */
  private getRecentEvents(timeWindow: number): SecurityEvent[] {
    const cutoff = new Date(Date.now() - timeWindow);
    return this.events.filter(e => e.timestamp >= cutoff);
  }

  /**
   * Check if IP is suspicious
   */
  isSuspiciousIP(ip: string): boolean {
    return this.suspiciousIPs.has(ip);
  }

  /**
   * Get security summary
   */
  getSecuritySummary(): {
    totalEvents: number;
    recentEvents: number;
    activeAlerts: number;
    suspiciousIPs: number;
  } {
    const recentEvents = this.getRecentEvents(24 * 60 * 60 * 1000); // Last 24 hours
    
    return {
      totalEvents: this.events.length,
      recentEvents: recentEvents.length,
      activeAlerts: this.alerts.length,
      suspiciousIPs: this.suspiciousIPs.size
    };
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(): SecurityAlert[] {
    return this.alerts.slice(-10); // Last 10 alerts
  }
}

// Export singleton instance
export const securityMonitor = new SecurityMonitor();

// Helper functions for common security checks
export function detectSuspiciousPatterns(userAgent: string = '', body: any = {}): boolean {
  const suspiciousUserAgents = [
    'bot', 'crawler', 'scraper', 'spider', 'python', 'curl', 'wget', 'axios', 'requests'
  ];
  
  const suspiciousPatterns = [
    /script/i, /javascript/i, /vbscript/i, /onload/i, /onerror/i, /onclick/i,
    /select.*from/i, /union.*select/i, /drop.*table/i, /insert.*into/i,
    /<script/i, /<iframe/i, /<object/i, /<embed/i
  ];
  
  // Check user agent
  if (suspiciousUserAgents.some(pattern => userAgent.toLowerCase().includes(pattern))) {
    return true;
  }
  
  // Check body content for suspicious patterns
  const bodyString = JSON.stringify(body);
  if (suspiciousPatterns.some(pattern => pattern.test(bodyString))) {
    return true;
  }
  
  return false;
}

export function extractClientIP(request: Request): string {
  const headers = request.headers;
  return headers.get('x-forwarded-for')?.split(',')[0] || 
         headers.get('x-real-ip') || 
         headers.get('cf-connecting-ip') ||
         'unknown';
}

export function shouldBlockRequest(ip: string, userAgent: string = ''): boolean {
  // Block known bad IP ranges (you can expand this list)
  const blockedIPRanges = [
    /^10\.0\.0\./, // Example private range (adjust as needed)
    /^192\.168\./, // Example private range (adjust as needed)
  ];
  
  // Check if IP is in blocked range
  if (blockedIPRanges.some(range => range.test(ip))) {
    return true;
  }
  
  // Check if IP is marked as suspicious
  if (securityMonitor.isSuspiciousIP(ip)) {
    return true;
  }
  
  return false;
} 