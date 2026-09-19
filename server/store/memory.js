/**
 * In-memory store.
 *
 * Every collection exposes the same small async interface, so swapping in
 * Mongo or DynamoDB later means writing one more file that satisfies it -
 * routes and core logic do not change.
 *
 * Async on purpose even though nothing here awaits: the real backends will,
 * and callers should already be written for it.
 */

const COLLECTIONS = ['users', 'competitions', 'teams', 'joinRequests', 'invitations'];

function collection(idField) {
  const rows = new Map();

  return {
    async get(id) {
      return rows.get(id) || null;
    },

    async put(item) {
      if (!item || !item[idField]) throw new Error(`put() requires ${idField}`);
      rows.set(item[idField], { ...item });
      return { ...item };
    },

    async update(id, patch) {
      const existing = rows.get(id);
      if (!existing) return null;
      const next = { ...existing, ...patch, [idField]: id };
      rows.set(id, next);
      return { ...next };
    },

    async list() {
      return [...rows.values()].map((r) => ({ ...r }));
    },

    /** @param {(row: object) => boolean} predicate */
    async find(predicate) {
      return [...rows.values()].filter(predicate).map((r) => ({ ...r }));
    },

    async findOne(predicate) {
      const hit = [...rows.values()].find(predicate);
      return hit ? { ...hit } : null;
    },

    async remove(id) {
      return rows.delete(id);
    },

    async count() {
      return rows.size;
    },

    /** Test helper - not part of the interface other backends must satisfy. */
    _clear() {
      rows.clear();
    },
  };
}

const ID_FIELD = {
  users: 'userId',
  competitions: 'competitionId',
  teams: 'teamId',
  joinRequests: 'requestId',
  invitations: 'invitationId',
};

function createMemoryStore() {
  const store = {};
  for (const name of COLLECTIONS) store[name] = collection(ID_FIELD[name]);
  store._clearAll = () => COLLECTIONS.forEach((n) => store[n]._clear());
  return store;
}

module.exports = { createMemoryStore, COLLECTIONS, ID_FIELD };
