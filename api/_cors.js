/**
 * CORS configuration helper for API routes
 * Restricts access to authorized origins only
 */

const ALLOWED_ORIGINS = [
  'http://localhost:5173',      // Local Vite dev server
  'http://localhost:5176',      // Alternative Vite dev port
  'http://localhost:3000',      // Alternative local dev port
  'https://content-requests-app.vercel.app',  // Production domain
  'https://content-requests-app-git-*.vercel.app',  // Git branch previews (pattern)
  'https://content-requests-app-*.vercel.app',  // Other preview deployments (pattern)
];

/**
 * Check if origin is allowed (supports wildcard patterns)
 */
function isOriginAllowed(origin) {
  if (!origin) return false;

  // Check exact matches first
  if (ALLOWED_ORIGINS.includes(origin)) {
    return true;
  }

  // Check pattern matches (for Vercel preview URLs)
  return ALLOWED_ORIGINS.some(allowed => {
    if (allowed.includes('*')) {
      // Convert wildcard pattern to regex
      const pattern = allowed.replace(/\*/g, '[a-z0-9-]+');
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(origin);
    }
    return false;
  });
}

/**
 * Set CORS headers for API routes
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Object} options - Configuration options
 * @returns {boolean} - Returns true if origin is allowed, false otherwise
 */
export function setCorsHeaders(req, res, options = {}) {
  const {
    methods = 'GET, POST, PUT, DELETE, OPTIONS',
    headers = 'Content-Type, Authorization, X-API-Key',
    credentials = false
  } = options;

  const origin = req.headers.origin || req.headers.referer?.replace(/\/$/, '');

  if (isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    // Don't set CORS headers for unauthorized origins
    return false;
  }

  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', headers);

  if (credentials) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  return true;
}

/**
 * Handle CORS preflight requests
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {boolean} - Returns true if it was a preflight request
 */
export function handlePreflight(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
}

/**
 * Middleware to handle CORS and preflight in one call
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Object} options - Configuration options
 * @returns {boolean} - Returns false if request should be rejected
 */
export function handleCors(req, res, options = {}) {
  const isAllowed = setCorsHeaders(req, res, options);

  if (!isAllowed && req.method !== 'OPTIONS') {
    res.status(403).json({ error: 'Origin not allowed' });
    return false;
  }

  if (handlePreflight(req, res)) {
    return false; // Preflight handled, no further processing needed
  }

  return true; // Continue processing the request
}
