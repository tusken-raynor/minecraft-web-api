const { AUTH_TOKEN, WHITELISTED_IPS, PUBLIC_ENDPOINTS } = require('../access.json');

function securityLayer(req, res, next) {
  let isAuthorized = false;
  let isAuthenticated = false;
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
      isAuthorized = true;
    }
  }

  const clientIPRaw = req.headers['x-forwarded-for']?.split(',')[0] || req.connection.remoteAddress;

  // Normalize for cases like "::ffff:127.0.0.1"
  const clientIP = clientIPRaw.replace('::ffff:', '');

  isAuthenticated = WHITELISTED_IPS.includes(clientIP);

  // Attempt to authenticate the request using the AUTH_TOKEN
  if (!isAuthenticated) {
    const authHeader = req.headers['x-auth'] || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;

    isAuthenticated = token === AUTH_TOKEN;
  }

  isAuthorized = isAuthorized || isAuthenticated;

  if (isAuthorized) {
    if (isAuthenticated) {
      allowCrossOriginActivity(res);
    }

    return next();
  }

  return res.status(403).json({ success: false, message: 'Forbidden: Unauthorized access' });
}

function allowCrossOriginActivity(res) {
  // Set a Access-Control-Allow-Origin header to allow cross-origin requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  // Set a Access-Control-Allow-Methods header to allow all methods
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  // Set a Access-Control-Allow-Headers header to allow all headers
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Auth');
}

module.exports = securityLayer;
