import mongoose from '../shared/db/mongoose.js';
import { env } from './env.js';

export async function connectDatabase(uri = env.MONGO_URI, extraOptions = {}) {
  await mongoose.connect(uri, {
    ...extraOptions,
    // Int64 values (money, metrics) come back as native BigInt instead of lossy Numbers.
    useBigInt64: true,
    autoIndex: !env.isProd,
    serverSelectionTimeoutMS: 10_000,
  });
  return mongoose.connection;
}

export async function disconnectDatabase() {
  await mongoose.connection.close();
}
