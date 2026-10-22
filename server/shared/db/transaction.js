import mongoose from './mongoose.js';

/**
 * Runs fn(session) inside a MongoDB multi-document transaction. The driver retries
 * the whole callback on TransientTransactionError (e.g. write conflicts between
 * concurrent payments), so fn must be idempotent with respect to its own reads.
 */
export async function withTransaction(fn) {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(
      async () => {
        result = await fn(session);
      },
      { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' } },
    );
    return result;
  } finally {
    await session.endSession();
  }
}
