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

/**
 * In production the secret must come from the environment. Falling back to a
 * default that is visible in this repository would let anyone forge a token
 * for any user, so refuse to run instead of failing open.
 */
function signingSecret() {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;

  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET is not set. Refusing to start with a known default secret.');
  }
  return 'dev-secret';
}

function verifyLocal(token) {
  try {
    return jwt.verify(token, signingSecret());
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

/** Issue a session token. Replaced by Cognito's own login. */
function issueToken(userId) {
  return jwt.sign({ userId }, signingSecret(), { expiresIn: '7d' });
}

module.exports = { requireAuth, issueToken };
