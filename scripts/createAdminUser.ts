import { connectToMongoDB } from '../src/app/libs/connectToMongoDB';
import bcrypt from 'bcryptjs';
import { UserRole } from '../src/interfaces/user';

interface IUser {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  profile: Record<string, any>;
  permissions: string[];
}

async function createAdminUser() {
  try {
    // Connect to MongoDB
    const db = await connectToMongoDB();
    if (!db) {
      console.error('❌ Failed to connect to MongoDB');
      process.exit(1);
    }

    const usersCollection = db.collection<IUser>('users');

    // Admin user details
    const adminUser = {
      name: 'Admin User',
      email: 'admin@prismstock.com',
      password: await bcrypt.hash('admin123', 12), // Using bcrypt to hash the password
      role: UserRole.SUPER_ADMIN, // Using SUPER_ADMIN role which has all permissions
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      profile: {},
      permissions: [
        // Users
        'users.create', 'users.read', 'users.update', 'users.delete',
        // Brands
        'brands.create', 'brands.read', 'brands.update', 'brands.delete',
        // Categories
        'categories.create', 'categories.read', 'categories.update', 'categories.delete',
        // Customers
        'customers.create', 'customers.read', 'customers.update', 'customers.delete',
        // Invoices
        'invoices.create', 'invoices.read', 'invoices.update', 'invoices.delete',
        // Sales
        'sales.create', 'sales.read', 'sales.update', 'sales.delete',
        // Stock
        'stock.create', 'stock.read', 'stock.update', 'stock.delete',
        // Warranty
        'warranty.create', 'warranty.read', 'warranty.update', 'warranty.delete',
        // Meetups
        'meetups.create', 'meetups.read', 'meetups.update', 'meetups.delete',
        // System
        'system.admin'
      ]
    };

    // Check if admin user already exists
    const existingAdmin = await usersCollection.findOne({ email: adminUser.email });
    if (existingAdmin) {
      console.log('ℹ️ Admin user already exists');
      console.log('Email:', existingAdmin.email);
      process.exit(0);
    }

    // Insert admin user
    const result = await usersCollection.insertOne(adminUser);
    
    if (result.acknowledged) {
      console.log('✅ Admin user created successfully!');
      console.log('Email:', adminUser.email);
      console.log('Password: admin123');
      console.log('Please change the password after first login.');
    } else {
      console.error('❌ Failed to create admin user');
    }
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    process.exit(0);
  }
}

// Run the script
createAdminUser();
