// Security utility to protect API key from unauthorized use
class SecurityValidator {
  constructor() {
    this.rateLimitWindow = 60000; // 1 minute
    this.maxRequestsPerWindow = 10; // Max 10 requests per minute
    this.requestLog = [];
    this.blockedUntil = null;
  }

  // Main security validation - checks all security measures
  validateAccess() {
    console.log('🔒 SecurityManager: Running security validation...');
    
    const checks = {
      frameOrigin: this.validateFrameOrigin(),
      userAgent: this.validateUserAgent(),
      rateLimit: this.checkRateLimit(),
      referrer: this.validateReferrer(),
      context: this.validateMissiveContext()
    };

    console.log('🔒 Security checks:', checks);

    // Log security attempt
    this.logSecurityAttempt(checks);

    // All checks must pass
    const allPassed = Object.values(checks).every(check => check.passed);

    if (!allPassed) {
      const failedChecks = Object.entries(checks)
        .filter(([_, check]) => !check.passed)
        .map(([name, check]) => `${name}: ${check.reason}`)
        .join(', ');
      
      console.error('🚨 Security validation failed:', failedChecks);
      throw new Error(`Access denied. Security validation failed: ${failedChecks}`);
    }

    console.log('✅ Security validation passed');
    return true;
  }

  // Check if app is embedded in Missive iframe
  validateFrameOrigin() {
    try {
      // Allow localhost for development
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return {
          passed: true,
          reason: 'Development environment - localhost allowed'
        };
      }

      // Check if we're in an iframe
      if (window.self === window.top) {
        return {
          passed: false,
          reason: 'Not running in iframe (direct access detected)'
        };
      }

      // Try to access parent origin (will throw if different origin due to CORS)
      let parentOrigin = null;
      try {
        parentOrigin = window.parent.location.origin;
      } catch (e) {
        // Cross-origin iframe - this is expected for Missive
        // We can't directly check the parent origin due to CORS, but we can use other methods
      }

      // Check document.referrer for Missive domains
      const referrer = document.referrer.toLowerCase();
      const missiveDomains = [
        'missiveapp.com',
        'mail.missiveapp.com', 
        'app.missiveapp.com',
        'missive.com'
      ];

      const isFromMissive = missiveDomains.some(domain => 
        referrer.includes(domain)
      );

      if (!isFromMissive && !referrer.includes('localhost')) {
        return {
          passed: false,
          reason: `Invalid referrer origin: ${referrer}`
        };
      }

      return {
        passed: true,
        reason: 'Valid iframe context'
      };
    } catch (error) {
      return {
        passed: false,
        reason: `Frame validation error: ${error.message}`
      };
    }
  }

  // Validate User-Agent for Missive-specific patterns
  validateUserAgent() {
    const userAgent = navigator.userAgent.toLowerCase();
    
    // Missive typically runs in Electron or specific browsers
    const validPatterns = [
      'electron',
      'missive',
      'chrome', // Missive web version
      'safari', // macOS Missive
      'firefox' // Some Missive installations
    ];

    // Check for suspicious patterns that indicate automated access
    const suspiciousPatterns = [
      'bot',
      'crawler',
      'spider',
      'scraper',
      'headless',
      'phantom',
      'selenium',
      'playwright',
      'puppeteer'
    ];

    const hasSuspiciousPattern = suspiciousPatterns.some(pattern => 
      userAgent.includes(pattern)
    );

    if (hasSuspiciousPattern) {
      return {
        passed: false,
        reason: `Suspicious user agent detected: ${userAgent}`
      };
    }

    const hasValidPattern = validPatterns.some(pattern => 
      userAgent.includes(pattern)
    );

    if (!hasValidPattern) {
      return {
        passed: false,
        reason: `Invalid user agent: ${userAgent}`
      };
    }

    return {
      passed: true,
      reason: 'Valid user agent'
    };
  }

  // Basic rate limiting to prevent abuse
  checkRateLimit() {
    const now = Date.now();
    
    // Check if we're in a blocked state
    if (this.blockedUntil && now < this.blockedUntil) {
      return {
        passed: false,
        reason: `Rate limited until ${new Date(this.blockedUntil).toISOString()}`
      };
    }

    // Clean old requests outside the window
    this.requestLog = this.requestLog.filter(
      timestamp => now - timestamp < this.rateLimitWindow
    );

    // Add current request
    this.requestLog.push(now);

    // Check if we've exceeded the limit
    if (this.requestLog.length > this.maxRequestsPerWindow) {
      // Block for 5 minutes
      this.blockedUntil = now + (5 * 60 * 1000);
      
      return {
        passed: false,
        reason: `Rate limit exceeded: ${this.requestLog.length} requests in ${this.rateLimitWindow}ms`
      };
    }

    return {
      passed: true,
      reason: `Rate limit OK: ${this.requestLog.length}/${this.maxRequestsPerWindow} requests`
    };
  }

  // Validate referrer header
  validateReferrer() {
    const referrer = document.referrer.toLowerCase();
    
    // Allow localhost for development
    if (referrer.includes('localhost') || referrer.includes('127.0.0.1')) {
      return {
        passed: true,
        reason: 'Development environment'
      };
    }

    // Check for Missive domains
    const missiveDomains = [
      'missiveapp.com',
      'mail.missiveapp.com',
      'app.missiveapp.com',
      'missive.com'
    ];

    const isValidReferrer = missiveDomains.some(domain => 
      referrer.includes(domain)
    );

    if (!isValidReferrer) {
      return {
        passed: false,
        reason: `Invalid referrer: ${referrer}`
      };
    }

    return {
      passed: true,
      reason: 'Valid referrer'
    };
  }

  // Validate Missive context (API availability)
  validateMissiveContext() {
    // Check if Missive API is available
    if (typeof window.Missive === 'undefined') {
      return {
        passed: false,
        reason: 'Missive API not available'
      };
    }

    // Check for expected Missive API methods
    const requiredMethods = ['on', 'fetchConversations', 'fetchMessages'];
    const missingMethods = requiredMethods.filter(method => 
      typeof window.Missive[method] !== 'function'
    );

    if (missingMethods.length > 0) {
      return {
        passed: false,
        reason: `Missing Missive API methods: ${missingMethods.join(', ')}`
      };
    }

    return {
      passed: true,
      reason: 'Valid Missive context'
    };
  }

  // Log security attempts for monitoring
  logSecurityAttempt(checks) {
    const timestamp = new Date().toISOString();
    const userAgent = navigator.userAgent;
    const referrer = document.referrer;
    const url = window.location.href;
    
    const securityEvent = {
      timestamp,
      userAgent,
      referrer,
      url,
      checks,
      passed: Object.values(checks).every(check => check.passed)
    };

    // Log to console for debugging
    console.log('🔒 Security Event:', securityEvent);

    // In production, you might want to send this to a monitoring service
    // or store it in local storage for later analysis
    try {
      const existingLogs = JSON.parse(localStorage.getItem('security_logs') || '[]');
      existingLogs.push(securityEvent);
      
      // Keep only last 50 logs to prevent storage bloat
      if (existingLogs.length > 50) {
        existingLogs.splice(0, existingLogs.length - 50);
      }
      
      localStorage.setItem('security_logs', JSON.stringify(existingLogs));
    } catch (error) {
      console.warn('Failed to store security log:', error);
    }
  }

  // Get security status for debugging
  getSecurityStatus() {
    try {
      return {
        rateLimitStatus: {
          requestsInWindow: this.requestLog.length,
          maxRequests: this.maxRequestsPerWindow,
          blockedUntil: this.blockedUntil,
          windowDuration: this.rateLimitWindow
        },
        lastChecks: this.validateAccess()
      };
    } catch (error) {
      return {
        error: error.message,
        rateLimitStatus: {
          requestsInWindow: this.requestLog.length,
          maxRequests: this.maxRequestsPerWindow,
          blockedUntil: this.blockedUntil
        }
      };
    }
  }
}

// Create and export singleton instance
const SecurityManager = new SecurityValidator();
export { SecurityManager }; 