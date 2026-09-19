/**
 * Store selection.
 *
 *   STORE=memory   (default) in-process. Local development only - see the
 *                  warning in dynamo.js about why it cannot be deployed.
 *   STORE=dynamo   DynamoDB. Required for any real deployment.
 */

const { createMemoryStore } = require('./memory');

function createStore() {
  const kind = process.env.STORE || 'memory';

  if (kind === 'dynamo') {
    // Required lazily so local development never needs the AWS SDK installed.
    const { createDynamoStore } = require('./dynamo');
    return { store: createDynamoStore(), kind };
  }

  if (kind !== 'memory') {
    throw new Error(`Unknown STORE "${kind}" - expected "memory" or "dynamo"`);
  }

  return { store: createMemoryStore(), kind };
}

module.exports = { createStore };
