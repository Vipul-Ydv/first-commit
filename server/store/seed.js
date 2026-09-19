/**
 * Demo seed data - the shared cast from docs/api-contract.md §5.
 *
 * These are the exact IDs, names and skills the mock fixtures use, so the
 * running app and the frontend's mock mode tell the same story. Without this,
 * the recommendation screens render empty and the demo falls flat - which is
 * the single most commonly forgotten step before a hackathon demo.
 */

const COMPETITION = {
  competitionId: 'competition_123',
  name: 'AI Innovation Challenge',
  organizer: 'Example Organization',
  deadline: '2026-09-30T23:59:00Z',
  teamSizeMin: 2,
  teamSizeMax: 4,
  eligibility: {
    studentOnly: true,
    institutionRestriction: true,
    allowedInstitutions: ['BTKIT'],
  },
  sourceType: 'pasted_text',
};

const student = (userId, name, skills, extra = {}) => ({
  userId,
  name,
  userType: 'student',
  collegeName: 'BTKIT',
  organizationName: null,
  email: `${name.split(' ')[0].toLowerCase()}@btkit.ac.in`,
  emailVerified: true,
  skills,
  github: `https://github.com/${name.split(' ').join('').toLowerCase()}`,
  linkedin: `https://linkedin.com/in/${name.split(' ').join('').toLowerCase()}`,
  interests: [],
  competitionPreferences: [],
  availability: 'weekends',
  rolePreference: [],
  portfolio: null,
  projects: [],
  experience: [],
  gender: null,
  ...extra,
});

const USERS = [
  student('user_001', 'Vipul Yadav', ['AWS', 'Node.js'], { rolePreference: ['Backend Developer'] }),
  student('user_002', 'Rahul Sharma', ['Python'], { rolePreference: ['Backend Developer'] }),

  // The demo cast. Aisha fills the high-priority ML gap and prefers this
  // competition, so she ranks first. Neha and Karan both fill UI/UX - the tie
  // breaks on availability breadth, which is what makes the ranking legible.
  student('user_456', 'Aisha Khan', ['Python', 'Machine Learning', 'AWS'], {
    competitionPreferences: ['competition_123'],
    availability: 'weekends',
    rolePreference: ['ML Engineer'],
    interests: ['AI', 'Cloud'],
  }),
  student('user_457', 'Neha Verma', ['UI/UX', 'Figma'], {
    availability: 'weekdays',
    rolePreference: ['Designer'],
  }),
  student('user_458', 'Karan Mehta', ['UI/UX', 'Java'], {
    availability: 'evenings only',
    rolePreference: ['Frontend Developer'],
  }),
  student('user_459', 'Sneha Rao', ['UI/UX', 'Illustrator'], {
    availability: 'weekends',
    rolePreference: ['Designer'],
  }),

  // Extra depth so the lists are not suspiciously short on camera.
  student('user_460', 'Arjun Nair', ['Machine Learning', 'PyTorch'], {
    availability: 'full-time',
    rolePreference: ['ML Engineer'],
  }),
  student('user_461', 'Priya Singh', ['React.js', 'TypeScript'], {
    availability: 'weekends',
    rolePreference: ['Frontend Developer'],
  }),
  student('user_462', 'Imran Ali', ['AWS', 'Docker', 'CI/CD'], {
    availability: 'weekdays',
    rolePreference: ['DevOps Engineer'],
  }),
  student('user_464', 'Meera Joshi', ['Python', 'Pandas'], {
    availability: 'weekdays',
    rolePreference: ['Data Analyst'],
  }),

  // Deliberately ineligible - different college. Proves the eligibility gate
  // on camera: he is a strong skill match and still never appears.
  {
    ...student('user_463', 'Rohit Das', ['Machine Learning', 'UI/UX']),
    collegeName: 'Other College',
    email: 'rohit@other.ac.in',
  },
];

const TEAMS = [
  {
    teamId: 'team_123',
    name: 'VisionX',
    leaderId: 'user_001',
    competitionId: 'competition_123',
    memberIds: ['user_001', 'user_002'],
    maxMembers: 4,
    closed: false,
    requiredSkills: [
      { skill: 'Machine Learning', priority: 'high' },
      { skill: 'AWS', priority: 'high' },
      { skill: 'UI/UX', priority: 'medium' },
    ],
  },
  {
    teamId: 'team_124',
    name: 'DataDock',
    leaderId: 'user_461',
    competitionId: 'competition_123',
    // Nobody belongs to two teams in the seed - it reads as a bug on camera.
    memberIds: ['user_461', 'user_462', 'user_464'],
    maxMembers: 4,
    closed: false,
    requiredSkills: [
      { skill: 'Python', priority: 'high' },
      { skill: 'Django', priority: 'medium' },
    ],
  },
];

/**
 * Seeded users have no password by default - they exist to populate the
 * recommendation lists, not to be signed into.
 *
 * The demo needs one exception: showing a candidate *accepting* an invitation
 * means signing in as that candidate. Set SEED_PASSWORD to give every seeded
 * user that password.
 *
 * Opt-in on purpose. A shared known password on a public API is fine for a
 * demo with fake data and unacceptable anywhere else, so it never happens
 * unless someone deliberately asks for it.
 */
async function seed(store) {
  const password = process.env.SEED_PASSWORD;
  let passwordHash = null;

  if (password) {
    if (password.length < 8) throw new Error('SEED_PASSWORD must be at least 8 characters');
    passwordHash = await require('bcryptjs').hash(password, 10);
  }

  await store.competitions.put(COMPETITION);
  for (const u of USERS) {
    await store.users.put(passwordHash ? { ...u, passwordHash } : u);
  }
  for (const t of TEAMS) await store.teams.put(t);

  return {
    users: USERS.length,
    competitions: 1,
    teams: TEAMS.length,
    loginEnabled: Boolean(passwordHash),
  };
}

module.exports = { seed, USERS, TEAMS, COMPETITION };
