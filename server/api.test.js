/**
 * End-to-end API test:  node server/api.test.js
 *
 * Boots the real app against a seeded in-memory store and walks the actual
 * demo script, both directions, plus the guards that have to hold on camera.
 * Uses the dev auth header in place of Cognito.
 */

const assert = require('assert');
const { createApp } = require('./app');
const { createMemoryStore } = require('./store/memory');
const { seed } = require('./store/seed');

let passed = 0;
const results = [];

function check(name, fn) {
  try {
    fn();
    passed++;
    results.push(`  ok   ${name}`);
  } catch (err) {
    results.push(`  FAIL ${name}\n       ${err.message}`);
    process.exitCode = 1;
  }
}

(async () => {
  const store = createMemoryStore();
  await seed(store);
  const app = createApp({ store });

  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const base = `http://127.0.0.1:${server.address().port}`;

  const call = async (method, path, { as, body } = {}) => {
    const res = await fetch(base + path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(as ? { 'x-dev-user': as } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: res.status, body: await res.json().catch(() => null) };
  };

  const LEADER = 'user_001';
  const AISHA = 'user_456';
  const NEHA = 'user_457';
  const OUTSIDER = 'user_463'; // different college

  /* ------------------------- auth round trip -------------------------- */
  /* Regression: completing a profile used to overwrite the whole user row,
     destroying passwordHash, so every user was locked out of their own
     account one screen after signing up. The suite missed it because no test
     logged in AFTER creating a profile. */

  let r;
  const creds = { email: 'roundtrip@btkit.ac.in', password: 'longenough123', name: 'Round Trip' };
  r = await call('POST', '/auth/register', { body: creds });
  const newUserId = r.body.user.userId;
  check('register issues a token', () => assert.ok(r.body.token));

  r = await call('POST', '/profiles', {
    as: newUserId,
    body: { name: 'Round Trip', userType: 'student', collegeName: 'BTKIT', skills: ['AWS'], github: 'g', linkedin: 'l' },
  });
  check('profile is created', () => assert.strictEqual(r.status, 201));

  r = await call('POST', '/auth/login', { body: { email: creds.email, password: creds.password } });
  check('LOGIN STILL WORKS AFTER COMPLETING A PROFILE', () => {
    assert.ok(r.body.token, 'password was destroyed by profile creation');
  });

  r = await call('PUT', `/profiles/${newUserId}`, { as: newUserId, body: { skills: ['AWS', 'Python'] } });
  check('profile update does not leak the password hash', () => {
    assert.ok(!('passwordHash' in r.body));
  });

  r = await call('POST', '/auth/login', { body: { email: creds.email, password: creds.password } });
  check('login still works after updating a profile', () => assert.ok(r.body.token));

  /* ------------------------------ basics ----------------------------- */

  r = await call('GET', '/health');
  check('health responds', () => assert.strictEqual(r.body.ok, true));

  r = await call('GET', '/teams/team_123');
  check('unauthenticated read is rejected', () => {
    assert.strictEqual(r.status, 401);
    assert.strictEqual(r.body.error.code, 'UNAUTHENTICATED');
  });

  r = await call('GET', '/teams/team_123', { as: LEADER });
  check('team read returns hydrated members, not bare ids', () => {
    assert.strictEqual(r.body.members.length, 2);
    assert.strictEqual(r.body.members[0].name, 'Vipul Yadav');
  });
  check('team read includes the computed gap', () => {
    assert.deepStrictEqual(r.body.skillGap.remaining, ['Machine Learning', 'UI/UX']);
    assert.strictEqual(r.body.skillGap.coveragePercent, 33);
  });

  /* --------------------- direction A: invite flow -------------------- */

  r = await call('GET', '/teams/team_123/recommendations', { as: LEADER });
  check('leader sees ranked candidates, Aisha first', () => {
    assert.strictEqual(r.body.recommendations[0].userId, AISHA);
  });
  check('the ineligible outsider never appears', () => {
    assert.ok(!r.body.recommendations.some((c) => c.userId === OUTSIDER));
  });

  r = await call('GET', '/teams/team_123/recommendations', { as: AISHA });
  check('a non-leader cannot see candidate recommendations', () => {
    assert.strictEqual(r.body.error.code, 'NOT_LEADER');
  });

  r = await call('POST', '/teams/team_123/invite', { as: AISHA, body: { userId: NEHA } });
  check('a non-leader cannot invite', () => assert.strictEqual(r.body.error.code, 'NOT_LEADER'));

  r = await call('POST', '/teams/team_123/invite', { as: LEADER, body: { userId: OUTSIDER } });
  check('an ineligible candidate cannot be invited', () => {
    assert.strictEqual(r.body.error.code, 'NOT_ELIGIBLE');
  });

  r = await call('POST', '/teams/team_123/invite', { as: LEADER, body: { userId: AISHA } });
  const invitationId = r.body.invitationId;
  check('leader invites Aisha', () => assert.strictEqual(r.body.status, 'pending'));

  r = await call('POST', '/teams/team_123/invite', { as: LEADER, body: { userId: AISHA } });
  check('a duplicate invitation is rejected', () => {
    assert.strictEqual(r.body.error.code, 'DUPLICATE_INVITATION');
  });

  r = await call('POST', `/invitations/${invitationId}/accept`, { as: NEHA });
  check('someone else cannot accept your invitation', () => {
    assert.strictEqual(r.body.error.code, 'NOT_INVITEE');
  });

  r = await call('POST', `/invitations/${invitationId}/accept`, { as: AISHA });
  check('Aisha accepts and the gap recalculates immediately', () => {
    assert.strictEqual(r.body.status, 'accepted');
    assert.deepStrictEqual(r.body.team.skillGap.covered.sort(), ['AWS', 'Machine Learning']);
    assert.deepStrictEqual(r.body.team.skillGap.remaining, ['UI/UX']);
  });
  check('team is now 3 of 4 and almost full', () => {
    assert.strictEqual(r.body.team.members.length, 3);
    assert.strictEqual(r.body.team.status, 'almost_full');
  });

  r = await call('POST', `/invitations/${invitationId}/accept`, { as: AISHA });
  check('an invitation cannot be accepted twice', () => {
    assert.strictEqual(r.body.error.code, 'VALIDATION_FAILED');
  });

  /* ------------------ direction B: join request flow ----------------- */

  r = await call('GET', `/users/${NEHA}/recommended-teams`, { as: NEHA });
  check('Neha sees teams recommended to her', () => {
    assert.ok(r.body.recommendations.some((t) => t.teamId === 'team_123'));
  });

  r = await call('GET', `/users/${NEHA}/recommended-teams`, { as: AISHA });
  check('you cannot read another user\'s recommendations', () => {
    assert.strictEqual(r.body.error.code, 'NOT_OWNER');
  });

  r = await call('POST', '/teams/team_123/join-request', { as: NEHA });
  const requestId = r.body.requestId;
  check('Neha requests to join', () => assert.strictEqual(r.body.status, 'pending'));

  r = await call('POST', '/teams/team_123/join-request', { as: NEHA });
  check('a duplicate join request is rejected', () => {
    assert.strictEqual(r.body.error.code, 'DUPLICATE_REQUEST');
  });

  r = await call('POST', '/teams/team_123/join-request', { as: AISHA });
  check('an existing member cannot request to join', () => {
    assert.strictEqual(r.body.error.code, 'ALREADY_MEMBER');
  });

  r = await call('POST', '/teams/team_123/join-request', { as: OUTSIDER });
  check('an ineligible user cannot even send a request', () => {
    assert.strictEqual(r.body.error.code, 'NOT_ELIGIBLE');
  });

  r = await call('POST', `/join-requests/${requestId}/approve`, { as: NEHA });
  check('only the leader can approve', () => assert.strictEqual(r.body.error.code, 'NOT_LEADER'));

  r = await call('POST', `/join-requests/${requestId}/approve`, { as: LEADER });
  check('leader approves and the gap closes completely', () => {
    assert.deepStrictEqual(r.body.team.skillGap.remaining, []);
    assert.strictEqual(r.body.team.skillGap.coveragePercent, 100);
  });
  check('team is now full', () => assert.strictEqual(r.body.team.status, 'full'));

  /* ------------------------- capacity at accept ----------------------- */

  r = await call('POST', '/teams/team_123/join-request', { as: 'user_460' });
  check('a full team cannot be requested', () => assert.strictEqual(r.body.error.code, 'TEAM_FULL'));

  r = await call('GET', '/teams', { as: AISHA });
  check('browse hides the now-full team', () => {
    assert.ok(!r.body.teams.some((t) => t.teamId === 'team_123'));
  });

  /* ---------------------------- dashboards ---------------------------- */

  r = await call('GET', '/teams/team_123/dashboard', { as: LEADER });
  check('leader dashboard shows the gap and sent invitations', () => {
    assert.strictEqual(r.body.skillGap.coveragePercent, 100);
    assert.ok(r.body.sentInvitations.length >= 1);
    assert.strictEqual(r.body.sentInvitations[0].name, 'Aisha Khan');
  });

  r = await call('GET', `/users/${AISHA}/dashboard`, { as: AISHA });
  check('individual dashboard shows the team she joined', () => {
    assert.strictEqual(r.body.currentTeam.teamId, 'team_123');
    assert.strictEqual(r.body.receivedInvitations[0].status, 'accepted');
  });

  /* --------------------------- extraction ----------------------------- */

  r = await call('POST', '/competitions/analyze', {
    as: LEADER,
    body: { text: '# Robotics Cup 2026\nOrganised by: Acme\nTeams of 2-5 members.\nDeadline: 1 December 2026.' },
  });
  check('analyze extracts fields for review', () => {
    assert.strictEqual(r.body.fields.name, 'Robotics Cup 2026');
    assert.strictEqual(r.body.fields.teamSizeMax, 5);
    assert.strictEqual(r.body.needsReview, false);
  });

  r = await call('POST', '/competitions', { as: LEADER, body: { name: 'X' } });
  check('saving without a max team size is rejected', () => {
    assert.strictEqual(r.body.error.code, 'VALIDATION_FAILED');
  });

  server.close();
  console.log('\napi end-to-end');
  results.forEach((l) => console.log(l));
  console.log(`\n${passed} passed${process.exitCode ? ', SOME FAILED' : ', all green'}\n`);
})();
