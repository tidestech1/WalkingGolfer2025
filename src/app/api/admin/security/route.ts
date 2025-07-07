import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdminRequest } from '@/lib/auth/adminAuth';
import { securityMonitor } from '@/lib/utils/securityMonitor';
import { botDetector } from '@/lib/utils/botDetection';
import { addSecurityHeaders } from '@/lib/middleware/security';

/**
 * GET /api/admin/security
 * Get security monitoring dashboard data
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate admin request
    const authResult = await authenticateAdminRequest(request);
    if (!authResult.isAuthenticated) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get security metrics
    const securitySummary = securityMonitor.getSecuritySummary();
    const recentAlerts = securityMonitor.getRecentAlerts();
    const botStats = botDetector.getStats();

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '24h'; // 1h, 24h, 7d, 30d
    const alertType = searchParams.get('alertType'); // Filter by alert type

    // Calculate period-specific metrics
    const periodHours = period === '1h' ? 1 : period === '24h' ? 24 : period === '7d' ? 168 : 720;
    const cutoffTime = new Date(Date.now() - periodHours * 60 * 60 * 1000);

    // Filter alerts by period and type
    let filteredAlerts = recentAlerts.filter(alert => alert.lastSeen >= cutoffTime);
    if (alertType) {
      filteredAlerts = filteredAlerts.filter(alert => alert.type === alertType);
    }

    // Create response data
    const dashboardData = {
      summary: {
        ...securitySummary,
        period: period,
        generatedAt: new Date().toISOString()
      },
      alerts: {
        total: filteredAlerts.length,
        critical: filteredAlerts.filter(a => a.type.includes('admin') || a.type.includes('critical')).length,
        high: filteredAlerts.filter(a => a.type.includes('failed_auth') || a.type.includes('persistent')).length,
        medium: filteredAlerts.filter(a => a.type.includes('rate_limit') || a.type.includes('bot')).length,
        recent: filteredAlerts.slice(0, 10)
      },
      botDetection: {
        ...botStats,
        enabled: true,
        confidence: 'high'
      },
      recommendations: generateSecurityRecommendations(securitySummary, filteredAlerts, botStats)
    };

    const response = NextResponse.json(dashboardData);
    return addSecurityHeaders(response);

  } catch (error) {
    console.error('Security dashboard error:', error);
    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
    return addSecurityHeaders(response);
  }
}

/**
 * POST /api/admin/security/actions
 * Perform security actions (block IPs, clear alerts, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate admin request
    const authResult = await authenticateAdminRequest(request);
    if (!authResult.isAuthenticated) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, data } = body;

    let result;
    switch (action) {
      case 'block_ip':
        result = await blockIP(data.ip, data.reason);
        break;
      case 'unblock_ip':
        result = await unblockIP(data.ip);
        break;
      case 'clear_alerts':
        result = await clearAlerts(data.alertType);
        break;
      case 'update_settings':
        result = await updateSecuritySettings(data.settings);
        break;
      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        );
    }

    // Log the admin action
    securityMonitor.logEvent({
      type: 'admin_access',
      severity: 'medium',
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || '',
      userId: authResult.userId,
      endpoint: '/api/admin/security',
      details: `Admin action: ${action}`
    });

    const response = NextResponse.json({
      success: true,
      action,
      result
    });
    return addSecurityHeaders(response);

  } catch (error) {
    console.error('Security action error:', error);
    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
    return addSecurityHeaders(response);
  }
}

/**
 * Generate security recommendations based on current metrics
 */
function generateSecurityRecommendations(
  summary: any,
  alerts: any[],
  botStats: any
): string[] {
  const recommendations: string[] = [];

  // High number of recent security events
  if (summary.recentEvents > 100) {
    recommendations.push('Consider implementing stricter rate limiting due to high activity');
  }

  // Many suspicious IPs
  if (summary.suspiciousIPs > 10) {
    recommendations.push('Review and potentially block suspicious IP addresses');
  }

  // High bot activity
  if (botStats.suspiciousRequests > 50) {
    recommendations.push('Enable CAPTCHA for public forms to reduce bot activity');
  }

  // Critical alerts
  const criticalAlerts = alerts.filter(a => a.type.includes('admin') || a.type.includes('critical'));
  if (criticalAlerts.length > 0) {
    recommendations.push('Investigate critical security alerts immediately');
  }

  // Multiple failed auth attempts
  const authFailures = alerts.filter(a => a.type.includes('failed_auth'));
  if (authFailures.length > 5) {
    recommendations.push('Consider implementing account lockout after multiple failed attempts');
  }

  // Default recommendations
  if (recommendations.length === 0) {
    recommendations.push('Security monitoring is active and no immediate actions required');
    recommendations.push('Review logs regularly for any suspicious patterns');
  }

  return recommendations;
}

/**
 * Block an IP address
 */
async function blockIP(ip: string, reason: string): Promise<any> {
  // In a real implementation, you'd store this in a database
  // For now, we'll use the security monitor
  securityMonitor.logEvent({
    type: 'admin_access',
    severity: 'high',
    ip,
    userAgent: '',
    details: `IP blocked by admin: ${reason}`
  });

  return {
    ip,
    blocked: true,
    reason,
    timestamp: new Date().toISOString()
  };
}

/**
 * Unblock an IP address
 */
async function unblockIP(ip: string): Promise<any> {
  // In a real implementation, you'd remove from database
  securityMonitor.logEvent({
    type: 'admin_access',
    severity: 'medium',
    ip,
    userAgent: '',
    details: 'IP unblocked by admin'
  });

  return {
    ip,
    blocked: false,
    timestamp: new Date().toISOString()
  };
}

/**
 * Clear alerts of a specific type
 */
async function clearAlerts(alertType?: string): Promise<any> {
  // In a real implementation, you'd update the database
  return {
    cleared: true,
    alertType: alertType || 'all',
    timestamp: new Date().toISOString()
  };
}

/**
 * Update security settings
 */
async function updateSecuritySettings(settings: any): Promise<any> {
  // In a real implementation, you'd update configuration
  return {
    updated: true,
    settings,
    timestamp: new Date().toISOString()
  };
} 