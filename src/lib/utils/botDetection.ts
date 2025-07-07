/**
 * Bot detection utility with honeypot fields and behavioral analysis
 */

interface BotDetectionResult {
  isBot: boolean;
  confidence: number; // 0-1 scale
  reasons: string[];
}

interface RequestMetrics {
  ip: string;
  userAgent: string;
  timestamp: Date;
  endpoint: string;
  formSubmissionTime?: number; // Time taken to submit form
  mouseMovements?: number; // Number of mouse movements (if tracked)
  keystrokes?: number; // Number of keystrokes (if tracked)
}

class BotDetector {
  private requestHistory: Map<string, RequestMetrics[]> = new Map();
  
  /**
   * Analyze request for bot behavior
   */
  analyzeRequest(
    ip: string,
    userAgent: string,
    endpoint: string,
    formData?: any,
    behaviorData?: {
      formSubmissionTime?: number;
      mouseMovements?: number;
      keystrokes?: number;
    }
  ): BotDetectionResult {
    const reasons: string[] = [];
    let confidence = 0;
    
    // Store request metrics
    const metrics: RequestMetrics = {
      ip,
      userAgent,
      timestamp: new Date(),
      endpoint,
      ...behaviorData
    };
    
    if (!this.requestHistory.has(ip)) {
      this.requestHistory.set(ip, []);
    }
    this.requestHistory.get(ip)!.push(metrics);
    
    // Clean old entries (keep last 100 per IP)
    const ipHistory = this.requestHistory.get(ip)!;
    if (ipHistory.length > 100) {
      this.requestHistory.set(ip, ipHistory.slice(-100));
    }
    
    // 1. Check honeypot fields
    if (formData && this.checkHoneypotFields(formData)) {
      reasons.push('Honeypot field filled');
      confidence += 0.9;
    }
    
    // 2. Analyze user agent
    const userAgentAnalysis = this.analyzeUserAgent(userAgent);
    if (userAgentAnalysis.suspicious) {
      reasons.push(`Suspicious user agent: ${userAgentAnalysis.reason}`);
      confidence += userAgentAnalysis.confidence;
    }
    
    // 3. Check request frequency
    const frequencyAnalysis = this.analyzeRequestFrequency(ip);
    if (frequencyAnalysis.suspicious) {
      reasons.push(`High request frequency: ${frequencyAnalysis.reason}`);
      confidence += frequencyAnalysis.confidence;
    }
    
    // 4. Analyze form submission behavior
    if (behaviorData) {
      const behaviorAnalysis = this.analyzeBehavior(behaviorData);
      if (behaviorAnalysis.suspicious) {
        reasons.push(`Suspicious behavior: ${behaviorAnalysis.reason}`);
        confidence += behaviorAnalysis.confidence;
      }
    }
    
    // 5. Check for common bot patterns
    const patternAnalysis = this.analyzePatterns(formData);
    if (patternAnalysis.suspicious) {
      reasons.push(`Bot pattern detected: ${patternAnalysis.reason}`);
      confidence += patternAnalysis.confidence;
    }
    
    // Cap confidence at 1.0
    confidence = Math.min(confidence, 1.0);
    
    return {
      isBot: confidence > 0.7,
      confidence,
      reasons
    };
  }
  
  /**
   * Check honeypot fields
   */
  private checkHoneypotFields(formData: any): boolean {
    const honeypotFields = [
      'website', 'url', 'honeypot', 'bot-field', 'email-confirm', 
      'phone-confirm', 'address-confirm', 'company-name', 'fax'
    ];
    
    for (const field of honeypotFields) {
      if (formData[field] && formData[field].toString().trim() !== '') {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Analyze user agent for bot characteristics
   */
  private analyzeUserAgent(userAgent: string): { suspicious: boolean; reason: string; confidence: number } {
    if (!userAgent) {
      return { suspicious: true, reason: 'Missing user agent', confidence: 0.8 };
    }
    
    const botIndicators = [
      'bot', 'crawler', 'scraper', 'spider', 'python', 'curl', 'wget', 
      'axios', 'requests', 'httpie', 'postman', 'insomnia'
    ];
    
    const lowerUA = userAgent.toLowerCase();
    
    for (const indicator of botIndicators) {
      if (lowerUA.includes(indicator)) {
        return { suspicious: true, reason: `Contains "${indicator}"`, confidence: 0.9 };
      }
    }
    
    // Check for overly generic user agents
    if (userAgent === 'Mozilla/5.0' || userAgent.length < 10) {
      return { suspicious: true, reason: 'Generic or too short user agent', confidence: 0.6 };
    }
    
    // Check for missing common browser identifiers
    if (!lowerUA.includes('mozilla') && !lowerUA.includes('webkit') && !lowerUA.includes('chrome') && !lowerUA.includes('firefox')) {
      return { suspicious: true, reason: 'Missing common browser identifiers', confidence: 0.5 };
    }
    
    return { suspicious: false, reason: '', confidence: 0 };
  }
  
  /**
   * Analyze request frequency
   */
  private analyzeRequestFrequency(ip: string): { suspicious: boolean; reason: string; confidence: number } {
    const ipHistory = this.requestHistory.get(ip) || [];
    const now = new Date();
    
    // Check requests in last minute
    const lastMinute = ipHistory.filter(req => now.getTime() - req.timestamp.getTime() < 60000);
    if (lastMinute.length > 20) {
      return { suspicious: true, reason: `${lastMinute.length} requests in last minute`, confidence: 0.8 };
    }
    
    // Check requests in last hour
    const lastHour = ipHistory.filter(req => now.getTime() - req.timestamp.getTime() < 3600000);
    if (lastHour.length > 100) {
      return { suspicious: true, reason: `${lastHour.length} requests in last hour`, confidence: 0.6 };
    }
    
    // Check for perfectly timed requests (indicating automation)
    if (lastMinute.length >= 3) {
      const intervals = [];
      for (let i = 1; i < lastMinute.length; i++) {
        intervals.push(lastMinute[i].timestamp.getTime() - lastMinute[i-1].timestamp.getTime());
      }
      
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
      
      if (variance < 100) { // Very consistent timing
        return { suspicious: true, reason: 'Perfectly timed requests detected', confidence: 0.7 };
      }
    }
    
    return { suspicious: false, reason: '', confidence: 0 };
  }
  
  /**
   * Analyze user behavior patterns
   */
  private analyzeBehavior(behaviorData: {
    formSubmissionTime?: number;
    mouseMovements?: number;
    keystrokes?: number;
  }): { suspicious: boolean; reason: string; confidence: number } {
    const { formSubmissionTime, mouseMovements, keystrokes } = behaviorData;
    
    // Form submitted too quickly (less than 2 seconds)
    if (formSubmissionTime && formSubmissionTime < 2000) {
      return { suspicious: true, reason: `Form submitted in ${formSubmissionTime}ms`, confidence: 0.8 };
    }
    
    // No mouse movements recorded
    if (mouseMovements !== undefined && mouseMovements === 0) {
      return { suspicious: true, reason: 'No mouse movements detected', confidence: 0.6 };
    }
    
    // No keystrokes recorded (but form has text)
    if (keystrokes !== undefined && keystrokes === 0) {
      return { suspicious: true, reason: 'No keystrokes detected', confidence: 0.7 };
    }
    
    return { suspicious: false, reason: '', confidence: 0 };
  }
  
  /**
   * Analyze common bot patterns
   */
  private analyzePatterns(formData: any): { suspicious: boolean; reason: string; confidence: number } {
    if (!formData) {
      return { suspicious: false, reason: '', confidence: 0 };
    }
    
    const dataString = JSON.stringify(formData).toLowerCase();
    
    // Check for common bot test strings
    const botPatterns = [
      'test', 'bot', 'automated', 'script', 'crawler', 'robot',
      'asdf', 'qwerty', '123456', 'lorem ipsum'
    ];
    
    for (const pattern of botPatterns) {
      if (dataString.includes(pattern)) {
        return { suspicious: true, reason: `Contains bot pattern: ${pattern}`, confidence: 0.5 };
      }
    }
    
    // Check for duplicate content across fields
    const values = Object.values(formData).filter(v => typeof v === 'string' && v.length > 0);
    const uniqueValues = new Set(values);
    
    if (values.length > 2 && uniqueValues.size === 1) {
      return { suspicious: true, reason: 'Duplicate content across fields', confidence: 0.7 };
    }
    
    return { suspicious: false, reason: '', confidence: 0 };
  }
  
  /**
   * Get summary of bot detection statistics
   */
  getStats(): {
    totalRequests: number;
    uniqueIPs: number;
    suspiciousRequests: number;
  } {
    let totalRequests = 0;
    let suspiciousRequests = 0;
    
    for (const [ip, history] of this.requestHistory) {
      totalRequests += history.length;
      // Count requests from this IP that would be flagged as suspicious
      for (const req of history) {
        const analysis = this.analyzeRequest(req.ip, req.userAgent, req.endpoint);
        if (analysis.isBot) {
          suspiciousRequests++;
        }
      }
    }
    
    return {
      totalRequests,
      uniqueIPs: this.requestHistory.size,
      suspiciousRequests
    };
  }
}

// Export singleton instance
export const botDetector = new BotDetector();

// Helper function to generate honeypot fields for forms
export function generateHoneypotFields(): { [key: string]: string } {
  const fields = ['website', 'url', 'phone-confirm', 'email-confirm'];
  const honeypotFields: { [key: string]: string } = {};
  
  // Randomly select 1-2 fields to include
  const numFields = Math.floor(Math.random() * 2) + 1;
  const selectedFields = fields.sort(() => 0.5 - Math.random()).slice(0, numFields);
  
  for (const field of selectedFields) {
    honeypotFields[field] = '';
  }
  
  return honeypotFields;
}

// Helper function to create invisible honeypot CSS
export function getHoneypotCSS(): string {
  return `
    .honeypot {
      position: absolute !important;
      left: -9999px !important;
      top: -9999px !important;
      width: 1px !important;
      height: 1px !important;
      opacity: 0 !important;
      visibility: hidden !important;
    }
  `;
} 