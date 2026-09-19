/**
 * Eligibility gate - spec §3 and A.8.
 *
 * This is a GATE, never a ranking factor. An ineligible user is never scored,
 * ranked or explained - they simply do not appear. No AI is involved, ever.
 */

/**
 * THE CRITICAL SAFEGUARD (spec §3):
 * An unset or missing institutionRestriction means OPEN, never "restricted by
 * default". Blank data must never exclude everybody - that is the exact bug
 * this function exists to prevent.
 */
function isEligible(user, competition) {
  if (!user) return false;
  if (!competition) return true; // no competition attached -> nothing to restrict

  const e = competition.eligibility;
  if (!e) return true; // no eligibility block at all -> open to everyone

  if (e.studentOnly === true && user.userType !== 'student') {
    return false;
  }

  if (e.institutionRestriction === true) {
    const allowed = Array.isArray(e.allowedInstitutions) ? e.allowedInstitutions : [];

    // Restriction flag set but no list supplied: treat as OPEN, not closed.
    // Excluding everyone because a field was left blank is the failure mode
    // spec §3 explicitly calls out.
    if (allowed.length === 0) return true;

    const userOrg = user.collegeName || user.organizationName;
    if (!userOrg) return false;

    return allowed.some((inst) => normalise(inst) === normalise(userOrg));
  }

  return true;
}

function normalise(s) {
  return String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Human-readable reason a user failed the gate.
 * For leader-facing debugging only - never shown to the excluded user, since
 * ineligible teams/candidates are filtered out before they are ever rendered.
 */
function ineligibilityReason(user, competition) {
  if (isEligible(user, competition)) return null;
  const e = competition?.eligibility || {};
  if (e.studentOnly === true && user?.userType !== 'student') {
    return 'This competition is open to students only.';
  }
  if (e.institutionRestriction === true) {
    return 'This competition is limited to specific institutions.';
  }
  return 'Not eligible for this competition.';
}

/** Filter a list of users down to those eligible for a competition. */
function filterEligible(users = [], competition) {
  return users.filter((u) => isEligible(u, competition));
}

module.exports = { isEligible, ineligibilityReason, filterEligible };
