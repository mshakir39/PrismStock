import { connectToMongoDB } from '../src/app/libs/connectToMongoDB';

async function checkDatabase() {
  console.log('🔍 Checking database connection details...');

  try {
    const db = await connectToMongoDB();
    if (!db) {
      console.error('❌ Failed to connect to database');
      return;
    }

    console.log('✅ Connected to database');
    console.log('📊 Database name:', db.databaseName);
    console.log('📊 All collections in database:');
    
    const collections = await db.listCollections().toArray();
    collections.forEach((collection) => {
      console.log(`   - ${collection.name}`);
    });

    // Check if users and clients exist
    const usersCount = await db.collection('users').countDocuments();
    const clientsCount = await db.collection('clients').countDocuments();
    
    console.log(`\n👥 Users count: ${usersCount}`);
    console.log(`🏢 Clients count: ${clientsCount}`);

  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    process.exit(0);
  }
}

// Run the check
checkDatabase();
