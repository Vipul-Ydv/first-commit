/**
 * Turn stored records into the shapes the API actually returns.
 *
 * Contract rule (docs/api-contract.md §1): reads return full objects, writes
 * send IDs. Storage keeps `memberIds`; the API returns `members[]` with names
 * and skills, plus the computed `skillGap` - so the frontend never needs a
 * second call to render a screen, and never computes the gap itself.
 */

const { computeGap, recruitmentStatus } = require('../core/gap');

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

/** Full team view: competition, members, gap, computed status. */
async function hydrateTeam(store, team) {
  if (!team) return null;

  const members = await loadMembers(store, team);
  const competition = team.competitionId ? await store.competitions.get(team.competitionId) : null;
  const skillGap = computeGap(team.requiredSkills, members);

  return {
    teamId: team.teamId,
    name: team.name,
    leaderId: team.leaderId,
    maxMembers: team.maxMembers,
    status: recruitmentStatus(members.length, team.maxMembers, team.closed),
    competition,
    requiredSkills: team.requiredSkills || [],
    members: members.map((m) => ({
      ...publicUser(m),
      isLeader: m.userId === team.leaderId,
    })),
    skillGap,
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
  loadMembers,
  hydrateTeam,
  summariseTeam,
  teamsWithMembers,
  competitionsById,
};
