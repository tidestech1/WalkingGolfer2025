/**
 * Admin whitelist for bypassing rate limits during soft-launch
 */

// Internal team emails that bypass rate limiting
const ADMIN_EMAILS = [
  'neilrossstewart@gmail.com',
  // Add other team member and early tester emails here
  'neil@tides.biz',
  'mark@stewartgolf.com',
  'mark@stewart.uk',
  'robrigg@me.com',
  'dave@stewartgolf.com',
];

// Admin IPs that bypass rate limiting (if needed)
const ADMIN_IPS: string[] = [
  // Add specific IP addresses if needed
];

export function isAdminUser(email?: string, userId?: string): boolean {
  if (email && ADMIN_EMAILS.includes(email.toLowerCase())) {
    return true;
  }
  
  // You could also check by userId if needed
  return false;
}

export function isAdminIP(ip?: string): boolean {
  if (!ip) return false;
  return ADMIN_IPS.includes(ip);
}

export function shouldBypassRateLimit(email?: string, userId?: string, ip?: string): boolean {
  // During soft launch, be more lenient
  const isSoftLaunch = process.env.SOFT_LAUNCH_MODE === 'true';
  
  if (isSoftLaunch && isAdminUser(email, userId)) {
    return true;
  }
  
  if (isAdminIP(ip)) {
    return true;
  }
  
  return false;
} 