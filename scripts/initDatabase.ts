import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

async function initDatabase() {
  const uri = 'mongodb+srv://testuser:testuser@serverlessinstance0.a00kcsk.mongodb.net/PrismStore?retryWrites=true&w=majority&appName=ServerlessInstance0';

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db('PrismStore');

    // Drop existing users collection if it exists
    const collections = await db.listCollections({ name: 'users' }).toArray();
    if (collections.length > 0) {
      await db.dropCollection('users');
      console.log('ℹ️ Dropped existing users collection');
    }

    // Create new users collection with schema validation
    await db.createCollection('users', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['name', 'email', 'password', 'role', 'isActive'],
          properties: {
            name: { bsonType: 'string' },
            email: {
              bsonType: 'string',
              pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
            },
            password: { bsonType: 'string' },
            role: {
              enum: ['super_admin', 'admin', 'manager', 'sales', 'viewer'],
              description: 'must be a valid user role'
            },
            isActive: { bsonType: 'bool' },
            profile: {
              bsonType: 'object',
              properties: {
                phone: { bsonType: 'string' },
                address: { bsonType: 'string' },
                avatar: { bsonType: 'string' }
              }
            },
            permissions: {
              bsonType: 'array',
              items: { bsonType: 'string' }
            },
            lastLogin: { bsonType: 'date' },
            createdAt: { bsonType: 'date' },
            updatedAt: { bsonType: 'date' }
          }
        }
      }
    });
    console.log('✅ Created users collection with schema validation');

    // Create index on email
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    console.log('✅ Created unique index on email field');

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);
    const result = await db.collection('users').insertOne({
      name: 'Admin User',
      email: 'admin@prismstock.com',
      password: hashedPassword,
      role: 'admin',
      isActive: true,
      profile: {},
      permissions: [
        'users.create', 'users.read', 'users.update', 'users.delete',
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

    console.log('✅ Created admin user');
    console.log('Email: admin@prismstock.com');
    console.log('Password: admin123');

    // Create additional seeded users
    const seededUsers = [
      {
        name: 'Manager User',
        email: 'manager@prismstock.com',
        password: await bcrypt.hash('manager123', 12),
        role: 'manager',
        permissions: [
          'brands.read', 'brands.update',
          'categories.read', 'categories.update',
          'customers.create', 'customers.read', 'customers.update',
          'invoices.create', 'invoices.read', 'invoices.update',
          'sales.create', 'sales.read', 'sales.update',
          'stock.read', 'stock.update',
          'warranty.read', 'warranty.update',
          'meetups.read', 'meetups.update'
        ]
      },
      {
        name: 'Sales User',
        email: 'sales@prismstock.com',
        password: await bcrypt.hash('sales123', 12),
        role: 'sales',
        permissions: [
          'customers.create', 'customers.read', 'customers.update',
          'invoices.create', 'invoices.read',
          'sales.create', 'sales.read',
          'stock.read',
          'warranty.read'
        ]
      },
      {
        name: 'Viewer User',
        email: 'viewer@prismstock.com',
        password: await bcrypt.hash('viewer123', 12),
        role: 'viewer',
        permissions: [
          'brands.read',
          'categories.read',
          'customers.read',
          'invoices.read',
          'sales.read',
          'stock.read',
          'warranty.read',
          'meetups.read'
        ]
      }
    ];

    for (const userData of seededUsers) {
      await db.collection('users').insertOne({
        ...userData,
        isActive: true,
        profile: {},
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`✅ Created ${userData.role} user: ${userData.email}`);
    }

    console.log('\n🎉 Database initialization complete!');
    console.log('\nLogin credentials:');
    console.log('Admin: admin@prismstock.com / admin123');
    console.log('Manager: manager@prismstock.com / manager123');
    console.log('Sales: sales@prismstock.com / sales123');
    console.log('Viewer: viewer@prismstock.com / viewer123');

  } catch (error) {
    console.error('❌ Error initializing database:', error);
  } finally {
    await client.close();
    process.exit(0);
  }
}

initDatabase();
