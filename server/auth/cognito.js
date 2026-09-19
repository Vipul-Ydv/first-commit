/**
 * Cognito token verification.
 *
 * Verifies the ID token from the user pool: signature against the pool's
 * public JWKS, plus issuer, audience and expiry. The JWKS is fetched once and
 * cached, so only the first request in a Lambda container pays for it.
 *
 * We use the ID token rather than the access token because it carries the
 * user's email and name, which we want when a profile is first created.
 *
 * IMPORTANT - switching providers is NOT purely a flag change.
 *
 * Cognito's `sub` is a different id namespace from the `user_...` ids used by
 * the seeded demo data and by every existing team, invitation and join
 * request. Flipping AUTH_PROVIDER to cognito therefore:
 *
 *   - orphans accounts created under local auth
 *   - makes the seeded users unreachable, since nobody can authenticate AS
 *     `user_001` through Cognito
 *
 * So a switch means re-seeding, and re-running the demo from a clean slate.
 * Anyone reading "one environment variable" elsewhere in this repo should read
 * it as "one variable plus a reseed", not a live migration.
 */

let verifier;

function getVerifier() {
  if (verifier) return verifier;

  const userPoolId = process.env.COGNITO_USER_POOL_ID;
  const clientId = process.env.COGNITO_CLIENT_ID;
  if (!userPoolId || !clientId) {
    throw new Error('AUTH_PROVIDER=cognito but COGNITO_USER_POOL_ID / COGNITO_CLIENT_ID are not set');
  }

  // Required lazily so the local auth path never needs this dependency.
  const { CognitoJwtVerifier } = require('aws-jwt-verify');
  verifier = CognitoJwtVerifier.create({ userPoolId, clientId, tokenUse: 'id' });
  return verifier;
}

/**
 * @returns {Promise<{userId: string, email?: string, name?: string} | null>}
 *          null for any invalid token - callers turn that into UNAUTHENTICATED.
 */
async function verifyCognitoToken(token) {
  try {
    const claims = await getVerifier().verify(token);
    return {
      // `sub` is the stable user id. Email can change; sub cannot.
      userId: claims.sub,
      email: claims.email,
      name: claims.name,
      emailVerified: claims.email_verified === true,
      claims,
    };
  } catch {
    return null;
  }
}

module.exports = { verifyCognitoToken };
