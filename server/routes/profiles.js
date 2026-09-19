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

    // Merge onto the existing record rather than replacing it. put() writes a
    // whole item, and `profile` deliberately has no auth fields - so a plain
    // put here wiped passwordHash and locked the user out of their own
    // account the moment they completed their profile.
    const existing = (await store.users.get(req.auth.userId)) || {};

    const saved = await store.users.put({
      ...existing,
      ...profile,
      userId: req.auth.userId,
      email: existing.email || req.auth.email || req.auth.claims?.email || null,
      emailVerified:
        existing.emailVerified ?? (Boolean(req.auth.emailVerified) || req.auth.dev === true),
      createdAt: existing.createdAt || new Date().toISOString(),
    });

    res.status(201).json(publicUser(saved));
  }));

  router.get('/:id', requireAuth, route(async (req, res) => {
    const user = await store.users.get(req.params.id);
    if (!user) fail('NOT_FOUND');

    // Owners see their own full record - but never the credential verifier.
    // `user` is the raw stored row, so returning it directly sent passwordHash
    // to the browser every time the profile page loaded.
    if (user.userId === req.auth.userId) {
      const { passwordHash, ...safe } = user;
      return res.json(safe);
    }
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

    // update() merges, so auth fields survive - but never let the body set them.
    const { passwordHash, email, emailVerified, ...safe } = profile;
    const saved = await store.users.update(req.params.id, safe);
    const { passwordHash: _, ...out } = saved;
    res.json(out);
  }));

  return router;
};
