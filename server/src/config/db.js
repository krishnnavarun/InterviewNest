import dns from 'node:dns';
import mongoose from 'mongoose';
import { env } from './env.js';
import { AppError } from '../lib/AppError.js';

// Resolve MongoDB Atlas SRV records reliably on Windows / Node by using Google & Cloudflare DNS
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch {
  // Ignored in restricted environments
}

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
        if (error?.message?.includes('querySrv')) {
          console.warn('[db] Notice: MongoDB Atlas SRV DNS resolution failed. Check your network DNS, ensure IP is whitelisted in Atlas Network Access, or use the standard non-SRV replica set connection string from Atlas.');
        }
        throw error;
      });
  }
  return connectionPromise;
}
