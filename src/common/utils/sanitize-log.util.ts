// src/utils/sanitize-log.util.ts

/**
 * Recursively sanitizes sensitive fields in an object by masking their values.
 */
export function sanitizeLog(data: any): any {
  const SENSITIVE_KEYS = new Set([
    'password',
    'token',
    'authorization',
    'accessToken',
    'refreshToken',
  ]);

  function deepSanitize(value: any): any {
    if (Array.isArray(value)) {
      return value.map(deepSanitize);
    } else if (value && typeof value === 'object') {
      const sanitized: Record<string, any> = {};

      for (const key of Object.keys(value)) {
        const lowerKey = key.toLowerCase();
        if (SENSITIVE_KEYS.has(lowerKey)) {
          sanitized[key] = '***'; // Mask sensitive data
        } else {
          sanitized[key] = deepSanitize(value[key]);
        }
      }

      return sanitized;
    }

    return value;
  }

  return deepSanitize(data);
}
