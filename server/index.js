/**
 * Server entry point.
 *
 * This file is what `npm run dev` has been pointing at since the first commit
 * without it ever existing - nothing mounted the routes, so the backend could
 * never start.
 *
 * For Lambda, do not use this file: import ./app and wrap it with
 * serverless-http. Keeping the listener separate from the app is what lets the
 * same code run locally, on EC2, or in Lambda unchanged.
 */

require('dotenv').config();

const { createApp } = require('./app');
const { createStore } = require('./store');
const { seed } = require('./store/seed');

const PORT = process.env.PORT || 5000;

(async () => {
  const { store, kind } = createStore();
  console.log(`[store] ${kind}`);

  // Seeded by default in development so the recommendation screens have
  // something to show. SEED=false to start empty.
  if (process.env.SEED !== 'false') {
    const counts = await seed(store);
    console.log(`[seed] ${counts.users} users, ${counts.teams} teams, ${counts.competitions} competition`);
  }

  const app = createApp({ store });

  app.listen(PORT, () => {
    console.log(`[hackmatch] listening on http://localhost:${PORT}`);
    console.log(`[hackmatch] extraction provider: ${process.env.EXTRACTION_PROVIDER || 'rules'}`);
    if (process.env.NODE_ENV !== 'production') {
      console.log('[hackmatch] dev auth enabled - send header  x-dev-user: user_456');
    }
  });
})();
