/**
 * The Express app, with no listener attached.
 *
 * Kept separate from index.js on purpose: this same object runs locally, on
 * EC2, or inside Lambda via serverless-http. Deployment target becomes a
 * wrapper choice rather than a rewrite - which matters while the AWS account
 * situation is still settling.
 */

const express = require('express');
const cors = require('cors');

const { errorMiddleware } = require('./lib/errors');
const { assertAuthConfig } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profiles');
const competitionRoutes = require('./routes/competitions');
const teamRoutes = require('./routes/teams');
const { teamActionRoutes, joinRequestRoutes, invitationRoutes } = require('./routes/requests');

function createApp({ store }) {
  if (!store) throw new Error('createApp requires a store');

  // Fail fast on a misconfigured deployment instead of 401-ing every request.
  assertAuthConfig();

  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (req, res) =>
    res.json({
      ok: true,
      extractionProvider: process.env.EXTRACTION_PROVIDER || 'rules',
    })
  );

  app.use('/auth', authRoutes({ store }));
  app.use('/profiles', profileRoutes({ store }));
  app.use('/competitions', competitionRoutes({ store }));

  // Both mount on /teams: teamActionRoutes owns the two "send" endpoints
  // (join-request, invite), teamRoutes owns the rest.
  app.use('/teams', teamActionRoutes({ store }));
  app.use('/teams', teamRoutes({ store }));

  app.use('/users', teamRoutes.userRoutes({ store }));
  app.use('/join-requests', joinRequestRoutes({ store }));
  app.use('/invitations', invitationRoutes({ store }));

  app.use((req, res) =>
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Not found.' } })
  );
  app.use(errorMiddleware);

  return app;
}

module.exports = { createApp };
