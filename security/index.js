const { AUTH_TOKEN, WHITELISTED_IPS } = require('../access.json');

function securityLayer(req, res, next) {
  const clientIPRaw =
    req.headers['x-forwarded-for']?.split(',')[0] || req.connection.remoteAddress;

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
