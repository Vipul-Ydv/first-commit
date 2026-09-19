/**
 * DynamoDB store.
 *
 * Satisfies the same interface as memory.js, so routes and core logic do not
 * change - this is the file the store interface existed for.
 *
 * Why this is needed at all: the in-memory store cannot be deployed. Lambda
 * gives each cold start a fresh container and runs concurrent invocations in
 * different ones, so writes would vanish or appear inconsistently. Locally it
 * works only because there is a single process.
 *
 * Table names default to HackMatch-<Collection> and are overridable per
 * collection via env, e.g. TABLE_USERS.
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  ScanCommand,
} = require('@aws-sdk/lib-dynamodb');

const { COLLECTIONS, ID_FIELD } = require('./memory');

const TABLE_ENV = {
  users: 'TABLE_USERS',
  competitions: 'TABLE_COMPETITIONS',
  teams: 'TABLE_TEAMS',
  joinRequests: 'TABLE_JOIN_REQUESTS',
  invitations: 'TABLE_INVITATIONS',
};

const DEFAULT_TABLE = {
  users: 'HackMatch-Users',
  competitions: 'HackMatch-Competitions',
  teams: 'HackMatch-Teams',
  joinRequests: 'HackMatch-JoinRequests',
  invitations: 'HackMatch-Invitations',
};

function collection(doc, name) {
  const table = process.env[TABLE_ENV[name]] || DEFAULT_TABLE[name];
  const idField = ID_FIELD[name];

  /**
   * Scan, then filter in memory.
   *
   * Deliberate: hackathon-scale tables are a few dozen rows, and a Scan keeps
   * every access pattern working without designing a GSI per query. If this
   * ever holds real volume, the GSIs in docs/spec.md §6 replace these scans.
   */
  const scanAll = async () => {
    const rows = [];
    let ExclusiveStartKey;
    do {
      const page = await doc.send(
        new ScanCommand({ TableName: table, ExclusiveStartKey, ConsistentRead: true })
      );
      rows.push(...(page.Items || []));
      ExclusiveStartKey = page.LastEvaluatedKey;
    } while (ExclusiveStartKey);
    return rows;
  };

  return {
    async get(id) {
      // Strongly consistent: routes read a record immediately after writing it
      // (a profile is created, then a team is created against it). An
      // eventually-consistent read intermittently 404s on a row that exists.
      const { Item } = await doc.send(
        new GetCommand({ TableName: table, Key: { [idField]: id }, ConsistentRead: true })
      );
      return Item || null;
    },

    async put(item) {
      if (!item || !item[idField]) throw new Error(`put() requires ${idField}`);
      await doc.send(new PutCommand({ TableName: table, Item: item }));
      return item;
    },

    async update(id, patch) {
      const keys = Object.keys(patch).filter((k) => k !== idField);
      if (keys.length === 0) return this.get(id);

      // Attribute names are aliased because fields like `name` and `status`
      // are DynamoDB reserved words.
      const names = Object.fromEntries(keys.map((k, i) => [`#k${i}`, k]));
      const values = Object.fromEntries(keys.map((k, i) => [`:v${i}`, patch[k]]));
      const expression = `SET ${keys.map((_, i) => `#k${i} = :v${i}`).join(', ')}`;

      const { Attributes } = await doc.send(
        new UpdateCommand({
          TableName: table,
          Key: { [idField]: id },
          UpdateExpression: expression,
          ExpressionAttributeNames: names,
          ExpressionAttributeValues: values,
          ConditionExpression: `attribute_exists(${idField})`,
          ReturnValues: 'ALL_NEW',
        })
      ).catch((err) => {
        if (err.name === 'ConditionalCheckFailedException') return { Attributes: null };
        throw err;
      });

      return Attributes || null;
    },

    async list() {
      return scanAll();
    },

    async find(predicate) {
      return (await scanAll()).filter(predicate);
    },

    async findOne(predicate) {
      return (await scanAll()).find(predicate) || null;
    },

    async remove(id) {
      await doc.send(new DeleteCommand({ TableName: table, Key: { [idField]: id } }));
      return true;
    },

    async count() {
      return (await scanAll()).length;
    },
  };
}

function createDynamoStore() {
  const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
  const doc = DynamoDBDocumentClient.from(client, {
    marshallOptions: { removeUndefinedValues: true },
  });

  const store = {};
  for (const name of COLLECTIONS) store[name] = collection(doc, name);
  return store;
}

module.exports = { createDynamoStore, DEFAULT_TABLE };
