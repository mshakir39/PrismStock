import { connectToMongoDB } from '../src/app/libs/connectToMongoDB';

async function checkUsers() {
  console.log('🔍 Checking users in database...');

  try {
    const db = await connectToMongoDB();
    if (!db) {
      console.error('❌ Failed to connect to database');
      return;
    }

    console.log('✅ Connected to database');

    // Check users collection
    const usersCollection = db.collection('users');
    const users = await usersCollection.find({}).toArray();

    console.log(`📊 Total users found: ${users.length}`);
    
    users.forEach((user, index) => {
      console.log(`\n👤 User ${index + 1}:`);
      console.log(`   ID: ${user._id}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Client ID: ${user.clientId || 'None (Super Admin)'}`);
      console.log(`   Is Super Admin: ${user.isSuperAdmin || false}`);
      console.log(`   Active: ${user.isActive}`);
      console.log(`   Created: ${user.createdAt}`);
    });

    // Check clients collection
    const clientsCollection = db.collection('clients');
    const clients = await clientsCollection.find({}).toArray();

    console.log(`\n🏢 Total clients found: ${clients.length}`);
    
    clients.forEach((client, index) => {
      console.log(`\n🏢 Client ${index + 1}:`);
      console.log(`   ID: ${client._id}`);
      console.log(`   Name: ${client.name}`);
      console.log(`   Email: ${client.email}`);
      console.log(`   Status: ${client.status}`);
      console.log(`   Created By: ${client.createdBy}`);
    });

  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    process.exit(0);
  }
}

// Run the check
checkUsers();
