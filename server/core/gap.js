/**
 * Team skill-gap analysis - spec §5 and A.4.
 *
 *   covered   = requiredSkills ∩ (union of all member skills)
 *   remaining = requiredSkills - covered
 *   coverage% = |covered| / |requiredSkills|
 *
 * Fully deterministic. Recalculated on EVERY membership change, which is what
 * lets the UI show a plain fraction ("1 of 3 covered") instead of an opaque
 * AI score.
 */

const { intersect, subtract } = require('./skills');

/**
 * requiredSkills accepts either shape:
 *   [{ skill: 'AWS', priority: 'high' }]   <- the stored shape (spec §5)
 *   ['AWS']                                <- convenience
 */
function skillNames(requiredSkills = []) {
  return requiredSkills
    .map((r) => (typeof r === 'string' ? r : r && r.skill))
    .filter(Boolean);
}

/** Union of every current member's declared skills. */
function collectiveSkills(members = []) {
  const all = [];
  for (const m of members) {
    if (Array.isArray(m?.skills)) all.push(...m.skills);
  }
  return all;
}

/**
 * @returns {{covered: string[], remaining: string[], coveredCount: number,
 *            requiredCount: number, coveragePercent: number}}
 * Skills come back in the leader's own spelling, in the order they listed them.
 */
function computeGap(requiredSkills = [], members = []) {
  const required = skillNames(requiredSkills);
  const have = collectiveSkills(members);

  const covered = intersect(required, have);
  const remaining = subtract(required, have);

  return {
    covered,
    remaining,
    coveredCount: covered.length,
    requiredCount: required.length,
    coveragePercent: required.length === 0 ? 0 : Math.round((covered.length / required.length) * 100),
  };
}

/** Priority weight, used to rank which missing skills matter most. */
const PRIORITY_WEIGHT = { high: 3, medium: 2, low: 1 };

function priorityOf(requiredSkills = [], skillName) {
  const { canonical } = require('./skills');
  const entry = requiredSkills.find(
    (r) => typeof r !== 'string' && canonical(r?.skill) === canonical(skillName)
  );
  return entry?.priority || 'medium';
}

function weightOf(requiredSkills, skillName) {
  return PRIORITY_WEIGHT[priorityOf(requiredSkills, skillName)] || 2;
}

/* ---------------- recruitment status (spec A.11) ---------------- */

/**
 * Computed, never manually set - except `closed`, which is the leader's
 * optional manual toggle and therefore wins over everything else.
 */
function recruitmentStatus(memberCount, maxMembers, manuallyClosed = false) {
  if (manuallyClosed) return 'closed';
  if (memberCount >= maxMembers) return 'full';
  if (maxMembers - memberCount === 1) return 'almost_full';
  return 'recruiting';
}

function hasOpenSlot(team) {
  const count = team?.members?.length ?? team?.memberIds?.length ?? 0;
  const max = team?.maxMembers ?? 0;
  return !team?.closed && count < max;
}

module.exports = {
  computeGap,
  collectiveSkills,
  skillNames,
  recruitmentStatus,
  hasOpenSlot,
  weightOf,
  priorityOf,
};
