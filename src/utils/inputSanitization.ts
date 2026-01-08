/**
 * Input sanitization utility for security
 * Prevents XSS attacks and validates user input
 * Compliant with OWASP Top 10 2025 standards
 */

/**
 * Sanitize text input to prevent XSS attacks
 * Removes potentially dangerous HTML/script tags
 */
export function sanitizeTextInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Remove null bytes
  let sanitized = input.replace(/\0/g, '');

  // Remove script tags and event handlers
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/data:text\/html/gi, '');

  // Remove HTML tags but preserve text content
  sanitized = sanitized.replace(/<[^>]+>/g, '');

  // Decode HTML entities
  sanitized = sanitized
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');

  // Trim whitespace
  sanitized = sanitized.trim();

  return sanitized;
}

/**
 * Validate and sanitize description input
 * Ensures description meets requirements
 */
export function sanitizeDescription(description: string): string {
  const sanitized = sanitizeTextInput(description);

  // Enforce length limits
  const MAX_LENGTH = 5000; // Reasonable limit for AI prompts
  if (sanitized.length > MAX_LENGTH) {
    return sanitized.substring(0, MAX_LENGTH);
  }

  return sanitized;
}

/**
 * Validate email format (basic validation)
 */
export function isValidEmail(email: string): boolean {
  if (typeof email !== 'string') {
    return false;
  }

  // Basic email regex (RFC 5322 simplified)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim()) && email.length <= 254; // RFC 5321 limit
}

/**
 * Validate password strength
 * Returns object with validation result and suggestions
 */
export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (typeof password !== 'string') {
    return { valid: false, errors: ['Password must be a string'] };
  }

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }

  if (password.length > 128) {
    errors.push('Password must be less than 128 characters');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  // Check for common weak passwords
  const commonPasswords = ['password', '12345678', 'qwerty', 'abc123'];
  if (commonPasswords.some((common) => password.toLowerCase().includes(common))) {
    errors.push('Password is too common');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize file name to prevent path traversal attacks
 */
export function sanitizeFileName(fileName: string): string {
  if (typeof fileName !== 'string') {
    return 'file';
  }

  // Remove path separators and dangerous characters
  let sanitized = fileName
    .replace(/[\/\\]/g, '_') // Replace path separators
    .replace(/\.\./g, '_') // Remove parent directory references
    .replace(/[<>:"|?*]/g, '_') // Remove Windows reserved characters
    .trim();

  // Ensure it's not empty
  if (!sanitized) {
    sanitized = 'file';
  }

  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.substring(sanitized.lastIndexOf('.'));
    sanitized = sanitized.substring(0, 255 - ext.length) + ext;
  }

  return sanitized;
}

/**
 * Validate URL to prevent SSRF attacks
 */
export function isValidUrl(url: string, allowedProtocols: string[] = ['https:', 'http:']): boolean {
  if (typeof url !== 'string') {
    return false;
  }

  try {
    const parsed = new URL(url);
    
    // Check protocol
    if (!allowedProtocols.includes(parsed.protocol)) {
      return false;
    }

    // Block localhost and private IPs (SSRF protection)
    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.16.') ||
      hostname.startsWith('172.17.') ||
      hostname.startsWith('172.18.') ||
      hostname.startsWith('172.19.') ||
      hostname.startsWith('172.20.') ||
      hostname.startsWith('172.21.') ||
      hostname.startsWith('172.22.') ||
      hostname.startsWith('172.23.') ||
      hostname.startsWith('172.24.') ||
      hostname.startsWith('172.25.') ||
      hostname.startsWith('172.26.') ||
      hostname.startsWith('172.27.') ||
      hostname.startsWith('172.28.') ||
      hostname.startsWith('172.29.') ||
      hostname.startsWith('172.30.') ||
      hostname.startsWith('172.31.')
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
