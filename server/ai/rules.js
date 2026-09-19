/**
 * Deterministic competition extraction - the fallback provider.
 *
 * No network, no model, no AWS account required. Pattern-matches the six
 * approved fields out of pasted competition text and leaves anything it is not
 * confident about as null, so the human fills it in (spec A.2 step 3).
 *
 * This exists because the Bedrock path depends on an AWS account that may not
 * activate in time. Its output goes through the same validator and produces the
 * same shape, so nothing downstream can tell which provider ran.
 */

/* ------------------------------- name -------------------------------- */

const EVENT_WORDS = /hackathon|challenge|competition|contest|hack|summit|datathon|ideathon|jam|sprint|fest|cup|olympiad|bootcamp/i;

/** Lines that are clearly a labelled field, not the document's title. */
const NOT_A_TITLE = /^(deadline|last\s+date|organis|organiz|hosted|presented|eligib|team|registration|date|apply|submit|prize|venue|contact)/i;

function findName(lines) {
  // A markdown heading wins outright.
  const heading = lines.find((l) => /^#{1,3}\s+\S/.test(l));
  if (heading) return heading.replace(/^#+\s*/, '');

  // An explicit label is next most reliable.
  const byLabel = labelled(lines, /^(competition\s+)?(name|title)\s*[:\-]\s*(.+)$/i, 3);
  if (byLabel) return byLabel;

  const candidates = lines.filter((l) => l.length <= 120 && !NOT_A_TITLE.test(l));

  // A line that names an event type.
  const named = candidates.find((l) => EVENT_WORDS.test(l));
  if (named) return named;

  // "Something 2026" - a title carrying its year is a strong signal, and is
  // not a guess the way taking an arbitrary first line would be (spec A.2:
  // leave it blank rather than invent one).
  const withYear = candidates.find((l) => /\b20\d{2}\b/.test(l) && l.length <= 80);
  return withYear || null;
}

/* ----------------------------- organizer ------------------------------ */

function findOrganizer(lines, text) {
  const laballed = labelled(lines, /^(organis|organiz)(er|ed\s+by|ed)\s*[:\-]\s*(.+)$/i, 3);
  if (laballed) return laballed;

  const m = text.match(/\b(?:organi[sz]ed|hosted|presented|conducted)\s+by\s*[:\-]?\s*([^\n.,;]{2,80})/i);
  return m ? m[1].trim() : null;
}

/* ------------------------------ deadline ------------------------------ */

const MONTHS = 'jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec';

const DATE_PATTERNS = [
  // 30 September 2026 / 30 Sep 2026
  new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(${MONTHS})[a-z]*\\.?,?\\s+(\\d{4})`, 'i'),
  // September 30, 2026
  new RegExp(`\\b(${MONTHS})[a-z]*\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(\\d{4})`, 'i'),
  // 2026-09-30
  /\b(\d{4})-(\d{2})-(\d{2})\b/,
  // 30/09/2026 or 30-09-2026  (day first: Indian convention)
  /\b(\d{1,2})[/-](\d{1,2})[/-](\d{4})\b/,
];

const DEADLINE_CUE = /deadline|last\s+date|closes?\s+on|registration\s+ends?|apply\s+by|submit\s+by|due\s+(?:date|by)/i;

function findDeadline(lines, text) {
  // Prefer a date on a line that actually says "deadline".
  const cueLine = lines.find((l) => DEADLINE_CUE.test(l));
  const fromCue = cueLine && firstDate(cueLine);
  if (fromCue) return fromCue;

  // A date within a sentence following a deadline cue.
  const near = text.match(new RegExp(`${DEADLINE_CUE.source}[^.\\n]{0,60}`, 'i'));
  if (near) {
    const d = firstDate(near[0]);
    if (d) return d;
  }

  // No cue anywhere -> do not guess. A random date in the text is not a deadline.
  return null;
}

function firstDate(s) {
  for (const p of DATE_PATTERNS) {
    const m = s.match(p);
    if (!m) continue;
    const parsed = new Date(normaliseDate(m));
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().replace(/\.\d{3}Z$/, 'Z');
  }
  return null;
}

function normaliseDate(m) {
  const [full, a, b, c] = m;
  if (/^\d{4}$/.test(a)) return `${a}-${b}-${c}T23:59:00Z`;            // 2026-09-30
  if (/^\d/.test(a) && /^\d/.test(b)) return `${c}-${pad(b)}-${pad(a)}T23:59:00Z`; // 30/09/2026
  if (/^\d/.test(a)) return `${a} ${b} ${c} 23:59:00 UTC`;             // 30 September 2026
  return `${a} ${b} ${c} 23:59:00 UTC`;                                 // September 30, 2026
}

const pad = (n) => String(n).padStart(2, '0');

/* ----------------------------- team size ------------------------------ */

function findTeamSize(text) {
  // "teams of 2-4", "team size: 2 to 4", "2–4 members"
  const range = text.match(/\bteams?\s*(?:size|of)?\s*[:\-]?\s*(\d{1,2})\s*(?:-|–|to)\s*(\d{1,2})/i)
    || text.match(/\b(\d{1,2})\s*(?:-|–|to)\s*(\d{1,2})\s*(?:members|people|participants)\b/i);
  if (range) return { min: +range[1], max: +range[2] };

  const min = text.match(/\b(?:min(?:imum)?)\s*(?:team\s*size)?\s*[:\-]?\s*(?:of\s*)?(\d{1,2})/i);
  const max = text.match(/\b(?:max(?:imum)?|up\s+to|at\s+most|no\s+more\s+than)\s*(?:team\s*size)?\s*[:\-]?\s*(?:of\s*)?(\d{1,2})/i);

  return { min: min ? +min[1] : null, max: max ? +max[1] : null };
}

/* ----------------------------- eligibility ---------------------------- */

/**
 * Capture whatever follows a restriction cue, rather than trying to recognise
 * institution names by keyword. Real institutions are often bare acronyms
 * ("BTKIT", "IIITD") that no keyword list would catch.
 */
const RESTRICTION = /\b(?:only|restricted|limited|exclusively|reserved)\s+(?:open\s+)?(?:to|for)?\s*(?:students\s+)?(?:from|of)\s+([^.\n;]{2,100})/i;

function findEligibility(text) {
  const openToAll = /\bopen\s+to\s+(?:all|everyone|anyone)\b/i.test(text);
  const studentOnly =
    !openToAll &&
    /\bstudents?\s+only\b|\bonly\s+(?:open\s+)?(?:to|for)\s+students\b|\bopen\s+only\s+to\s+students\b|\bmust\s+be\s+a\s+student\b/i.test(text);

  let allowedInstitutions = [];
  if (!openToAll) {
    const m = text.match(RESTRICTION);
    if (m) {
      allowedInstitutions = m[1]
        .split(/\s+and\s+|\s*,\s*|\s*\/\s*/)
        .map((s) => s.trim())
        .filter((s) => s.length >= 2 && s.length <= 80)
        // "students from any college" is not a restriction
        .filter((s) => !/^(any|all|every)\b/i.test(s));
    }
  }

  return {
    studentOnly,
    institutionRestriction: allowedInstitutions.length > 0,
    allowedInstitutions,
  };
}

/* -------------------------------- main -------------------------------- */

function labelled(lines, pattern, group) {
  for (const l of lines) {
    const m = l.match(pattern);
    if (m && m[group]) return m[group].trim();
  }
  return null;
}

/**
 * @param {string} text raw pasted competition text
 * @returns the six raw fields; `validateExtraction` cleans and gates them
 */
function extractWithRules(text = '') {
  const clean = String(text).replace(/\r/g, '');
  const lines = clean.split('\n').map((l) => l.trim()).filter(Boolean);
  const { min, max } = findTeamSize(clean);

  return {
    name: findName(lines),
    organizer: findOrganizer(lines, clean),
    deadline: findDeadline(lines, clean),
    teamSizeMin: min,
    teamSizeMax: max,
    eligibility: findEligibility(clean),
  };
}

module.exports = { extractWithRules };
