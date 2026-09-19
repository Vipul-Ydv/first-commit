/**
 * Amazon Comprehend extraction provider.
 *
 * Comprehend is genuinely better than a regex at finding an organisation name
 * in messy prose. What it cannot do is say what an entity *means* to us: ask it
 * about a competition brief and it returns every date it sees, with no idea
 * which one is the registration deadline and which is the judging date.
 *
 * So the split is:
 *
 *   Comprehend  ->  name, organizer            (entity recognition)
 *   rules       ->  deadline                   (which date sits by a cue)
 *   rules       ->  team size, eligibility     (Comprehend has no concept of
 *                                               "teams of 2-4" or "students only")
 *
 * Each does the part it is actually good at. Anything Comprehend is unsure
 * about falls back to the rules parser, and if the whole call fails the caller
 * falls back to rules entirely.
 */

const { extractWithRules } = require('./rules');

// Below this, the guess is not worth preferring over the regex.
const MIN_CONFIDENCE = 0.75;

// Comprehend charges per 100 characters; a brief's useful metadata is near the
// top, and this keeps a long deck from costing more than it needs to.
const MAX_CHARS = 5000;

function client() {
  const { ComprehendClient } = require('@aws-sdk/client-comprehend');
  return new ComprehendClient({ region: process.env.COMPREHEND_REGION || process.env.AWS_REGION || 'us-east-1' });
}

/** Entities sometimes span a line break; keep the first line and tidy it. */
function clean(text) {
  return String(text || '').split('\n')[0].replace(/\s+/g, ' ').trim();
}

/**
 * @param {'earliest'|'score'} pick
 *
 * `earliest` matters for the competition name. A brief's title sits at the top,
 * but Comprehend scores by how confidently it recognises an entity - so a
 * partner organisation named further down ("Bharat Builds Tour", 0.99) beat the
 * actual title ("AI Innovation Challenge 2026", 0.77) and became the name.
 * Position is the better signal for which EVENT is the subject of the document.
 */
function best(entities, type, { exclude = [], pick = 'score' } = {}) {
  const skip = exclude.map((s) => String(s).toLowerCase());
  const candidates = entities
    .filter((e) => e.Type === type && e.Score >= MIN_CONFIDENCE)
    .map((e) => ({ ...e, clean: clean(e.Text) }))
    .filter((e) => e.clean.length >= 2 && !skip.includes(e.clean.toLowerCase()));

  candidates.sort(
    pick === 'earliest' ? (a, b) => a.BeginOffset - b.BeginOffset : (a, b) => b.Score - a.Score
  );
  return candidates[0]?.clean || null;
}

async function extractWithComprehend(text) {
  const { DetectEntitiesCommand } = require('@aws-sdk/client-comprehend');

  const res = await client().send(
    new DetectEntitiesCommand({
      Text: String(text).slice(0, MAX_CHARS),
      LanguageCode: 'en',
    })
  );
  const entities = res.Entities || [];

  // The rules parser runs regardless - it owns everything Comprehend cannot
  // reason about, and backs up the fields it can.
  const rules = extractWithRules(text);

  const modelName = best(entities, 'EVENT', { pick: 'earliest' });
  const name = modelName || rules.name;

  // Prefer the rules organizer when it found one: it anchors on an explicit
  // "Organised by:" label, which is more precise than any entity guess.
  // Comprehend earns its place on briefs that carry no such label.
  const modelOrg = best(entities, 'ORGANIZATION', { exclude: [name] });
  const organizer = rules.organizer || modelOrg;

  return {
    name,
    organizer,
    // Deliberately the rules value. Comprehend returns every date it finds and
    // cannot tell a registration deadline from a judging date; the regex knows
    // to take the one sitting next to a deadline cue.
    deadline: rules.deadline,
    teamSizeMin: rules.teamSizeMin,
    teamSizeMax: rules.teamSizeMax,
    eligibility: rules.eligibility,

    // Which fields the model actually contributed, so the caller can say so.
    _comprehend: {
      entitiesFound: entities.length,
      usedFor: [
        modelName ? 'name' : null,
        !rules.organizer && modelOrg ? 'organizer' : null,
      ].filter(Boolean),
    },
  };
}

module.exports = { extractWithComprehend, best, MIN_CONFIDENCE };
