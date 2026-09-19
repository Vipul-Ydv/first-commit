/**
 * Authentication.
 *
 * THE RULE (spec §12): the caller's identity always comes from the verified
 * token, never from a request body field. A route that trusts
 * `req.body.userId` lets anyone act as anyone else.
 *
 * Two providers, chosen by AUTH_PROVIDER:
 *
 *   local    (default) bcrypt + JWT issued by this app. No AWS needed.
 *   cognito            verifies the Cognito user pool's ID token.
 *
 * Both end at req.auth = { userId }, so nothing downstream knows or cares
 * which one ran. Switching is one environment variable, and the local path
 * stays deployed as a fallback.
 */

const jwt = require('jsonwebtoken');
const { fail, route } = require('../lib/errors');

const provider = () => process.env.AUTH_PROVIDER || 'local';

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

/**
 * Resolve the secret OUTSIDE the token try/catch below. Inside it, the
 * production missing-secret error was swallowed and turned into a plain 401,
 * so a misconfigured Lambda booted, reported healthy, and silently rejected
 * every login instead of failing fast.
 */
function verifyLocal(token) {
  const secret = signingSecret(); // throws in production if unset - deliberate
  try {
    const claims = jwt.verify(token, secret);
    return { userId: claims.userId || claims.sub, claims };
  } catch {
    return null;
  }
}

/**
 * Fail at startup rather than per-request. Called from app creation so a
 * misconfigured deployment never reaches a health check.
 */
function assertAuthConfig() {
  signingSecret();
  if (provider() === 'cognito' && !(process.env.COGNITO_USER_POOL_ID && process.env.COGNITO_CLIENT_ID)) {
    throw new Error('AUTH_PROVIDER=cognito but COGNITO_USER_POOL_ID / COGNITO_CLIENT_ID are not set');
  }
}

/**
 * Populates req.auth = { userId } or fails with UNAUTHENTICATED.
 *
 * Dev escape hatch: outside production, `x-dev-user: user_456` stands in for a
 * real token so the frontend can be built against seeded data. Ignored when
 * NODE_ENV=production - verified against the deployed API.
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

  let identity;
  if (provider() === 'cognito') {
    const { verifyCognitoToken } = require('../auth/cognito');
    identity = await verifyCognitoToken(token);
  } else {
    identity = verifyLocal(token);
  }

  if (!identity?.userId) fail('UNAUTHENTICATED');

  // Spec A.1: email must be verified before full access. Cognito tells us;
  // without this an id token with email_verified=false reached every route.
  if (provider() === 'cognito' && identity.emailVerified === false) {
    fail('EMAIL_NOT_VERIFIED');
  }

  req.auth = identity;
  return next();
});

/** Issue a local session token. Unused when AUTH_PROVIDER=cognito. */
function issueToken(userId) {
  return jwt.sign({ userId }, signingSecret(), { expiresIn: '7d' });
}

/** True when this app owns registration and login itself. */
const localAuthEnabled = () => provider() === 'local';

module.exports = { requireAuth, issueToken, localAuthEnabled, assertAuthConfig };
