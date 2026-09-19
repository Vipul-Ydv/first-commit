/**
 * Core logic tests. No framework, no dependencies:  node server/core/core.test.js
 *
 * These run the deterministic core against the SAME fixtures the frontend
 * renders from (client/src/api/mock/*.json). If this file passes, the backend
 * and the frontend agree.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const { canonical, intersect, subtract } = require('./skills');
const { isEligible } = require('./eligibility');
const { computeGap, recruitmentStatus } = require('./gap');
const { rankCandidates, rankTeams } = require('./matching');

const MOCKS = path.join(__dirname, '..', '..', 'client', 'src', 'api', 'mock');
const load = (f) => JSON.parse(fs.readFileSync(path.join(MOCKS, f), 'utf8'));

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ok   ${name}`);
  } catch (err) {
    console.error(`  FAIL ${name}\n       ${err.message}`);
    process.exitCode = 1;
  }
}

/* ------------------------------ fixtures ------------------------------ */

const competition = {
  competitionId: 'competition_123',
  name: 'AI Innovation Challenge',
  deadline: '2026-09-30T23:59:00Z',
  eligibility: { studentOnly: true, institutionRestriction: true, allowedInstitutions: ['BTKIT'] },
};

const leader = { userId: 'user_001', name: 'Vipul Yadav', userType: 'student', collegeName: 'BTKIT', skills: ['AWS', 'Node.js'] };
const member = { userId: 'user_002', name: 'Rahul Sharma', userType: 'student', collegeName: 'BTKIT', skills: ['Python'] };

const team = {
  teamId: 'team_123',
  name: 'VisionX',
  leaderId: 'user_001',
  competitionId: 'competition_123',
  maxMembers: 4,
  members: [leader, member],
  requiredSkills: [
    { skill: 'Machine Learning', priority: 'high' },
    { skill: 'AWS', priority: 'high' },
    { skill: 'UI/UX', priority: 'medium' },
  ],
};

const aisha = { userId: 'user_456', name: 'Aisha Khan', userType: 'student', collegeName: 'BTKIT', skills: ['Python', 'Machine Learning', 'AWS'], competitionPreferences: ['competition_123'], availability: 'weekends', rolePreference: ['ML Engineer'], github: 'https://github.com/aishakhan', linkedin: 'https://linkedin.com/in/aishakhan' };
const neha = { userId: 'user_457', name: 'Neha Verma', userType: 'student', collegeName: 'BTKIT', skills: ['UI/UX', 'Figma'], competitionPreferences: [], availability: 'weekdays', rolePreference: ['Designer'], github: 'https://github.com/nehaverma', linkedin: 'https://linkedin.com/in/nehaverma' };
const karan = { userId: 'user_458', name: 'Karan Mehta', userType: 'student', collegeName: 'BTKIT', skills: ['UI/UX', 'Java'], competitionPreferences: [], availability: 'evenings only', rolePreference: ['Frontend Developer'], github: 'https://github.com/karanmehta', linkedin: 'https://linkedin.com/in/karanmehta' };

/* -------------------------------- skills ------------------------------ */

console.log('\nskills');
test('ML resolves to Machine Learning', () => {
  assert.strictEqual(canonical('ML'), canonical('Machine Learning'));
});
test('casing and separators are ignored', () => {
  assert.strictEqual(canonical('  machine-learning '), 'machine learning');
});
test('UI and UX both resolve to UI/UX', () => {
  assert.strictEqual(canonical('UI'), canonical('UI/UX'));
  assert.strictEqual(canonical('ux'), canonical('UI/UX'));
});
test('intersect returns the wanted spelling, not the candidate spelling', () => {
  assert.deepStrictEqual(intersect(['Machine Learning'], ['ml']), ['Machine Learning']);
});
test('subtract removes synonym matches', () => {
  assert.deepStrictEqual(subtract(['Machine Learning', 'AWS'], ['ML']), ['AWS']);
});

/* ----------------------------- eligibility ---------------------------- */

console.log('\neligibility (the gate)');
test('BTKIT student is eligible', () => {
  assert.strictEqual(isEligible(aisha, competition), true);
});
test('professional is rejected when studentOnly', () => {
  assert.strictEqual(isEligible({ ...aisha, userType: 'professional' }, competition), false);
});
test('student from another college is rejected', () => {
  assert.strictEqual(isEligible({ ...aisha, collegeName: 'Other College' }, competition), false);
});
test('SAFEGUARD: no eligibility block at all means open', () => {
  assert.strictEqual(isEligible({ userType: 'professional' }, { competitionId: 'c' }), true);
});
test('SAFEGUARD: institutionRestriction with an EMPTY list means open, not closed', () => {
  const c = { eligibility: { institutionRestriction: true, allowedInstitutions: [] } };
  assert.strictEqual(isEligible({ userType: 'student', collegeName: 'Anything' }, c), true);
});
test('SAFEGUARD: unset institutionRestriction does not filter', () => {
  const c = { eligibility: { studentOnly: true } };
  assert.strictEqual(isEligible({ userType: 'student' }, c), true);
});
test('institution match ignores case and spacing', () => {
  const c = { eligibility: { institutionRestriction: true, allowedInstitutions: ['  btkit '] } };
  assert.strictEqual(isEligible({ userType: 'student', collegeName: 'BTKIT' }, c), true);
});

/* -------------------------------- gap --------------------------------- */

console.log('\nskill gap');
test('matches the gap stated in the frozen contract (team.json)', () => {
  const expected = load('team.json').skillGap;
  const actual = computeGap(team.requiredSkills, team.members);
  assert.deepStrictEqual(actual, expected);
});
test('a member listing "ML" still covers "Machine Learning"', () => {
  const g = computeGap(team.requiredSkills, [{ skills: ['ml', 'AWS', 'ui'] }]);
  assert.deepStrictEqual(g.remaining, []);
  assert.strictEqual(g.coveragePercent, 100);
});
test('empty required list does not divide by zero', () => {
  assert.strictEqual(computeGap([], []).coveragePercent, 0);
});
test('recruitment status is computed from capacity', () => {
  assert.strictEqual(recruitmentStatus(2, 4), 'recruiting');
  assert.strictEqual(recruitmentStatus(3, 4), 'almost_full');
  assert.strictEqual(recruitmentStatus(4, 4), 'full');
  assert.strictEqual(recruitmentStatus(2, 4, true), 'closed');
});

/* --------------------- direction A: candidates ------------------------ */

console.log('\nrecommendations: leader -> candidates');
const candOut = rankCandidates({ team, members: team.members, candidates: [karan, neha, aisha], competition });

test('remainingGap matches the contract', () => {
  assert.deepStrictEqual(candOut.remainingGap, ['Machine Learning', 'UI/UX']);
});
test('Aisha ranks first - she fills the high-priority ML hole', () => {
  assert.strictEqual(candOut.recommendations[0].userId, 'user_456');
});
test('Neha outranks Karan on secondary signals despite the same skill', () => {
  const ids = candOut.recommendations.map((r) => r.userId);
  assert.ok(ids.indexOf('user_457') < ids.indexOf('user_458'), `got order ${ids}`);
});
test('explanation matches the contract wording', () => {
  assert.strictEqual(candOut.recommendations[0].matchReason, load('recommendations-candidates.json').recommendations[0].matchReason);
});
test('every missingSkillsFilled entry is really in the gap', () => {
  for (const r of candOut.recommendations) {
    for (const s of r.missingSkillsFilled) assert.ok(candOut.remainingGap.includes(s), `${s} not in gap`);
  }
});
test('GATE: an ineligible candidate never appears', () => {
  const outsider = { ...aisha, userId: 'user_999', collegeName: 'Other College' };
  const out = rankCandidates({ team, members: team.members, candidates: [outsider], competition });
  assert.strictEqual(out.recommendations.length, 0);
});
test('GATE: existing members are never recommended to their own team', () => {
  const out = rankCandidates({ team, members: team.members, candidates: [leader, member], competition });
  assert.strictEqual(out.recommendations.length, 0);
});
test('someone who fills nothing is not recommended', () => {
  const useless = { userId: 'user_998', name: 'X', userType: 'student', collegeName: 'BTKIT', skills: ['AWS'] };
  const out = rankCandidates({ team, members: team.members, candidates: [useless], competition });
  assert.strictEqual(out.recommendations.length, 0);
});

/* ------------------------ direction B: teams -------------------------- */

console.log('\nrecommendations: individual -> teams');
const team124 = { teamId: 'team_124', name: 'DataDock', competitionId: 'competition_123', maxMembers: 4, status: 'almost_full', members: [{ userId: 'a' }, { userId: 'b' }, { userId: 'c' }], requiredSkills: [{ skill: 'Python', priority: 'high' }, { skill: 'Django', priority: 'medium' }] };
const teamOut = rankTeams({ user: aisha, teams: [{ ...team, status: 'recruiting' }, team124], competitionsById: { competition_123: competition } });

test('VisionX ranks above DataDock', () => {
  assert.deepStrictEqual(teamOut.recommendations.map((r) => r.teamId), ['team_123', 'team_124']);
});
test('explanation matches the contract wording', () => {
  assert.strictEqual(teamOut.recommendations[0].matchReason, load('recommendations-teams.json').recommendations[0].matchReason);
});
test('matchedCount and requiredCount match the contract', () => {
  const exp = load('recommendations-teams.json').recommendations[0];
  assert.strictEqual(teamOut.recommendations[0].matchedCount, exp.matchedCount);
  assert.strictEqual(teamOut.recommendations[0].requiredCount, exp.requiredCount);
});
test('GATE: a full team is never recommended', () => {
  const full = { ...team124, members: [{}, {}, {}, {}] };
  const out = rankTeams({ user: aisha, teams: [full], competitionsById: { competition_123: competition } });
  assert.strictEqual(out.recommendations.length, 0);
});
test('GATE: an ineligible user sees no restricted teams', () => {
  const outsider = { ...aisha, collegeName: 'Other College' };
  const out = rankTeams({ user: outsider, teams: [team], competitionsById: { competition_123: competition } });
  assert.strictEqual(out.recommendations.length, 0);
});

console.log(`\n${passed} passed${process.exitCode ? ', SOME FAILED' : ', all green'}\n`);
