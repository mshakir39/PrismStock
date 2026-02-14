import { connectToMongoDB } from '../src/app/libs/connectToMongoDB';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

async function simpleInit() {
  console.log('🚀 Simple database initialization...');

  try {
    const db = await connectToMongoDB();
    if (!db) {
      console.error('❌ Failed to connect to database');
      return;
    }

    console.log('✅ Connected to database');

    // Drop existing collections
    console.log('🗑️  Dropping existing collections...');
    await db.collection('clients').drop().catch(() => {});
    await db.collection('users').drop().catch(() => {});

    // Create collections without validation first
    console.log('📋 Creating collections...');
    await db.createCollection('clients');
    await db.createCollection('users');

    // Create indexes
    console.log('🔍 Creating indexes...');
    await db.collection('clients').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ clientId: 1 });

    // Create super admin user
    console.log('👑 Creating super admin user...');
    const superAdminPassword = await bcrypt.hash('admin123', 12);
    const superAdminResult = await db.collection('users').insertOne({
      name: 'Super Admin',
      email: 'superadmin@prismstock.com',
      password: superAdminPassword,
      role: 'super_admin',
      isActive: true,
      isSuperAdmin: true,
      profile: {
        phone: '+1234567890',
        address: 'Global Headquarters'
      },
      permissions: [
        'users.create', 'users.read', 'users.update', 'users.delete',
        'clients.create', 'clients.read', 'clients.update', 'clients.delete',
        'brands.create', 'brands.read', 'brands.update', 'brands.delete',
        'categories.create', 'categories.read', 'categories.update', 'categories.delete',
        'customers.create', 'customers.read', 'customers.update', 'customers.delete',
        'invoices.create', 'invoices.read', 'invoices.update', 'invoices.delete',
        'sales.create', 'sales.read', 'sales.update', 'sales.delete',
        'stock.create', 'stock.read', 'stock.update', 'stock.delete',
        'warranty.create', 'warranty.read', 'warranty.update', 'warranty.delete',
        'meetups.create', 'meetups.read', 'meetups.update', 'meetups.delete',
        'system.admin'
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const superAdminId = superAdminResult.insertedId;

    // Create sample clients
    console.log('🏢 Creating sample clients...');
    const client1Result = await db.collection('clients').insertOne({
      name: 'Tech Solutions Inc',
      email: 'contact@techsolutions.com',
      phone: '+1-555-0101',
      address: '123 Tech Street, Silicon Valley, CA 94000',
      status: 'active',
      createdBy: superAdminId,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const client2Result = await db.collection('clients').insertOne({
      name: 'Global Retail LLC',
      email: 'info@globalretail.com',
      phone: '+1-555-0102',
      address: '456 Commerce Ave, New York, NY 10001',
      status: 'active',
      createdBy: superAdminId,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Create client admin users
    console.log('👥 Creating client admin users...');
    const clientAdminPassword = await bcrypt.hash('client123', 12);

    await db.collection('users').insertMany([
      {
        name: 'Tech Solutions Admin',
        email: 'admin@techsolutions.com',
        password: clientAdminPassword,
        role: 'admin',
        isActive: true,
        clientId: client1Result.insertedId.toString(),
        isSuperAdmin: false,
        profile: {
          phone: '+1-555-0111',
          address: '123 Tech Street, Silicon Valley, CA 94000'
        },
        permissions: [
          'users.create', 'users.read', 'users.update', 'users.delete',
          'brands.create', 'brands.read', 'brands.update', 'brands.delete',
          'categories.create', 'categories.read', 'categories.update', 'categories.delete',
          'customers.create', 'customers.read', 'customers.update', 'customers.delete',
          'invoices.create', 'invoices.read', 'invoices.update', 'invoices.delete',
          'sales.create', 'sales.read', 'sales.update', 'sales.delete',
          'stock.create', 'stock.read', 'stock.update', 'stock.delete',
          'warranty.create', 'warranty.read', 'warranty.update', 'warranty.delete',
          'meetups.create', 'meetups.read', 'meetups.update', 'meetups.delete'
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Global Retail Admin',
        email: 'admin@globalretail.com',
        password: clientAdminPassword,
        role: 'admin',
        isActive: true,
        clientId: client2Result.insertedId.toString(),
        isSuperAdmin: false,
        profile: {
          phone: '+1-555-0112',
          address: '456 Commerce Ave, New York, NY 10001'
        },
        permissions: [
          'users.create', 'users.read', 'users.update', 'users.delete',
          'brands.create', 'brands.read', 'brands.update', 'brands.delete',
          'categories.create', 'categories.read', 'categories.update', 'categories.delete',
          'customers.create', 'customers.read', 'customers.update', 'customers.delete',
          'invoices.create', 'invoices.read', 'invoices.update', 'invoices.delete',
          'sales.create', 'sales.read', 'sales.update', 'sales.delete',
          'stock.create', 'stock.read', 'stock.update', 'stock.delete',
          'warranty.create', 'warranty.read', 'warranty.update', 'warranty.delete',
          'meetups.create', 'meetups.read', 'meetups.update', 'meetups.delete'
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    console.log('✅ Multi-tenant database initialized successfully!');
    console.log('');
    console.log('📋 Login Credentials:');
    console.log('');
    console.log('👑 Super Admin:');
    console.log('   Email: superadmin@prismstock.com');
    console.log('   Password: admin123');
    console.log('');
    console.log('🏢 Client Admins:');
    console.log('   Tech Solutions Admin:');
    console.log('   Email: admin@techsolutions.com');
    console.log('   Password: client123');
    console.log('');
    console.log('   Global Retail Admin:');
    console.log('   Email: admin@globalretail.com');
    console.log('   Password: client123');
    console.log('');

  } catch (error) {
    console.error('❌ Error initializing database:', error);
  } finally {
    process.exit(0);
  }
}

// Run the initialization
simpleInit();
