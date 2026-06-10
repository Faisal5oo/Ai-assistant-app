import mongoose from "mongoose";

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

/**
 * Standalone/local MongoDB does not support retryable writes or transactions.
 * Ensure the URI opts out when not already set.
 * @param {string} uri
 */
function withStandaloneCompat(uri) {
  if (/retryWrites=/i.test(uri)) {
    return uri;
  }
  const separator = uri.includes("?") ? "&" : "?";
  return `${uri}${separator}retryWrites=false`;
}

/**
 * @returns {Promise<typeof mongoose>}
 */
export async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error(
      "Please define the MONGODB_URI environment variable inside .env.local"
    );
  }

  const uri = withStandaloneCompat(MONGODB_URI);

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(uri, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}
