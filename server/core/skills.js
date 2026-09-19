/**
 * Skill normalisation and synonym resolution.
 *
 * Spec §9: the synonym dictionary is the PRIMARY mechanism. Bedrock semantic
 * matching is an optional fallback, not the default path. Everything here is
 * deterministic and testable without a network call.
 */

/** canonical form -> the spellings people actually type */
const SYNONYM_GROUPS = {
  'machine learning': ['ml', 'machinelearning', 'machine-learning'],
  'artificial intelligence': ['ai'],
  'deep learning': ['dl'],
  'natural language processing': ['nlp'],
  'computer vision': ['cv', 'opencv'],
  'ui/ux': ['ui', 'ux', 'ui ux', 'ui-ux', 'uiux', 'user interface', 'user experience', 'design'],
  javascript: ['js', 'ecmascript'],
  typescript: ['ts'],
  'node.js': ['node', 'nodejs'],
  'react.js': ['react', 'reactjs'],
  python: ['py'],
  aws: ['amazon web services'],
  'ci/cd': ['cicd', 'ci cd'],
  devops: ['dev ops'],
  postgresql: ['postgres', 'psql'],
  mongodb: ['mongo'],
  kubernetes: ['k8s'],
};

/** flattened lookup: any spelling -> canonical */
const LOOKUP = {};
for (const [canonical, aliases] of Object.entries(SYNONYM_GROUPS)) {
  LOOKUP[canonical] = canonical;
  for (const alias of aliases) LOOKUP[alias] = canonical;
}

/**
 * Reduce a skill string to a comparable key.
 * "  Machine-Learning " and "ML" both become "machine learning".
 */
function canonical(skill) {
  if (typeof skill !== 'string') return '';
  const cleaned = skill.trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');
  return LOOKUP[cleaned] || cleaned;
}

/** Set of canonical keys for a list of skills. */
function canonicalSet(skills = []) {
  return new Set(skills.map(canonical).filter(Boolean));
}

/**
 * Compare two skill lists.
 * Returns the ORIGINAL spelling from `wanted`, so the UI shows the leader's
 * own wording ("Machine Learning") rather than the canonical key.
 */
function intersect(wanted = [], have = []) {
  const haveSet = canonicalSet(have);
  return wanted.filter((s) => haveSet.has(canonical(s)));
}

function subtract(wanted = [], have = []) {
  const haveSet = canonicalSet(have);
  return wanted.filter((s) => !haveSet.has(canonical(s)));
}

/** True if two skill strings mean the same thing. */
function sameSkill(a, b) {
  return canonical(a) === canonical(b) && canonical(a) !== '';
}

module.exports = { canonical, canonicalSet, intersect, subtract, sameSkill, SYNONYM_GROUPS };
