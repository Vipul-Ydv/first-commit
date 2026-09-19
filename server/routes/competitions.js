const express = require('express');
const { randomUUID } = require('crypto');
const { fail, route } = require('../lib/errors');
const { requireAuth } = require('../middleware/auth');
const { analyzeCompetition } = require('../ai');
const { validateExtraction } = require('../ai/validate');
const { textFromDocument, isSupported, extensionOf } = require('../ai/documents');
const storage = require('../lib/storage');

module.exports = function competitionRoutes({ store }) {
  const router = express.Router();

  /**
   * Ask for somewhere to put a document. The browser then uploads straight to
   * S3 with the returned URL - the file never passes through Lambda, which is
   * what keeps a 10 MB deck under the 6 MB request payload limit.
   */
  router.post('/upload-url', requireAuth, route(async (req, res) => {
    if (!storage.enabled()) {
      fail('VALIDATION_FAILED', 'Document upload is not configured on this deployment.');
    }
    const { filename } = req.body || {};
    if (!filename) fail('VALIDATION_FAILED', 'filename is required.');
    if (!isSupported(filename)) {
      fail('VALIDATION_FAILED', `Cannot read .${extensionOf(filename)} files. Use pptx, docx, pdf, txt or md.`);
    }

    res.json(await storage.createUploadUrl({ userId: req.auth.userId, filename }));
  }));

  /**
   * Extraction for HUMAN REVIEW. Returns HTTP 200 even when fields are
   * missing - a partial extraction is a form to complete, not an error
   * (spec A.2 step 3). Nothing is saved here.
   */
  router.post('/analyze', requireAuth, route(async (req, res) => {
    const { text, url, sourceType, documentKey } = req.body || {};

    // URL fetching is not in the 2-day scope; the leader pastes the text.
    if (url && !text && !documentKey) {
      fail('VALIDATION_FAILED', 'Paste the competition text. Fetching a URL is not supported yet.');
    }

    // An uploaded document becomes text first, then goes through exactly the
    // same extraction path as pasted text.
    let source = text;
    let kind = sourceType || 'pasted_text';

    if (documentKey) {
      let buffer;
      try {
        buffer = await storage.readObject(documentKey);
      } catch {
        fail('NOT_FOUND', 'That upload could not be found. Try uploading again.');
      }
      try {
        source = await textFromDocument(buffer, storage.filenameFromKey(documentKey));
      } catch (err) {
        fail('VALIDATION_FAILED', `Could not read that file: ${err.message}`);
      }
      kind = 'uploaded_document';

      if (!source.trim()) {
        // A scanned PDF or an image-only deck has no text layer. Say so plainly
        // rather than returning six empty fields with no explanation.
        fail('VALIDATION_FAILED', 'No text found in that file. If it is a scan or images, type the details in instead.');
      }
    }

    const result = await analyzeCompetition(source, { sourceType: kind });
    res.json({ ...result, documentKey: documentKey || null });
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
      // Keep the uploaded brief with the competition so everyone who later
      // sees the team can open the same document the leader worked from.
      documentKey: req.body?.documentKey || null,
      documentName: req.body?.documentKey ? storage.filenameFromKey(req.body.documentKey) : null,
      createdBy: req.auth.userId,
      createdAt: new Date().toISOString(),
    };

    await store.competitions.put(competition);
    res.status(201).json(competition);
  }));

  /**
   * A short-lived link to the competition's document.
   *
   * Any signed-in user can ask: the teams built on a competition are browsable,
   * so the brief behind them is too - that is the point of attaching it. The
   * URL expires in five minutes and the bucket stays private, so a link cannot
   * be passed around afterwards.
   */
  router.get('/:id/document', requireAuth, route(async (req, res) => {
    const competition = await store.competitions.get(req.params.id);
    if (!competition) fail('NOT_FOUND');
    if (!competition.documentKey) fail('NOT_FOUND', 'No document was attached to this competition.');
    if (!storage.enabled()) {
      fail('VALIDATION_FAILED', 'Document storage is not configured on this deployment.');
    }

    const { url, expiresIn } = await storage.createDownloadUrl(competition.documentKey);
    res.json({ url, expiresIn, filename: competition.documentName });
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
