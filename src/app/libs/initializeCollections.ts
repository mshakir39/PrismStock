import { connectToMongoDB } from './connectToMongoDB';

const REQUIRED_COLLECTIONS = [
  'brands',
  'categories',
  'products',
  'stock',
  'users',
];

export async function initializeCollections() {
  try {
    const db = await connectToMongoDB();
    if (!db) {
      throw new Error('Failed to connect to database');
    }

    // Get list of existing collections
    const existingCollections = await db.listCollections().toArray();
    const existingCollectionNames = existingCollections.map((col) => col.name);

    // Create missing collections
    for (const collectionName of REQUIRED_COLLECTIONS) {
      if (!existingCollectionNames.includes(collectionName)) {
        await db.createCollection(collectionName);
        console.log(`✅ Created collection: ${collectionName}`);
      }
    }

    console.log('✅ All required collections initialized');
  } catch (error) {
    console.error('Error initializing collections:', error);
    throw error;
  }
}
