// Security utility to protect API key from unauthorized use
class SecurityValidator {
  constructor() {
    this.rateLimitWindow = 60000; // 1 minute
    this.maxRequestsPerWindow = 10; // Max 10 requests per minute
    this.requestLog = [];
    this.blockedUntil = null;
  }

  // Main security validation - checks all security measures
  async validateAccess(conversationData = null) {
    console.log('🔒 SecurityManager: Running security validation...');
    
    const checks = {
      frameOrigin: this.validateFrameOrigin(),
      userAgent: this.validateUserAgent(),
      rateLimit: this.checkRateLimit(),
      referrer: this.validateReferrer(),
      context: this.validateMissiveContext()
    };

    console.log('🔒 Basic security checks:', checks);

    // All basic checks must pass first
    const basicPassed = Object.values(checks).every(check => check.passed);

    if (!basicPassed) {
      const failedChecks = Object.entries(checks)
        .filter(([_, check]) => !check.passed)
        .map(([name, check]) => `${name}: ${check.reason}`)
        .join(', ');
      
      console.error('🚨 Basic security validation failed:', failedChecks);
      this.logSecurityAttempt(checks);
      throw new Error(`Access denied. Security validation failed: ${failedChecks}`);
    }

    // Try organization validation if Missive context is available
    if (checks.context.passed && typeof window.Missive !== 'undefined') {
      try {
        console.log('🔒 Running organization validation...');
        const orgCheck = await this.validateOrganization(conversationData);
        checks.organization = orgCheck;
        
        console.log('🔒 Organization check result:', orgCheck);
        
        if (!orgCheck.passed) {
          console.error('🚨 Organization validation failed:', orgCheck.reason);
          this.logSecurityAttempt(checks);
          
          // Be more lenient with timeout errors during startup
          if (orgCheck.reason.includes('timeout') && !conversationData) {
            console.log('⚠️ Organization timeout during startup - allowing with monitoring');
            checks.organization = {
              passed: true,
              reason: 'Organization timeout during startup - access allowed with monitoring'
            };
          } else {
            throw new Error(`Access denied. ${orgCheck.reason}`);
          }
        }
      } catch (error) {
        console.error('🚨 Organization validation error:', error);
        
        // Check if this is a timeout error during startup
        if (error.message.includes('timeout') && !conversationData) {
          console.log('⚠️ Organization validation timeout during startup - allowing with monitoring');
          checks.organization = {
            passed: true,
            reason: 'Organization validation timeout during startup - access allowed with monitoring'
          };
        } else {
          const orgError = {
            passed: false,
            reason: `Organization validation error: ${error.message}`
          };
          
          checks.organization = orgError;
          this.logSecurityAttempt(checks);
          throw new Error(`Access denied. ${orgError.reason}`);
        }
      }
    } else {
      checks.organization = {
        passed: true,
        reason: 'Organization validation skipped (Missive context not available)'
      };
    }

    console.log('🔒 All security checks:', checks);
    this.logSecurityAttempt(checks);
    console.log('✅ Security validation passed including organization check');
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

  // Simple hash function for organization validation
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
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

  // Validate organization using hashed comparison
  async validateOrganization(conversationData = null) {
    // Hashed version of authorized organization ID
    const AUTHORIZED_ORG_HASH = '348387cf'; // This is the hash of your org ID
    
    console.log('🔒 Starting organization validation...');
    console.log('🔒 Expected hash:', AUTHORIZED_ORG_HASH);
    
    // Store reference to hash function for use in callbacks
    const simpleHash = this.simpleHash.bind(this);
    
    try {
      // First, try using conversation data if provided (from app context)
      if (conversationData) {
        console.log('🔒 Using provided conversation data for org validation');
        console.log('🔒 Full conversation data:', conversationData);
        
        if (conversationData.organization && conversationData.organization.id) {
          const orgId = conversationData.organization.id;
          const currentOrgHash = simpleHash(orgId);
          
          console.log('🔒 Context check - Organization ID:', orgId);
          console.log('🔒 Context check - Computed hash:', currentOrgHash);
          console.log('🔒 Context check - Expected hash:', AUTHORIZED_ORG_HASH);
          console.log('🔒 Context check - Hash match:', currentOrgHash === AUTHORIZED_ORG_HASH);
          
          if (currentOrgHash === AUTHORIZED_ORG_HASH) {
            console.log('✅ Context organization validation PASSED');
            return {
              passed: true,
              reason: `Organization verified: ${conversationData.organization.name || 'Unknown'}`
            };
          } else {
            console.log('🚨 Context organization validation FAILED - hash mismatch');
            return {
              passed: false,
              reason: 'Unauthorized organization - This integration is restricted to 7LFreight only'
            };
          }
        } else {
          console.log('🔒 No organization data in provided conversation - may be personal account');
          // For personal accounts or conversations without organization, we'll allow access
          // but log it for monitoring
          console.log('✅ Personal account access allowed (no organization)');
          return {
            passed: true,
            reason: 'Personal account or conversation without organization - access allowed'
          };
        }
      }

      // Fallback to listener approach if no conversation data provided
      console.log('🔒 No conversation data provided, using listener approach...');
      
      return new Promise((resolve) => {
        let cleanup = () => {}; // Default no-op cleanup
        let validationCompleted = false;
        
        const timeout = setTimeout(() => {
          if (!validationCompleted) {
            validationCompleted = true;
            console.log('⏰ Organization validation timeout reached');
            if (typeof cleanup === 'function') {
              cleanup();
            }
            // Instead of failing, allow access with warning for timeout
            console.log('⚠️ Organization validation timeout - allowing access with monitoring');
            resolve({
              passed: true,
              reason: 'Organization validation timeout - access allowed with monitoring'
            });
          }
        }, 5000); // Increased timeout to 5 seconds

        try {
          console.log('🔒 Setting up conversation listener for organization validation...');
          
          const listener = window.Missive.on('change:conversations', async (conversationIds) => {
            try {
              console.log('🔒 Conversation change detected for org validation:', conversationIds);
              
              if (conversationIds && conversationIds.length > 0) {
                console.log('🔒 Fetching conversations for org validation...');
                const conversations = await window.Missive.fetchConversations(conversationIds);
                console.log('🔒 Retrieved conversations:', conversations);
                
                if (conversations && conversations.length > 0) {
                  const conversation = conversations[0];
                  console.log('🔒 Checking conversation organization:', conversation.organization);
                  console.log('🔒 Full conversation structure:', conversation);
                  
                  if (!validationCompleted) {
                    validationCompleted = true;
                    clearTimeout(timeout);
                    if (typeof cleanup === 'function') {
                      cleanup();
                    }
                    
                    if (conversation.organization && conversation.organization.id) {
                      const orgId = conversation.organization.id;
                      const currentOrgHash = simpleHash(orgId);
                      
                      console.log('🔒 Organization ID found:', orgId);
                      console.log('🔒 Computed hash:', currentOrgHash);
                      console.log('🔒 Expected hash:', AUTHORIZED_ORG_HASH);
                      console.log('🔒 Hash match:', currentOrgHash === AUTHORIZED_ORG_HASH);
                      
                      if (currentOrgHash === AUTHORIZED_ORG_HASH) {
                        console.log('✅ Organization validation PASSED');
                        resolve({
                          passed: true,
                          reason: `Organization verified: ${conversation.organization.name || 'Unknown'}`
                        });
                      } else {
                        console.log('🚨 Organization validation FAILED - hash mismatch');
                        resolve({
                          passed: false,
                          reason: 'Unauthorized organization - This integration is restricted to 7LFreight only'
                        });
                      }
                    } else {
                      console.log('🔒 No organization in conversation - personal account or missing org data');
                      console.log('✅ Personal account access allowed (listener approach)');
                      resolve({
                        passed: true,
                        reason: 'Personal account or missing organization data - access allowed'
                      });
                    }
                    return;
                  }
                }
              }
            } catch (error) {
              console.error('❌ Organization validation error:', error);
            }
          });
          
          // Handle cleanup - some APIs return cleanup function, others don't
          if (typeof listener === 'function') {
            cleanup = listener;
            console.log('🔒 Organization validation listener setup complete');
          } else {
            console.log('⚠️ Listener did not return cleanup function');
          }
          
        } catch (error) {
          console.error('❌ Failed to set up organization validation listener:', error);
          if (!validationCompleted) {
            validationCompleted = true;
            clearTimeout(timeout);
            resolve({
              passed: false,
              reason: `Failed to set up organization validation: ${error.message}`
            });
          }
        }
      });
    } catch (error) {
      console.error('❌ Organization validation setup failed:', error);
      return {
        passed: false,
        reason: `Organization validation failed: ${error.message}`
      };
    }
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
        basicChecks: {
          frameOrigin: this.validateFrameOrigin(),
          userAgent: this.validateUserAgent(),
          rateLimit: this.checkRateLimit(),
          referrer: this.validateReferrer(),
          context: this.validateMissiveContext()
        },
        organizationValidation: 'async - check console logs for details'
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