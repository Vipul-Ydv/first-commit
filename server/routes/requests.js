/**
 * Join requests and invitations - spec A.9 and A.10.
 *
 * Two flows, same state machine, opposite actors:
 *   Individual -> Team : JoinRequest, the LEADER decides      (rejected)
 *   Leader -> Individual: Invitation,  the CANDIDATE decides  (declined)
 *
 * The rule that matters most: capacity and eligibility are re-checked when a
 * request is ACCEPTED, not only when it was sent. A team can fill up while a
 * request sits pending, and the frontend disabling a button is a convenience,
 * never the enforcement (spec A.11).
 */

const express = require('express');
const { randomUUID } = require('crypto');
const { fail, route } = require('../lib/errors');
const { requireAuth } = require('../middleware/auth');
const { hydrateTeam, loadMembers } = require('../lib/hydrate');
const { isEligible } = require('../core/eligibility');

async function context(store, teamId) {
  const team = await store.teams.get(teamId);
  if (!team) fail('NOT_FOUND');
  const competition = team.competitionId ? await store.competitions.get(team.competitionId) : null;
  return { team, competition };
}

function assertHasRoom(team) {
  if (team.closed) fail('TEAM_FULL', 'This team has stopped recruiting.');
  if ((team.memberIds || []).length >= team.maxMembers) fail('TEAM_FULL');
}

/** Shared by both accept paths: re-validate, then add the member. */
async function admit(store, team, userId) {
  const fresh = await store.teams.get(team.teamId);
  assertHasRoom(fresh);
  if ((fresh.memberIds || []).includes(userId)) fail('ALREADY_MEMBER');

  const competition = fresh.competitionId ? await store.competitions.get(fresh.competitionId) : null;
  const user = await store.users.get(userId);
  if (!user) fail('NOT_FOUND');
  if (!isEligible(user, competition)) fail('NOT_ELIGIBLE');

  return store.teams.update(fresh.teamId, { memberIds: [...fresh.memberIds, userId] });
}

/* ------------------------------------------------------------------ *
 * Mounted on /teams
 * ------------------------------------------------------------------ */

function teamActionRoutes({ store }) {
  const router = express.Router();

  /** Individual asks to join. */
  router.post('/:id/join-request', requireAuth, route(async (req, res) => {
    const callerId = req.auth.userId;
    const { team, competition } = await context(store, req.params.id);

    if ((team.memberIds || []).includes(callerId)) fail('ALREADY_MEMBER');
    assertHasRoom(team);

    const user = await store.users.get(callerId);
    if (!user) fail('VALIDATION_FAILED', 'Create your profile first.');
    if (!isEligible(user, competition)) fail('NOT_ELIGIBLE');

    const duplicate = await store.joinRequests.findOne(
      (r) => r.teamId === team.teamId && r.userId === callerId && r.status === 'pending'
    );
    if (duplicate) fail('DUPLICATE_REQUEST');

    const request = {
      requestId: `req_${randomUUID().slice(0, 8)}`,
      teamId: team.teamId,
      userId: callerId,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    await store.joinRequests.put(request);
    res.status(201).json(request);
  }));

  /** Leader invites a candidate. */
  router.post('/:id/invite', requireAuth, route(async (req, res) => {
    const { team, competition } = await context(store, req.params.id);
    if (team.leaderId !== req.auth.userId) fail('NOT_LEADER');
    assertHasRoom(team);

    const { userId } = req.body || {};
    if (!userId) fail('VALIDATION_FAILED', 'userId is required.');
    if ((team.memberIds || []).includes(userId)) fail('ALREADY_MEMBER');

    const candidate = await store.users.get(userId);
    if (!candidate) fail('NOT_FOUND');
    if (!isEligible(candidate, competition)) fail('NOT_ELIGIBLE');

    const duplicate = await store.invitations.findOne(
      (i) => i.teamId === team.teamId && i.userId === userId && i.status === 'pending'
    );
    if (duplicate) fail('DUPLICATE_INVITATION');

    const invitation = {
      invitationId: `inv_${randomUUID().slice(0, 8)}`,
      teamId: team.teamId,
      userId,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    await store.invitations.put(invitation);
    res.status(201).json(invitation);
  }));

  return router;
}

/* ------------------------------------------------------------------ *
 * Mounted on /join-requests - the LEADER decides
 * ------------------------------------------------------------------ */

function joinRequestRoutes({ store }) {
  const router = express.Router();

  const decide = (outcome) => route(async (req, res) => {
    const request = await store.joinRequests.get(req.params.id);
    if (!request) fail('NOT_FOUND');
    if (request.status !== 'pending') {
      fail('VALIDATION_FAILED', `This request was already ${request.status}.`);
    }

    const team = await store.teams.get(request.teamId);
    if (!team) fail('NOT_FOUND');
    if (team.leaderId !== req.auth.userId) fail('NOT_LEADER');

    if (outcome === 'accepted') await admit(store, team, request.userId);

    await store.joinRequests.update(request.requestId, {
      status: outcome,
      decidedAt: new Date().toISOString(),
    });

    res.json({
      requestId: request.requestId,
      status: outcome,
      team: await hydrateTeam(store, await store.teams.get(team.teamId)),
    });
  });

  router.post('/:id/approve', requireAuth, decide('accepted'));
  router.post('/:id/reject', requireAuth, decide('rejected'));

  return router;
}

/* ------------------------------------------------------------------ *
 * Mounted on /invitations - the CANDIDATE decides
 * ------------------------------------------------------------------ */

function invitationRoutes({ store }) {
  const router = express.Router();

  const decide = (outcome) => route(async (req, res) => {
    const invitation = await store.invitations.get(req.params.id);
    if (!invitation) fail('NOT_FOUND');
    if (invitation.userId !== req.auth.userId) fail('NOT_INVITEE');
    if (invitation.status !== 'pending') {
      fail('VALIDATION_FAILED', `This invitation was already ${invitation.status}.`);
    }

    const team = await store.teams.get(invitation.teamId);
    if (!team) fail('NOT_FOUND');

    if (outcome === 'accepted') await admit(store, team, invitation.userId);

    await store.invitations.update(invitation.invitationId, {
      status: outcome,
      decidedAt: new Date().toISOString(),
    });

    res.json({
      invitationId: invitation.invitationId,
      status: outcome,
      team: await hydrateTeam(store, await store.teams.get(team.teamId)),
    });
  });

  router.post('/:id/accept', requireAuth, decide('accepted'));
  router.post('/:id/decline', requireAuth, decide('declined'));

  return router;
}

module.exports = { teamActionRoutes, joinRequestRoutes, invitationRoutes, admit };
