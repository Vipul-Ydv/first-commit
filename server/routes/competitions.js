const express = require('express');
const { randomUUID } = require('crypto');
const { fail, route } = require('../lib/errors');
const { requireAuth } = require('../middleware/auth');
const { analyzeCompetition } = require('../ai');
const { validateExtraction } = require('../ai/validate');

module.exports = function competitionRoutes({ store }) {
  const router = express.Router();

  /**
   * Extraction for HUMAN REVIEW. Returns HTTP 200 even when fields are
   * missing - a partial extraction is a form to complete, not an error
   * (spec A.2 step 3). Nothing is saved here.
   */
  router.post('/analyze', requireAuth, route(async (req, res) => {
    const { text, url, sourceType } = req.body || {};

    // URL fetching is not in the 2-day scope; the leader pastes the text.
    if (url && !text) {
      fail('VALIDATION_FAILED', 'Paste the competition text. Fetching a URL is not supported yet.');
    }

    const result = await analyzeCompetition(text, {
      sourceType: sourceType || 'pasted_text',
    });

    res.json(result);
  }));

  /**
   * Save a competition. The leader has reviewed and possibly corrected the
   * extracted fields, so this runs them through the SAME validator again -
   * the frontend is never trusted (spec §7).
   */
  router.post('/', requireAuth, route(async (req, res) => {
    const validated = validateExtraction(req.body || {}, req.body?.sourceType || 'manual');

    // On save, unlike on extract, the essentials must actually be there.
    if (!validated.fields.name) {
      fail('VALIDATION_FAILED', 'Competition name is required.');
    }
    if (validated.fields.teamSizeMax === null) {
      fail('VALIDATION_FAILED', 'Maximum team size is required.');
    }

    const competition = {
      competitionId: `competition_${randomUUID().slice(0, 8)}`,
      ...validated.fields,
      sourceType: validated.sourceType,
      createdBy: req.auth.userId,
      createdAt: new Date().toISOString(),
    };

    await store.competitions.put(competition);
    res.status(201).json(competition);
  }));

  router.get('/', requireAuth, route(async (req, res) => {
    res.json({ competitions: await store.competitions.list() });
  }));

  router.get('/:id', requireAuth, route(async (req, res) => {
    const competition = await store.competitions.get(req.params.id);
    if (!competition) fail('NOT_FOUND');
    res.json(competition);
  }));

  return router;
};
