const express = require('express');
const { fail, route } = require('../lib/errors');
const { publicUser } = require('../lib/hydrate');
const { requireAuth } = require('../middleware/auth');

const MAX_SKILLS = 30;
const MAX_LEN = 200;

function cleanList(v, cap = MAX_SKILLS) {
  if (!Array.isArray(v)) return [];
  return v
    .filter((s) => typeof s === 'string')
    .map((s) => s.trim().slice(0, 60))
    .filter(Boolean)
    .slice(0, cap);
}

function cleanText(v) {
  return typeof v === 'string' ? v.trim().slice(0, MAX_LEN) : null;
}

/** Only these fields are ever writable. Anything else in the body is ignored. */
function sanitiseProfile(body = {}) {
  const userType = body.userType === 'professional' ? 'professional' : 'student';
  return {
    name: cleanText(body.name),
    userType,
    // The student/professional choice decides which of these two applies.
    collegeName: userType === 'student' ? cleanText(body.collegeName) : null,
    organizationName: userType === 'professional' ? cleanText(body.organizationName) : null,
    skills: cleanList(body.skills),
    github: cleanText(body.github),
    linkedin: cleanText(body.linkedin),
    interests: cleanList(body.interests),
    competitionPreferences: cleanList(body.competitionPreferences),
    availability: cleanText(body.availability),
    rolePreference: cleanList(body.rolePreference, 5),
    portfolio: cleanText(body.portfolio),
    projects: Array.isArray(body.projects) ? body.projects.slice(0, 10) : [],
    experience: Array.isArray(body.experience) ? body.experience.slice(0, 10) : [],
    // Stored only if offered, never used in matching (spec §4).
    gender: cleanText(body.gender),
  };
}

function requiredFieldsPresent(p) {
  const org = p.userType === 'student' ? p.collegeName : p.organizationName;
  return Boolean(p.name && org && p.skills.length);
}

module.exports = function profileRoutes({ store }) {
  const router = express.Router();

  router.post('/', requireAuth, route(async (req, res) => {
    const profile = sanitiseProfile(req.body);
    if (!requiredFieldsPresent(profile)) {
      fail('VALIDATION_FAILED', 'Name, institution and at least one skill are required.');
    }

    // Identity comes from the token, never the body (spec §12).
    const saved = await store.users.put({
      ...profile,
      userId: req.auth.userId,
      email: req.auth.claims?.email || null,
      emailVerified: Boolean(req.auth.claims?.email_verified) || req.auth.dev === true,
      createdAt: new Date().toISOString(),
    });

    res.status(201).json(publicUser(saved));
  }));

  router.get('/:id', requireAuth, route(async (req, res) => {
    const user = await store.users.get(req.params.id);
    if (!user) fail('NOT_FOUND');

    // Owners see their own full record; everyone else sees the public view.
    if (user.userId === req.auth.userId) return res.json(user);
    res.json(publicUser(user));
  }));

  router.put('/:id', requireAuth, route(async (req, res) => {
    if (req.params.id !== req.auth.userId) fail('NOT_OWNER');

    const existing = await store.users.get(req.params.id);
    if (!existing) fail('NOT_FOUND');

    const profile = sanitiseProfile({ ...existing, ...req.body });
    if (!requiredFieldsPresent(profile)) {
      fail('VALIDATION_FAILED', 'Name, institution and at least one skill are required.');
    }

    const saved = await store.users.update(req.params.id, profile);
    res.json(saved);
  }));

  return router;
};
