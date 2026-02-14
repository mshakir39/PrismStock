import { Db, MongoClient } from 'mongodb';

interface MongoConnection {
  client: MongoClient | null;
  db: Db | null;
  lastUsed: number;
  isConnecting: boolean;
}

let connection: MongoConnection = {
  client: null,
  db: null,
  lastUsed: 0,
  isConnecting: false,
};

const CONNECTION_TIMEOUT = 3 * 60 * 1000;
const IDLE_TIMEOUT = 2 * 60 * 1000;
let cleanupTimer: NodeJS.Timeout | null = null;
let handlersAdded = false;

function extractDbNameFromUri(uri: string): string | null {
  try {
    const match = uri.match(/\/([^/?]+)(?:\?|$)/);
    return match ? match[1] : null;
  } catch (error) {
    console.warn('Could not extract database name from URI:', error);
    return null;
  }
}

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = 'PrismStore';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

// Enhanced connection with pooling and caching
export async function connectToMongoDB(): Promise<Db | null> {
  // Return cached connection if available and not expired
  if (connection.client && connection.db && !isConnectionExpired()) {
    connection.lastUsed = Date.now();
    return connection.db;
  }

  // Prevent multiple simultaneous connection attempts
  if (connection.isConnecting) {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (!connection.isConnecting && connection.db) {
          clearInterval(checkInterval);
          resolve(connection.db);
        }
      }, 100);
    });
  }

  connection.isConnecting = true;

  try {
    // During build time, return null to prevent connection attempts
    if (
      process.env.NEXT_PHASE === 'phase-production-build' ||
      (process.env.NODE_ENV === 'production' &&
        process.env.VERCEL_ENV === undefined)
    ) {
      console.log('🚫 Skipping MongoDB connection during build phase');
      connection.isConnecting = false;
      return null;
    }

    console.log('🔗 Connecting to MongoDB...');
    const client = new MongoClient(MONGODB_URI!, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    });

    await client.connect();
    const db = client.db(MONGODB_DB!);

    connection.client = client;
    connection.db = db;
    connection.lastUsed = Date.now();
    connection.isConnecting = false;

    // Setup cleanup handlers
    if (!handlersAdded) {
      setupCleanupHandlers();
      handlersAdded = true;
    }

    console.log('✅ Connected to MongoDB successfully');
    return db;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    connection.isConnecting = false;
    return null;
  }
}

function isConnectionExpired(): boolean {
  return Date.now() - connection.lastUsed > IDLE_TIMEOUT;
}

function setupCleanupHandlers() {
  const cleanup = async () => {
    if (connection.client) {
      try {
        await connection.client.close();
        console.log('🔌 MongoDB connection closed');
      } catch (error) {
        console.error('Error closing MongoDB connection:', error);
      }
      connection.client = null;
      connection.db = null;
    }
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('beforeExit', cleanup);

  // Setup idle timeout cleanup
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
  }

  cleanupTimer = setInterval(() => {
    if (connection.client && isConnectionExpired()) {
      cleanup();
    }
  }, CONNECTION_TIMEOUT);
}

// Export connection for direct access if needed
export { connection as mongoConnection };

// Export database name for other modules
export { MONGODB_DB };

// Export utility functions
export function getConnectionStats() {
  return {
    isConnected: !!connection.client && !!connection.db,
    lastUsed: connection.lastUsed,
    timeSinceLastUsed: connection.lastUsed
      ? Date.now() - connection.lastUsed
      : 0,
    isConnecting: connection.isConnecting,
  };
}

export function isBuildMode(): boolean {
  return (
    process.env.NEXT_PHASE === 'phase-production-build' ||
    (process.env.NODE_ENV === 'production' &&
      process.env.VERCEL_ENV === undefined)
  );
}

export async function closeMongoConnection() {
  const cleanup = async () => {
    if (connection.client) {
      try {
        await connection.client.close();
        console.log('🔌 MongoDB connection closed');
      } catch (error) {
        console.error('Error closing MongoDB connection:', error);
      }
      connection.client = null;
      connection.db = null;
    }
  };

  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }

  await cleanup();
}
