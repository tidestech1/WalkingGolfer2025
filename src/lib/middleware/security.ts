/**
 * Security middleware for API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { securityMonitor, extractClientIP, shouldBlockRequest, detectSuspiciousPatterns } from '../utils/securityMonitor';
import { botDetector } from '../utils/botDetection';
import { rateLimit, getRateLimitHeaders } from '../utils/rateLimiter';
import { shouldBypassRateLimit } from '../utils/adminWhitelist';

export interface SecurityConfig {
  enableBotDetection?: boolean;
  enableRateLimit?: boolean;
  enableSuspiciousPatternDetection?: boolean;
  enableIPBlocking?: boolean;
  customRateLimit?: {
    limit: number;
    windowMs: number;
  };
  bypassForAdmins?: boolean;
}

export interface SecurityResult {
  allowed: boolean;
  reason?: string;
  response?: NextResponse;
  metadata?: {
    ip: string;
    userAgent: string;
    botDetection?: any;
    rateLimit?: any;
  };
}

/**
 * Main security middleware function
 */
export async function securityMiddleware(
  request: NextRequest,
  config: SecurityConfig = {}
): Promise<SecurityResult> {
  const {
    enableBotDetection = true,
    enableRateLimit = true,
    enableSuspiciousPatternDetection = true,
    enableIPBlocking = true,
    customRateLimit,
    bypassForAdmins = true
  } = config;

  const ip = extractClientIP(request);
  const userAgent = request.headers.get('user-agent') || '';
  const endpoint = request.nextUrl.pathname;
  
  const metadata = {
    ip,
    userAgent,
    botDetection: undefined as any,
    rateLimit: undefined as any
  };

  // 1. Check if IP should be blocked
  if (enableIPBlocking && shouldBlockRequest(ip, userAgent)) {
    securityMonitor.logEvent({
      type: 'suspicious_request',
      severity: 'high',
      ip,
      userAgent,
      endpoint,
      details: 'IP blocked due to suspicious activity'
    });

    return {
      allowed: false,
      reason: 'IP blocked',
      response: NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      ),
      metadata
    };
  }

  // 2. Bot detection
  if (enableBotDetection) {
    let formData: any = null;
    
    // Try to get form data for bot analysis
    try {
      if (request.method === 'POST' && request.headers.get('content-type')?.includes('application/json')) {
        const clonedRequest = request.clone();
        formData = await clonedRequest.json();
      }
    } catch (e) {
      // Ignore parsing errors
    }

    const botAnalysis = botDetector.analyzeRequest(ip, userAgent, endpoint, formData);
    metadata.botDetection = botAnalysis;

    if (botAnalysis.isBot) {
      securityMonitor.logEvent({
        type: 'potential_bot',
        severity: 'medium',
        ip,
        userAgent,
        endpoint,
        details: `Bot detected: ${botAnalysis.reasons.join(', ')} (confidence: ${botAnalysis.confidence})`
      });

      return {
        allowed: false,
        reason: 'Bot detected',
        response: NextResponse.json(
          { error: 'Automated requests are not allowed' },
          { status: 403 }
        ),
        metadata
      };
    }
  }

  // 3. Suspicious pattern detection
  if (enableSuspiciousPatternDetection) {
    let body: any = null;
    
    try {
      if (request.method === 'POST') {
        const clonedRequest = request.clone();
        body = await clonedRequest.json();
      }
    } catch (e) {
      // Ignore parsing errors
    }

    if (detectSuspiciousPatterns(userAgent, body)) {
      securityMonitor.logEvent({
        type: 'suspicious_request',
        severity: 'medium',
        ip,
        userAgent,
        endpoint,
        details: 'Suspicious patterns detected in request'
      });

      return {
        allowed: false,
        reason: 'Suspicious patterns detected',
        response: NextResponse.json(
          { error: 'Invalid request' },
          { status: 400 }
        ),
        metadata
      };
    }
  }

  // 4. Rate limiting
  if (enableRateLimit) {
    // Check if should bypass rate limiting
    let shouldBypass = false;
    
    if (bypassForAdmins) {
      // For admin bypass, we need to check if user is authenticated
      // This is a simplified check - in practice, you might want to verify the token
      const authHeader = request.headers.get('authorization');
      if (authHeader) {
        try {
          // Extract email from token if possible (simplified)
          // In production, you'd want to verify the token properly
          shouldBypass = shouldBypassRateLimit(undefined, undefined, ip);
        } catch (e) {
          // Ignore token parsing errors
        }
      }
    }

    if (!shouldBypass) {
      const rateLimitKey = `${endpoint}_${ip}`;
      const rateLimitConfig = customRateLimit || { limit: 10, windowMs: 15 * 60 * 1000 }; // 10 requests per 15 minutes default
      
      const rateLimitResult = rateLimit(rateLimitKey, rateLimitConfig.limit, rateLimitConfig.windowMs);
      metadata.rateLimit = rateLimitResult;

      if (!rateLimitResult.success) {
        securityMonitor.logEvent({
          type: 'rate_limit_exceeded',
          severity: 'medium',
          ip,
          userAgent,
          endpoint,
          details: `Rate limit exceeded: ${rateLimitResult.remaining}/${rateLimitResult.limit}`
        });

        return {
          allowed: false,
          reason: 'Rate limit exceeded',
          response: NextResponse.json(
            { error: 'Too many requests' },
            { 
              status: 429,
              headers: getRateLimitHeaders(rateLimitResult)
            }
          ),
          metadata
        };
      }
    }
  }

  return {
    allowed: true,
    metadata
  };
}

/**
 * Convenience function for protecting API routes
 */
export function withSecurity(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>,
  config: SecurityConfig = {}
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    const securityResult = await securityMiddleware(request, config);
    
    if (!securityResult.allowed) {
      return securityResult.response!;
    }
    
    // Add security metadata to request headers for the handler
    const newHeaders = new Headers(request.headers);
    newHeaders.set('x-security-ip', securityResult.metadata!.ip);
    newHeaders.set('x-security-user-agent', securityResult.metadata!.userAgent);
    
    if (securityResult.metadata!.botDetection) {
      newHeaders.set('x-security-bot-score', securityResult.metadata!.botDetection.confidence.toString());
    }
    
    const newRequest = new NextRequest(request.url, {
      method: request.method,
      headers: newHeaders,
      body: request.body
    });
    
    return handler(newRequest, context);
  };
}

/**
 * Express-style middleware for easier integration
 */
export function createSecurityMiddleware(config: SecurityConfig = {}) {
  return (request: NextRequest) => securityMiddleware(request, config);
}

/**
 * Security headers for responses
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Add additional security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  return response;
}

/**
 * Log successful request for monitoring
 */
export function logSecureRequest(
  request: NextRequest,
  response: NextResponse,
  metadata?: any
): void {
  const ip = extractClientIP(request);
  const userAgent = request.headers.get('user-agent') || '';
  const endpoint = request.nextUrl.pathname;
  const statusCode = response.status;
  
  if (statusCode >= 400) {
    securityMonitor.logEvent({
      type: 'failed_auth',
      severity: statusCode >= 500 ? 'high' : 'medium',
      ip,
      userAgent,
      endpoint,
      details: `HTTP ${statusCode} response`
    });
  }
} 