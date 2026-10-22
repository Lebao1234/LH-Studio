import mongoose from 'mongoose';

mongoose.set('strictQuery', true);

/** Converts BigInt values (BSON Long) to exact decimal strings for JSON output. */
function serializeBigInts(value) {
  if (typeof value === 'bigint') return value.toString();
  if (Array.isArray(value)) return value.map(serializeBigInts);
  if (value && typeof value === 'object' && value.constructor === Object) {
    for (const key of Object.keys(value)) value[key] = serializeBigInts(value[key]);
  }
  return value;
}

// Global plugin: must be registered before any model is compiled. Every model file
// imports mongoose from here, so ES module evaluation order guarantees that.
mongoose.plugin((schema) => {
  const transform = (_doc, ret) => {
    delete ret.__v;
    delete ret.passwordHash;
    delete ret.tokenHash;
    return serializeBigInts(ret);
  };
  schema.set('toJSON', { virtuals: true, versionKey: false, transform });
  schema.set('toObject', { virtuals: true, versionKey: false });
});

export { serializeBigInts };
export default mongoose;
