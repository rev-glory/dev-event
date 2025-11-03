import mongoose from 'mongoose';

// Define the MongoDB URI from environment variables
const MONGODB_URI = process.env.MONGODB_URI;

// Validate that the MongoDB URI is provided
if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

// Define TypeScript interface for the cached connection
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Extend the NodeJS global type to include our mongoose cache
declare global {
  var mongoose: MongooseCache | undefined;
}

// Initialize the cache object
// Use global variable to persist the connection across hot reloads in development
let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

/**
 * Establishes a connection to MongoDB using Mongoose
 * Caches the connection to prevent multiple connections during development hot reloads
 * @returns Promise resolving to the Mongoose instance
 */
async function connectDB(): Promise<typeof mongoose> {
  // If connection already exists, return it
  if (cached.conn) {
    return cached.conn;
  }

  // If connection promise doesn't exist, create a new one
  if (!cached.promise) {
    const options = {
      bufferCommands: false, // Disable mongoose buffering
    };

    cached.promise = mongoose
      .connect(MONGODB_URI as string, options)
      .then((mongoose) => {
        console.log('✅ MongoDB connected successfully');
        return mongoose;
      })
      .catch((error) => {
        console.error('❌ MongoDB connection error:', error);
        throw error;
      });
  }

  try {
    // Wait for the connection promise to resolve and cache it
    cached.conn = await cached.promise;
  } catch (error) {
    // If connection fails, reset the promise to allow retry
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

export default connectDB;
