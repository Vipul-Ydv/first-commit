/**
 * Turn stored records into the shapes the API actually returns.
 *
 * Contract rule (docs/api-contract.md §1): reads return full objects, writes
 * send IDs. Storage keeps `memberIds`; the API returns `members[]` with names
 * and skills, plus the computed `skillGap` - so the frontend never needs a
 * second call to render a screen, and never computes the gap itself.
 */

const { computeGap, recruitmentStatus } = require('../core/gap');
const { teamInstitution } = require('../core/matching');

/** Public view of a user. Never leaks anything the profile owner did not share. */
function publicUser(user) {
  if (!user) return null;
  return {
    userId: user.userId,
    name: user.name,
    userType: user.userType,
    collegeName: user.collegeName,
    organizationName: user.organizationName,
    skills: user.skills || [],
    interests: user.interests || [],
    availability: user.availability,
    rolePreference: user.rolePreference || [],
    github: user.github,
    linkedin: user.linkedin,
    portfolio: user.portfolio || null,
    projects: user.projects || [],
    experience: user.experience || [],
    // email and gender are deliberately omitted - gender is never used in
    // matching (spec §4) and there is no reason to broadcast either.
  };
}

async function loadMembers(store, team) {
  const ids = team.memberIds || [];
  const rows = await Promise.all(ids.map((id) => store.users.get(id)));
  return rows.filter(Boolean);
}

/**
 * May this viewer see how to contact the people on this team?
 *
 * Membership is the obvious case. The other two matter just as much: reaching
 * out is itself a disclosure, so once an invitation or a join request exists
 * between the two sides, each can see how to reach the other. Being asked to
 * join a team and having no way to ask the leader a question about it is how
 * an invitation goes unanswered.
 *
 * A stranger browsing an open team has done none of that, and sees the roster
 * without contact details.
 */
async function canContactTeam(store, team, viewerId) {
  if (viewerId == null) return false;
  if ((team.memberIds || []).includes(viewerId)) return true;

  const invited = await store.invitations.findOne(
    (i) => i.teamId === team.teamId && i.userId === viewerId && i.status === 'pending'
  );
  if (invited) return true;

  const requested = await store.joinRequests.findOne(
    (r) => r.teamId === team.teamId && r.userId === viewerId && r.status === 'pending'
  );
  return Boolean(requested);
}

/**
 * Full team view: competition, members, gap, computed status.
 *
 * `viewerId` decides whether contact details come back - see canContactTeam.
 * The answer ships as `viewerCanContact` so the client renders the server's
 * decision instead of re-deriving it and drifting out of step.
 */
async function hydrateTeam(store, team, viewerId = null) {
  if (!team) return null;

  const members = await loadMembers(store, team);
  const competition = team.competitionId ? await store.competitions.get(team.competitionId) : null;
  const skillGap = computeGap(team.requiredSkills, members);
  const isTeammate = await canContactTeam(store, team, viewerId);

  return {
    teamId: team.teamId,
    name: team.name,
    leaderId: team.leaderId,
    maxMembers: team.maxMembers,
    status: recruitmentStatus(members.length, team.maxMembers, team.closed),
    competition,
    requiredSkills: team.requiredSkills || [],
    collegeName: teamInstitution(members),
    members: members.map((m) => ({
      ...publicUser(m),
      ...(isTeammate ? { email: m.email } : {}),
      isLeader: m.userId === team.leaderId,
    })),
    skillGap,
    viewerCanContact: isTeammate,
  };
}

/** Compact team row for the browse list. */
async function summariseTeam(store, team) {
  const members = await loadMembers(store, team);
  const competition = team.competitionId ? await store.competitions.get(team.competitionId) : null;
  const gap = computeGap(team.requiredSkills, members);

  return {
    teamId: team.teamId,
    name: team.name,
    competitionName: competition?.name || null,
    deadline: competition?.deadline || null,
    // Whose campus is this team on? Null when the members are mixed.
    collegeName: teamInstitution(members),
    memberCount: members.length,
    maxMembers: team.maxMembers,
    status: recruitmentStatus(members.length, team.maxMembers, team.closed),
    requiredSkills: team.requiredSkills || [],
    remaining: gap.remaining,
  };
}

/** Teams with their members attached - what the matching functions expect. */
async function teamsWithMembers(store) {
  const teams = await store.teams.list();
  return Promise.all(
    teams.map(async (t) => ({ ...t, members: await loadMembers(store, t) }))
  );
}

async function competitionsById(store) {
  const rows = await store.competitions.list();
  return Object.fromEntries(rows.map((c) => [c.competitionId, c]));
}

module.exports = {
  publicUser,
  canContactTeam,
  loadMembers,
  hydrateTeam,
  summariseTeam,
  teamsWithMembers,
  competitionsById,
};
