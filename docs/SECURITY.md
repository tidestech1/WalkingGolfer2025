# Walking Golfer Security Documentation

This document outlines the comprehensive security measures implemented in the Walking Golfer application to protect against abuse, bots, and other security threats.

## Security Overview

The Walking Golfer app implements multiple layers of security protection:

1. **Content Security Policy (CSP)**
2. **Bot Detection & Prevention**
3. **Rate Limiting**
4. **Authentication & Authorization**
5. **Input Validation & Sanitization**
6. **Security Monitoring & Alerting**
7. **Firebase Security Rules**
8. **API Security**

## 1. Content Security Policy (CSP)

### Implementation
- Located in: `next.config.mjs`
- Comprehensive CSP headers that restrict resource loading
- Prevents XSS attacks by controlling script execution

### Key Protections
- `script-src`: Only allows scripts from trusted domains
- `style-src`: Controls CSS loading sources
- `img-src`: Restricts image loading to trusted domains
- `connect-src`: Limits API/network connections
- `frame-src`: Controls iframe embedding

### Configuration
```javascript
// CSP is disabled in development for easier debugging
const isDev = process.env.NODE_ENV === 'development';
```

## 2. Bot Detection & Prevention

### Implementation
- Bot detection utility: `src/lib/utils/botDetection.ts`
- Honeypot fields for forms
- Behavioral analysis
- User agent analysis

### Detection Methods
1. **Honeypot Fields**: Hidden form fields that bots often fill
2. **User Agent Analysis**: Detects bot-like user agents
3. **Request Frequency**: Identifies automated request patterns
4. **Behavioral Analysis**: Monitors form submission timing and interaction patterns
5. **Pattern Recognition**: Detects common bot test strings

### Usage
```typescript
import { botDetector, generateHoneypotFields } from '@/lib/utils/botDetection';

// Analyze request for bot behavior
const analysis = botDetector.analyzeRequest(ip, userAgent, endpoint, formData);
if (analysis.isBot) {
  // Block request
}

// Generate honeypot fields for forms
const honeypotFields = generateHoneypotFields();
```

## 3. Rate Limiting

### Implementation
- Rate limiter utility: `src/lib/utils/rateLimiter.ts`
- Different limits for development/production
- Admin bypass functionality
- Per-IP and per-user limits

### Configuration
```typescript
// Production limits (strict)
reviewSubmitPerIP: { limit: 3, window: 60 * 60 * 1000 }, // 3 per hour
reviewSubmitPerUser: { limit: 5, window: 24 * 60 * 60 * 1000 }, // 5 per day

// Development/Soft-launch limits (lenient)
reviewSubmitPerIP: { limit: 50, window: 60 * 60 * 1000 }, // 50 per hour
reviewSubmitPerUser: { limit: 100, window: 24 * 60 * 60 * 1000 }, // 100 per day
```

### Admin Bypass
- Configured in: `src/lib/utils/adminWhitelist.ts`
- Allows trusted users to bypass rate limits during testing
- Based on email addresses and IP ranges

## 4. Authentication & Authorization

### Firebase Authentication
- Implemented with custom claims for admin roles
- Token verification on all protected routes
- Session management with secure tokens

### Admin Authentication
- Custom admin verification: `src/lib/auth/adminAuth.ts`
- Temporary admin tokens for enhanced security
- Role-based access control

### Security Features
- Token expiration and refresh
- Admin-only endpoints protection
- User profile verification

## 5. Input Validation & Sanitization

### Zod Schema Validation
- All API endpoints use Zod for input validation
- Type-safe data validation
- Automatic sanitization of inputs

### Example Implementation
```typescript
const submitReviewSchema = z.object({
  courseId: z.string().min(1),
  walkabilityRating: z.number().min(1).max(5),
  comment: z.string().optional(),
  // ... other fields
});
```

### Security Patterns
- Email format validation
- URL validation for image uploads
- Length limits on text fields
- Numeric range validation

## 6. Security Monitoring & Alerting

### Security Monitor
- Real-time security event tracking: `src/lib/utils/securityMonitor.ts`
- Automated threat detection
- Alert generation for suspicious activity

### Monitored Events
- `rate_limit_exceeded`: Too many requests from single source
- `suspicious_request`: Potential malicious requests
- `failed_auth`: Authentication failures
- `potential_bot`: Automated request detection
- `admin_access`: Admin actions logging
- `invalid_token`: Token manipulation attempts

### Alert Thresholds
- Multiple failed auth attempts (3+ in 5 minutes)
- Persistent rate limit violations (5+ in 5 minutes)
- High volume automated requests (10+ in 5 minutes)
- Admin access attempts (3+ in 5 minutes)

### Dashboard Access
- Admin security dashboard: `/api/admin/security`
- Real-time metrics and alerts
- Action capabilities (block IPs, clear alerts)

## 7. Firebase Security Rules

### Firestore Rules
- Located in: `firestore.rules`
- Granular permissions for each collection
- Authentication-based access control

### Key Rules
```javascript
// Reviews: Users can create, modify their own
match /reviews/{reviewId} {
  allow read: if true;
  allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
  allow update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
}

// Courses: Public read, admin write only
match /courses/{courseId} {
  allow read: if true;
  allow write: if request.auth != null && request.auth.token.email == "neilrossstewart@gmail.com";
}
```

### Storage Rules
- Located in: `storage.rules`
- File type validation (images only)
- Size limits (5MB max)
- Path validation to prevent directory traversal

## 8. API Security

### Security Middleware
- Comprehensive security middleware: `src/lib/middleware/security.ts`
- Applied to all API routes
- Configurable security policies

### Features
- IP blocking for malicious addresses
- Bot detection integration
- Rate limiting enforcement
- Suspicious pattern detection
- Security headers injection

### Usage
```typescript
import { withSecurity } from '@/lib/middleware/security';

export const POST = withSecurity(async (request) => {
  // Your API logic here
}, {
  enableBotDetection: true,
  enableRateLimit: true,
  customRateLimit: { limit: 10, windowMs: 60000 }
});
```

## Security Headers

### Implemented Headers
- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-Content-Type-Options: nosniff` - Prevents MIME sniffing
- `X-XSS-Protection: 1; mode=block` - XSS protection
- `Strict-Transport-Security` - Forces HTTPS
- `Referrer-Policy: strict-origin-when-cross-origin` - Controls referrer info
- `Content-Security-Policy` - Comprehensive CSP
- `Permissions-Policy` - Controls browser features

## Environment-Based Security

### Development Mode
- More lenient rate limits
- CSP disabled for easier debugging
- Detailed error messages

### Production Mode
- Strict rate limits
- Full CSP enforcement
- Minimal error disclosure
- Enhanced monitoring

### Soft Launch Mode
- Moderate rate limits
- Extended admin bypass
- Detailed logging
- Gradual rollout protection

## Best Practices

### For Developers
1. Always use the security middleware on new API routes
2. Implement proper input validation with Zod
3. Follow the Firebase security rules patterns
4. Test with different user agents to avoid false positives
5. Monitor security logs regularly

### For Administrators
1. Regularly review the security dashboard
2. Investigate alerts promptly
3. Update admin whitelist as needed
4. Monitor for new attack patterns
5. Keep Firebase rules up to date

### For Deployment
1. Ensure all environment variables are set
2. Test security headers in production
3. Verify CSP doesn't block legitimate resources
4. Monitor application logs for security events
5. Set up external monitoring for critical alerts

## Monitoring & Maintenance

### Regular Tasks
- Review security logs weekly
- Update bot detection patterns monthly
- Review and update rate limits based on usage
- Test security measures regularly
- Update dependencies for security patches

### Key Metrics to Monitor
- Failed authentication attempts
- Rate limit violations
- Bot detection triggers
- Suspicious IP activity
- Admin access patterns

### Incident Response
1. Identify the threat type
2. Use admin dashboard to block IPs if needed
3. Investigate the attack pattern
4. Update security rules if necessary
5. Document the incident for future reference

## API Endpoints

### Security Dashboard
- `GET /api/admin/security` - Get security metrics
- `POST /api/admin/security` - Perform security actions

### Query Parameters
- `period`: `1h`, `24h`, `7d`, `30d` - Time period for metrics
- `alertType`: Filter alerts by type

### Security Actions
- `block_ip`: Block an IP address
- `unblock_ip`: Unblock an IP address
- `clear_alerts`: Clear security alerts
- `update_settings`: Update security configuration

## Configuration Files

### Security Configuration
- `next.config.mjs` - CSP and security headers
- `firestore.rules` - Database security rules
- `storage.rules` - File storage security rules
- `src/lib/utils/adminWhitelist.ts` - Admin bypass configuration

### Environment Variables
- `NODE_ENV` - Development/production mode
- `SOFT_LAUNCH_MODE` - Soft launch configuration
- `RATE_LIMIT_TIER` - Rate limiting tier
- `DEPLOYMENT_STAGE` - Deployment stage configuration

## Troubleshooting

### Common Issues
1. **CSP Violations**: Check browser console for blocked resources
2. **Rate Limit Errors**: Verify admin bypass configuration
3. **Bot False Positives**: Adjust bot detection thresholds
4. **Authentication Issues**: Check Firebase token expiration

### Debug Mode
Set `NODE_ENV=development` to enable:
- Detailed error messages
- Relaxed rate limits
- Disabled CSP
- Enhanced logging

## Security Recommendations

### Immediate Actions
1. Review and test all implemented security measures
2. Set up monitoring alerts for critical events
3. Ensure admin team is trained on security dashboard
4. Test bot detection with various user agents
5. Verify rate limits are appropriate for your usage

### Ongoing Security
1. Regular security audits
2. Keep dependencies updated
3. Monitor for new attack patterns
4. Review and update security rules quarterly
5. Train team on security best practices

## Contact

For security-related questions or incidents, contact the development team or file an issue in the project repository.

---

*This documentation is maintained alongside the codebase and should be updated when security measures are modified.* 