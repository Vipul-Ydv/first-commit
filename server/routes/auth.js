/**
 * Local email + password auth.
 *
 * This is the stand-in for Cognito, which the AWS account cannot currently
 * provision. It is real auth - bcrypt-hashed passwords, signed JWTs - not a
 * demo shortcut, so the app is honest about who is calling it.
 *
 * When Cognito becomes available, these two endpoints go away and
 * middleware/auth.js verifies the pool's JWT instead. Nothing else changes:
 * both paths end at req.auth = { userId }.
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');
const { fail, route } = require('../lib/errors');
const { issueToken, requireAuth, localAuthEnabled } = require('../middleware/auth');
const { publicUser } = require('../lib/hydrate');

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = function authRoutes({ store }) {
  const router = express.Router();

  /**
   * With AUTH_PROVIDER=cognito these endpoints are off. Tokens they issued
   * would not verify anyway, but leaving a second sign-up path live is a
   * confusing thing to hand an attacker - one door in, not two.
   */
  const localOnly = route(async (req, res, next) => {
    if (!localAuthEnabled()) {
      fail('NOT_FOUND', 'This deployment uses Cognito. Sign in through Cognito instead.');
    }
    next();
  });

  router.post('/register', localOnly, route(async (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const name = String(req.body?.name || '').trim();

    if (!EMAIL.test(email)) fail('VALIDATION_FAILED', 'Enter a valid email address.');
    if (password.length < 8) fail('VALIDATION_FAILED', 'Password must be at least 8 characters.');
    if (!name) fail('VALIDATION_FAILED', 'Name is required.');

    const userType = req.body?.userType === 'professional' ? 'professional' : 'student';
    // The form asks for one or the other depending on the toggle; take whichever
    // arrived and file it under the field that matches userType.
    const raw = userType === 'student' ? req.body?.collegeName : req.body?.organizationName;
    const institution = typeof raw === 'string' && raw.trim() ? raw.trim().slice(0, 200) : null;

    const existing = await store.users.findOne((u) => u.email === email);
    if (existing) fail('VALIDATION_FAILED', 'That email is already registered.');

    const user = {
      userId: `user_${randomUUID().slice(0, 8)}`,
      name,
      email,
      passwordHash: await bcrypt.hash(password, 10),
      // No email service in scope, so accounts start usable. Cognito's
      // verification link replaces this when it lands.
      emailVerified: true,
      userType,
      // Keep whichever institution the signup form collected. These used to be
      // hardcoded to null, so anyone who typed their college at signup was
      // asked for it again on the very next screen.
      collegeName: userType === 'student' ? institution : null,
      organizationName: userType === 'professional' ? institution : null,
      skills: [],
      interests: [],
      competitionPreferences: [],
      rolePreference: [],
      availability: null,
      github: null,
      linkedin: null,
      projects: [],
      experience: [],
      gender: null,
      createdAt: new Date().toISOString(),
    };

    await store.users.put(user);
    res.status(201).json({ token: issueToken(user.userId), user: publicUser(user) });
  }));

  router.post('/login', localOnly, route(async (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    const user = await store.users.findOne((u) => u.email === email);
    // Same message either way - never reveal whether an email is registered.
    if (!user || !user.passwordHash) fail('VALIDATION_FAILED', 'Invalid email or password.');

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) fail('VALIDATION_FAILED', 'Invalid email or password.');

    res.json({ token: issueToken(user.userId), user: publicUser(user) });
  }));

  /** Who am I? Used on page load to restore a session. */
  router.get('/me', requireAuth, route(async (req, res) => {
    const user = await store.users.get(req.auth.userId);
    if (!user) fail('NOT_FOUND');
    const { passwordHash, ...safe } = user;
    res.json(safe);
  }));

  return router;
};
