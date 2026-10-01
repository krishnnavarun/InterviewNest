import mongoose from 'mongoose';
import { env } from './env.js';
import { AppError } from '../lib/AppError.js';

// Serverless platforms (Vercel) reuse warm instances between requests, so we
// cache the connection promise instead of reconnecting on every request.
let connectionPromise = null;

export function connectDB() {
  if (mongoose.connection.readyState === 1) return Promise.resolve(mongoose.connection);
  if (!env.MONGODB_URI) return Promise.reject(new AppError(503, 'Database is not configured (MONGODB_URI missing).'));

  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(env.MONGODB_URI, { dbName: env.MONGODB_DB_NAME, serverSelectionTimeoutMS: 10000 })
      .then((instance) => {
        console.log(`[db] MongoDB connected: ${instance.connection.host}/${instance.connection.name}`);
        return instance.connection;
      })
      .catch((error) => {
        connectionPromise = null; // allow the next request to retry
        throw error;
      });
  }
  return connectionPromise;
}
