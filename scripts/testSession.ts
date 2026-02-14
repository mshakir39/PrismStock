import { connectToMongoDB } from '../src/app/libs/connectToMongoDB';
import { ObjectId } from 'mongodb';

async function testSession() {
  console.log('🔐 Testing session API...');

  try {
    // First, let's manually create a token like the login would
    const superAdminUser = {
      _id: '698d89ffb2d08da140a52c6d',
      email: 'superadmin@prismstock.com',
      role: 'super_admin',
      isSuperAdmin: true,
      clientId: undefined
    };

    const token = Buffer.from(JSON.stringify({
      userId: superAdminUser._id,
      email: superAdminUser.email,
      role: superAdminUser.role,
      isSuperAdmin: superAdminUser.isSuperAdmin,
      clientId: superAdminUser.clientId,
      timestamp: Date.now()
    })).toString('base64');

    console.log('🔑 Generated token:', token);
    console.log('👤 Super Admin User:', superAdminUser);

    // Now let's decode it back to see what we get
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    console.log('🔓 Decoded token:', decoded);

    // Test the database query that getUserById would make
    const db = await connectToMongoDB();
    if (!db) {
      console.error('❌ Failed to connect to database');
      return;
    }

    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ 
      _id: new ObjectId(superAdminUser._id),
      isActive: true 
    });

    if (user) {
      console.log('✅ Found user in database:');
      console.log('   _id:', user._id);
      console.log('   name:', user.name);
      console.log('   email:', user.email);
      console.log('   role:', user.role);
      console.log('   isSuperAdmin:', user.isSuperAdmin);
      console.log('   clientId:', user.clientId);
      
      // This is what the API would return
      const { password, ...userWithoutPassword } = user;
      const userResponse = {
        ...userWithoutPassword,
        _id: user._id.toString()
      };
      
      console.log('📤 User response that would be sent to frontend:', userResponse);
    } else {
      console.log('❌ User not found in database');
    }

  } catch (error) {
    console.error('❌ Error testing session:', error);
  } finally {
    process.exit(0);
  }
}

// Run the test
testSession();
