/**
 * Creates/updates every Mongoose-defined index. Production disables autoIndex,
 * so run this once after deploying schema changes:  npm run sync-indexes
 */
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import mongoose from '../shared/db/mongoose.js';
import '../routes/index.js'; // registers every model

async function main() {
  await connectDatabase();
  for (const model of Object.values(mongoose.models)) {
    await model.createCollection();
    const dropped = await model.syncIndexes();
    console.log(`${model.collection.collectionName}: indexes synced${dropped.length ? ` (dropped ${dropped.join(', ')})` : ''}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => disconnectDatabase());

