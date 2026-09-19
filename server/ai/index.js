/**
 * Competition extraction adapter.
 *
 * One entry point, two providers, identical output shape. Downstream code -
 * routes, database, the frontend form - cannot tell which one ran.
 *
 *   EXTRACTION_PROVIDER=rules     (default) deterministic, no AWS needed
 *   EXTRACTION_PROVIDER=bedrock   real model call, falls back to rules on any error
 *
 * Switching providers is one environment variable. Nothing else changes.
 */

const { extractWithRules } = require('./rules');
const { extractWithBedrock } = require('./bedrock');
const { validateExtraction } = require('./validate');

/**
 * @param {string} text        pasted competition text or document contents
 * @param {object} [opts]
 * @param {string} [opts.sourceType]  'pasted_text' | 'pasted_url' | 'uploaded_document' | 'manual'
 * @param {string} [opts.provider]    override the env setting
 * @returns the shape of client/src/api/mock/competition-analyze.json,
 *          plus `provider` so the caller can log which path ran
 */
async function analyzeCompetition(text, opts = {}) {
  const sourceType = opts.sourceType || 'pasted_text';
  const wanted = opts.provider || process.env.EXTRACTION_PROVIDER || 'rules';

  if (!text || !String(text).trim()) {
    // Nothing to extract from: return an all-blank form rather than an error,
    // so the leader can just fill it in manually (spec A.2 step 4).
    return { ...validateExtraction({}, 'manual'), provider: 'none' };
  }

  if (wanted === 'bedrock') {
    try {
      const raw = await extractWithBedrock(text);
      return { ...validateExtraction(raw, sourceType), provider: 'bedrock' };
    } catch (err) {
      // Bedrock unavailable, throttled, or misconfigured. Degrade, never fail:
      // a worse extraction that a human reviews beats a broken form.
      console.warn(`[extraction] bedrock failed, falling back to rules: ${err.message}`);
    }
  }

  const raw = extractWithRules(text);
  return { ...validateExtraction(raw, sourceType), provider: 'rules' };
}

module.exports = { analyzeCompetition };
