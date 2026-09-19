/**
 * Recommendation ranking - spec §2, A.6, A.7.
 *
 * Deterministic first, AI second. Everything here is a set comparison. Bedrock
 * is only ever asked to rewrite `matchReason` into nicer prose from the
 * matched/missing arrays this file already computed - it is never given free
 * text about a person, so it has nothing to invent from (spec §10).
 *
 * Eligibility is applied as a GATE before any scoring happens. An ineligible
 * person is never scored, ranked or explained.
 */

const { intersect, subtract, canonical } = require('./skills');
const { computeGap, skillNames, weightOf, hasOpenSlot } = require('./gap');
const { isEligible } = require('./eligibility');

/* ------------------------------------------------------------------ *
 * Direction A: Team -> Individual  (leader sees suggested candidates)
 * ------------------------------------------------------------------ */

/**
 * Candidates are scored against the team's REMAINING gap, not the full
 * required list (spec A.6). Someone who duplicates a skill the team already
 * has adds nothing, and must not outrank someone who fills a hole.
 */
function rankCandidates({ team, members = [], candidates = [], competition }) {
  const required = skillNames(team.requiredSkills);
  const gap = computeGap(team.requiredSkills, members);
  const memberIds = new Set(members.map((m) => m.userId));

  const scored = candidates
    // --- deterministic gate, before any scoring ---
    .filter((c) => !memberIds.has(c.userId))
    .filter((c) => c.userId !== team.leaderId)
    .filter((c) => isEligible(c, competition))
    .map((candidate) => {
      const fills = intersect(gap.remaining, candidate.skills);
      const matched = intersect(required, candidate.skills);
      const prefersThis =
        Array.isArray(candidate.competitionPreferences) &&
        candidate.competitionPreferences.some((id) => id === team.competitionId);

      // Primary: weighted value of the gap holes this person closes.
      const gapScore = fills.reduce((sum, s) => sum + weightOf(team.requiredSkills, s), 0);

      return {
        userId: candidate.userId,
        name: candidate.name,
        collegeName: candidate.collegeName,
        skills: candidate.skills || [],
        matchedSkills: matched,
        missingSkillsFilled: fills,
        matchReason: explainCandidate(fills, matched),
        competitionPreferenceMatch: prefersThis,
        availability: candidate.availability,
        rolePreference: candidate.rolePreference,
        github: candidate.github,
        linkedin: candidate.linkedin,
        _score: [
          gapScore,                              // 1. closes the most valuable holes
          prefersThis ? 1 : 0,                   // 2. wants this competition
          matched.length,                        // 3. overall overlap
          availabilityRank(candidate.availability), // 4. secondary signals (spec A.7)
          candidate.rolePreference?.length ? 1 : 0,
        ],
      };
    })
    // Someone who fills none of the gap is noise, not a recommendation.
    .filter((c) => c.missingSkillsFilled.length > 0);

  scored.sort(byScoreDesc);
  return {
    teamId: team.teamId,
    remainingGap: gap.remaining,
    recommendations: scored.map(stripScore),
  };
}

/* ------------------------------------------------------------------ *
 * Direction B: Individual -> Team  (individual sees suggested teams)
 * ------------------------------------------------------------------ */

/**
 * Same set comparison run from the other side (spec A.7). The individual is
 * compared against each team's full required list - from their point of view
 * the whole requirement is what tells them whether they belong there.
 */
function rankTeams({ user, teams = [], competitionsById = {} }) {
  const scored = teams
    // --- deterministic gate ---
    .filter((t) => hasOpenSlot(t))
    .filter((t) => !(t.members || []).some((m) => m.userId === user.userId))
    .filter((t) => isEligible(user, competitionsById[t.competitionId]))
    .map((team) => {
      const required = skillNames(team.requiredSkills);
      const matched = intersect(required, user.skills);
      const prefersThis =
        Array.isArray(user.competitionPreferences) &&
        user.competitionPreferences.some((id) => id === team.competitionId);

      const weighted = matched.reduce((sum, s) => sum + weightOf(team.requiredSkills, s), 0);

      return {
        teamId: team.teamId,
        name: team.name,
        competitionName: competitionsById[team.competitionId]?.name,
        deadline: competitionsById[team.competitionId]?.deadline,
        memberCount: (team.members || []).length,
        maxMembers: team.maxMembers,
        status: team.status,
        requiredSkills: required,
        matchedSkills: matched,
        matchedCount: matched.length,
        requiredCount: required.length,
        matchReason: explainTeam(matched.length, required.length, prefersThis),
        competitionPreferenceMatch: prefersThis,
        _score: [
          weighted,
          prefersThis ? 1 : 0,
          required.length ? matched.length / required.length : 0,
        ],
      };
    })
    .filter((t) => t.matchedCount > 0);

  scored.sort(byScoreDesc);
  return { userId: user.userId, recommendations: scored.map(stripScore) };
}

/* ------------------------------------------------------------------ *
 * Explanations
 *
 * These templates are the FALLBACK and the contract. Bedrock may rewrite them
 * into better prose, but it receives only these arrays - never free-text
 * profile fields - so it cannot invent experience the person does not have.
 * If Bedrock is unavailable, these strings ship as-is and read fine.
 * ------------------------------------------------------------------ */

function explainCandidate(fills) {
  if (fills.length === 0) return 'No unmet requirements matched.';
  const noun = fills.length === 1 ? 'requirement' : 'requirements';
  return `Fills the team's ${joinList(fills)} ${noun}.`;
}

function explainTeam(matchedCount, requiredCount, prefersThis) {
  const base = `You match ${matchedCount} of the team's ${requiredCount} requested skills`;
  return prefersThis
    ? `${base}, and you've marked this competition as a preference.`
    : `${base}.`;
}

function joinList(items) {
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

/* ------------------------------- utils ------------------------------- */

/**
 * Availability breadth, used only to separate two otherwise-equal candidates.
 * Spec A.7's own example is "two ML-skilled candidates, but only one is free
 * on weekends" - so what matters is how much time someone has, not merely
 * whether they filled the field in. Unknown wording scores mid, which keeps a
 * candidate who wrote something unusual ahead of one who wrote nothing.
 */
const AVAILABILITY_RANK = [
  [/full[\s-]?time|anytime|flexible|always/i, 4],
  [/weekday|weekend|part[\s-]?time|daily/i, 3],
  [/evening|night|morning|after\s?hours/i, 2],
  [/limited|occasional|rare|busy/i, 1],
];

function availabilityRank(availability) {
  if (!availability) return 0;
  for (const [pattern, rank] of AVAILABILITY_RANK) {
    if (pattern.test(availability)) return rank;
  }
  return 2;
}

/** Lexicographic compare over the _score tuple, highest first. */
function byScoreDesc(a, b) {
  for (let i = 0; i < a._score.length; i++) {
    if (b._score[i] !== a._score[i]) return b._score[i] - a._score[i];
  }
  return 0;
}

function stripScore({ _score, ...rest }) {
  return rest;
}

module.exports = { rankCandidates, rankTeams, explainCandidate, explainTeam };
