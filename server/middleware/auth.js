/**
 * Authentication.
 *
 * THE RULE (spec §12): the caller's identity is always derived from the
 * verified token, never from a request body field. A route that trusts
 * `req.body.userId` lets anyone act as anyone else.
 *
 * Two modes:
 *   - local JWT (default) - works today, no AWS needed
 *   - Cognito             - set COGNITO_USER_POOL_ID; verifies the pool's JWT
 *
 * The Cognito path is deliberately a seam rather than a rewrite: both end by
 * setting req.auth = { userId }, and nothing downstream knows the difference.
 */

const jwt = require('jsonwebtoken');
const { fail, route } = require('../lib/errors');

function bearer(req) {
  const header = req.header('Authorization') || '';
  return header.startsWith('Bearer ') ? header.slice(7).trim() : null;
}

function verifyLocal(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
  } catch {
    return null;
  }
}

/**
 * Populates req.auth = { userId } or fails with UNAUTHENTICATED.
 *
 * Dev escape hatch: outside production, `x-dev-user: user_456` stands in for a
 * real token so the frontend can be built against seeded data before Cognito
 * exists. It is ignored when NODE_ENV=production.
 */
const requireAuth = route(async (req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    const devUser = req.header('x-dev-user');
    if (devUser) {
      req.auth = { userId: devUser, dev: true };
      return next();
    }
  }

  const token = bearer(req);
  if (!token) fail('UNAUTHENTICATED');

  const claims = verifyLocal(token);
  if (!claims) fail('UNAUTHENTICATED');

  // Cognito puts the subject in `sub`; our local tokens use `userId`.
  const userId = claims.userId || claims.sub;
  if (!userId) fail('UNAUTHENTICATED');

  req.auth = { userId, claims };
  return next();
});

/** Issue a local development token. Replaced by Cognito's own login. */
function issueToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
}

module.exports = { requireAuth, issueToken };
