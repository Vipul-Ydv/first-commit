/**
 * The error codes from docs/api-contract.md §4.
 *
 * Every failure leaves the API as:  { error: { code, message } }
 * The frontend switches on `code`; `message` is what the user reads.
 */

const CODES = {
  UNAUTHENTICATED:      [401, 'Please log in again.'],
  EMAIL_NOT_VERIFIED:   [403, 'Please verify your email first.'],
  NOT_LEADER:           [403, 'Only the team leader can do this.'],
  NOT_OWNER:            [403, 'You can only edit your own profile.'],
  NOT_INVITEE:          [403, 'This invitation is not for you.'],
  NOT_ELIGIBLE:         [403, 'You are not eligible for this competition.'],
  TEAM_FULL:            [409, 'This team is already full.'],
  ALREADY_MEMBER:       [409, 'You are already in this team.'],
  DUPLICATE_REQUEST:    [409, 'You already have a pending request to this team.'],
  DUPLICATE_INVITATION: [409, 'This person has already been invited.'],
  VALIDATION_FAILED:    [400, 'Please check the highlighted fields.'],
  NOT_FOUND:            [404, 'Not found.'],
};

class ApiError extends Error {
  constructor(code, message) {
    const [status, defaultMessage] = CODES[code] || [500, 'Something went wrong.'];
    super(message || defaultMessage);
    this.code = code;
    this.status = status;
  }
}

/** Throw from anywhere in a route; the error middleware renders it. */
const fail = (code, message) => {
  throw new ApiError(code, message);
};

/** Wraps an async route so a rejected promise reaches the error middleware. */
const route = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

function errorMiddleware(err, req, res, _next) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message } });
  }
  console.error('[unhandled]', err);
  return res.status(500).json({ error: { code: 'INTERNAL', message: 'Something went wrong.' } });
}

module.exports = { ApiError, fail, route, errorMiddleware, CODES };
