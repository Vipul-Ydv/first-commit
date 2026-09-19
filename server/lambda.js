/**
 * Lambda entry point.
 *
 * The same Express app as local development, wrapped for API Gateway. This is
 * why app.js has no listener - the deployment target is a wrapper choice
 * rather than a rewrite.
 *
 * The app and store are built once per container and reused across warm
 * invocations; only the first request in a container pays the cost.
 */

const serverless = require('serverless-http');
const { createApp } = require('./app');
const { createStore } = require('./store');

let handler;

function boot() {
  if (handler) return handler;

  const { store, kind } = createStore();
  if (kind === 'memory') {
    // Loud on purpose. In Lambda this silently loses data: each cold start is
    // a fresh container and concurrent requests land in different ones.
    console.warn('[store] running in-memory inside Lambda - data will NOT persist. Set STORE=dynamo.');
  }

  handler = serverless(createApp({ store }));
  return handler;
}

module.exports.handler = async (event, context) => {
  // Let the response return without waiting for an idle event loop.
  context.callbackWaitsForEmptyEventLoop = false;
  return boot()(event, context);
};
