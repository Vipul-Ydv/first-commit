const express = require('express');
const { randomUUID } = require('crypto');
const { fail, route } = require('../lib/errors');
const { requireAuth } = require('../middleware/auth');
const { hydrateTeam, summariseTeam, loadMembers, teamsWithMembers, competitionsById, publicUser } = require('../lib/hydrate');
const { rankCandidates, rankTeams } = require('../core/matching');
const { computeGap, recruitmentStatus } = require('../core/gap');
const { isEligible } = require('../core/eligibility');

const PRIORITIES = ['high', 'medium', 'low'];

function cleanRequiredSkills(v) {
  if (!Array.isArray(v)) return [];
  return v
    .map((r) => {
      const skill = typeof r === 'string' ? r : r?.skill;
      if (typeof skill !== 'string' || !skill.trim()) return null;
      const priority = PRIORITIES.includes(r?.priority) ? r.priority : 'medium';
      return { skill: skill.trim().slice(0, 60), priority };
    })
    .filter(Boolean)
    .slice(0, 20);
}

/** Load a team or 404, and optionally assert the caller leads it. */
async function mustLoadTeam(store, teamId, callerId, { leaderOnly = false } = {}) {
  const team = await store.teams.get(teamId);
  if (!team) fail('NOT_FOUND');
  if (leaderOnly && team.leaderId !== callerId) fail('NOT_LEADER');
  return team;
}

module.exports = function teamRoutes({ store }) {
  const router = express.Router();

  /* ------------------------------ create ------------------------------ */

  router.post('/', requireAuth, route(async (req, res) => {
    const { name, competitionId } = req.body || {};
    if (typeof name !== 'string' || !name.trim()) {
      fail('VALIDATION_FAILED', 'Team name is required.');
    }

    const competition = competitionId ? await store.competitions.get(competitionId) : null;
    if (competitionId && !competition) fail('NOT_FOUND', 'Competition not found.');

    const leader = await store.users.get(req.auth.userId);
    if (!leader) fail('VALIDATION_FAILED', 'Create your profile before creating a team.');

    // A leader cannot form a team for a competition they are not eligible for.
    if (competition && !isEligible(leader, competition)) fail('NOT_ELIGIBLE');

    const maxMembers = Number.isInteger(req.body?.maxMembers)
      ? req.body.maxMembers
      : competition?.teamSizeMax || 4;

    const team = {
      teamId: `team_${randomUUID().slice(0, 8)}`,
      name: name.trim().slice(0, 80),
      leaderId: req.auth.userId,
      competitionId: competitionId || null,
      memberIds: [req.auth.userId],
      maxMembers,
      closed: false,
      requiredSkills: cleanRequiredSkills(req.body?.requiredSkills),
      createdAt: new Date().toISOString(),
    };

    await store.teams.put(team);
    res.status(201).json(await hydrateTeam(store, team, req.auth.userId));
  }));

  /* ------------------------------ browse ------------------------------ */

  router.get('/', requireAuth, route(async (req, res) => {
    const teams = await store.teams.list();
    const rows = await Promise.all(teams.map((t) => summariseTeam(store, t)));
    // Full and closed teams are not joinable, so they are not browsable.
    res.json({ teams: rows.filter((t) => t.status !== 'full' && t.status !== 'closed') });
  }));

  router.get('/:id', requireAuth, route(async (req, res) => {
    const team = await mustLoadTeam(store, req.params.id, req.auth.userId);
    res.json(await hydrateTeam(store, team, req.auth.userId));
  }));

  /* ------------------------ update (leader only) ----------------------- */

  router.put('/:id', requireAuth, route(async (req, res) => {
    const team = await mustLoadTeam(store, req.params.id, req.auth.userId, { leaderOnly: true });

    const patch = {};
    if (typeof req.body?.name === 'string' && req.body.name.trim()) {
      patch.name = req.body.name.trim().slice(0, 80);
    }
    if (req.body?.requiredSkills !== undefined) {
      patch.requiredSkills = cleanRequiredSkills(req.body.requiredSkills);
    }
    if (typeof req.body?.closed === 'boolean') {
      patch.closed = req.body.closed;
    }

    const updated = await store.teams.update(team.teamId, patch);
    res.json(await hydrateTeam(store, updated, req.auth.userId));
  }));

  /* --------------------- recommendations (leader) ---------------------- */

  router.get('/:id/recommendations', requireAuth, route(async (req, res) => {
    const team = await mustLoadTeam(store, req.params.id, req.auth.userId, { leaderOnly: true });
    const members = await loadMembers(store, team);
    const competition = team.competitionId ? await store.competitions.get(team.competitionId) : null;
    const candidates = await store.users.list();

    res.json(rankCandidates({ team, members, candidates, competition }));
  }));

  /* ---------------------- dashboard (leader view) ---------------------- */

  router.get('/:id/dashboard', requireAuth, route(async (req, res) => {
    const team = await mustLoadTeam(store, req.params.id, req.auth.userId, { leaderOnly: true });
    const members = await loadMembers(store, team);

    const requests = await store.joinRequests.find(
      (r) => r.teamId === team.teamId && r.status === 'pending'
    );
    const invitations = await store.invitations.find((i) => i.teamId === team.teamId);
    const gap = computeGap(team.requiredSkills, members);

    /**
     * Contact details ride along in both directions.
     *
     * A leader deciding on a join request could see a name, a college and a
     * list of skills, and had no way to ask the person a single question
     * before accepting or rejecting them. Both rows here are people who have
     * already reached out or been reached out to, which is the same boundary
     * canContactTeam draws on the other side.
     */
    const withUser = async (row, extra = {}) => {
      const u = await store.users.get(row.userId);
      return {
        ...row,
        name: u?.name,
        collegeName: u?.collegeName,
        organizationName: u?.organizationName || null,
        skills: u?.skills || [],
        availability: u?.availability || null,
        rolePreference: u?.rolePreference || [],
        email: u?.email || null,
        github: u?.github || null,
        linkedin: u?.linkedin || null,
        portfolio: u?.portfolio || null,
        ...extra,
      };
    };

    res.json({
      teamId: team.teamId,
      name: team.name,
      status: recruitmentStatus(members.length, team.maxMembers, team.closed),
      memberCount: members.length,
      maxMembers: team.maxMembers,
      skillGap: gap,
      pendingJoinRequests: await Promise.all(requests.map((r) => withUser(r))),
      sentInvitations: await Promise.all(invitations.map((i) => withUser(i))),
    });
  }));

  return router;
};

/* ------------------------------------------------------------------ *
 * Mounted separately at /users - the individual's side of the product.
 * ------------------------------------------------------------------ */

module.exports.userRoutes = function userRoutes({ store }) {
  const router = express.Router();

  /** Direction B: teams recommended to this individual. */
  router.get('/:id/recommended-teams', requireAuth, route(async (req, res) => {
    if (req.params.id !== req.auth.userId) fail('NOT_OWNER', 'You can only see your own recommendations.');

    const user = await store.users.get(req.params.id);
    if (!user) fail('NOT_FOUND');

    res.json(rankTeams({
      user,
      teams: await teamsWithMembers(store),
      competitionsById: await competitionsById(store),
    }));
  }));

  /** Individual dashboard: my requests, my invitations, my team. */
  router.get('/:id/dashboard', requireAuth, route(async (req, res) => {
    if (req.params.id !== req.auth.userId) fail('NOT_OWNER');

    const userId = req.params.id;
    const myTeam = await store.teams.findOne((t) => (t.memberIds || []).includes(userId));
    const sent = await store.joinRequests.find((r) => r.userId === userId);
    const received = await store.invitations.find((i) => i.userId === userId);

    const withTeam = async (row) => {
      const t = await store.teams.get(row.teamId);
      const c = t?.competitionId ? await store.competitions.get(t.competitionId) : null;
      return { ...row, teamName: t?.name, competitionName: c?.name || null };
    };

    res.json({
      userId,
      currentTeam: myTeam ? await hydrateTeam(store, myTeam, userId) : null,
      sentJoinRequests: await Promise.all(sent.map(withTeam)),
      receivedInvitations: await Promise.all(received.map(withTeam)),
    });
  }));

  router.get('/:id', requireAuth, route(async (req, res) => {
    const user = await store.users.get(req.params.id);
    if (!user) fail('NOT_FOUND');
    res.json(publicUser(user));
  }));

  return router;
};
