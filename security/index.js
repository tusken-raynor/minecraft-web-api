const { AUTH_TOKEN, WHITELISTED_IPS, PUBLIC_ENDPOINTS } = require('../access.json');

function securityLayer(req, res, next) {
  // Some endpoints are public when using GET requests
  if (req.method === 'GET') {
    let endpointPath = req.path;
    // Make sure the endpoint path starts with a slash and ends with a slash
    if (!endpointPath.startsWith('/')) {
      endpointPath = `/${endpointPath}`;
    }
    if (!endpointPath.endsWith('/')) {
      endpointPath += '/';
    }
    // If the endpoint is public, skip security checks
    if (PUBLIC_ENDPOINTS.includes(endpointPath)) {
      return next();
    }
  }

  const clientIPRaw = req.headers['x-forwarded-for']?.split(',')[0] || req.connection.remoteAddress;

  // Normalize for cases like "::ffff:127.0.0.1"
  const clientIP = clientIPRaw.replace('::ffff:', '');

  const authHeader = req.headers['x-auth'] || '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader;

  const ipAllowed = WHITELISTED_IPS.includes(clientIP);
  const tokenValid = token === AUTH_TOKEN;

  if (ipAllowed || tokenValid) {
    return next();
  }

  return res.status(403).json({ success: false, message: 'Forbidden: Unauthorized access' });
}

module.exports = securityLayer;
