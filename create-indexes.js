// MongoDB Index Creation Script
// Run this script with: node create-indexes.js
// Make sure MONGODB_URI environment variable is set

const { MongoClient } = require('mongodb');

async function createIndexes() {
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.error('❌ Error: MONGODB_URI environment variable is not set');
    console.log('Please set your MongoDB connection string:');
    console.log('export MONGODB_URI="your-connection-string"');
    process.exit(1);
  }
  
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();

    // HIGH PRIORITY INDEXES (Most frequently used collections)
    console.log('Creating high priority indexes...');

    // Customers collection - clientId + createdAt for filtering and sorting
    await db.collection('customers').createIndex(
      { "clientId": 1, "createdAt": -1 },
      { name: "customers_client_createdAt" }
    );
    console.log('✓ Customers index created');

    // Categories collection - clientId + name for filtering and sorting
    // Using 'name' as the standard field for category names
    await db.collection('categories').createIndex(
      { "clientId": 1, "name": 1 },
      { name: "categories_client_name" }
    );
    console.log('✓ Categories index created (clientId + name)');

    // MEDIUM PRIORITY INDEXES (Date-sorted collections)
    console.log('Creating medium priority indexes...');

    // Invoices collection - createdAt for chronological sorting
    await db.collection('invoices').createIndex(
      { "createdAt": -1 },
      { name: "invoices_createdAt" }
    );
    console.log('✓ Invoices index created');

    // Sales collection - createdAt for chronological sorting
    await db.collection('sales').createIndex(
      { "createdAt": -1 },
      { name: "sales_createdAt" }
    );
    console.log('✓ Sales index created');

    console.log('\n🎉 All indexes created successfully!');
    console.log('\nIndex Summary:');
    console.log('• customers: { clientId: 1, createdAt: -1 }');
    console.log('• categories: { clientId: 1, name: 1 }');
    console.log('• invoices: { createdAt: -1 }');
    console.log('• sales: { createdAt: -1 }');

  } catch (error) {
    console.error('Error creating indexes:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

createIndexes();
