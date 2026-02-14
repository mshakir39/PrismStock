import { UserService } from '../src/services/userService';

async function testLogin() {
  console.log('🔐 Testing super admin login...');

  try {
    // Test super admin login
    const authResult = await UserService.authenticateUser({
      email: 'superadmin@prismstock.com',
      password: 'admin123'
    });

    if (authResult.success) {
      console.log('✅ Super admin login successful!');
      console.log('👤 User:', authResult.user);
      console.log('🔑 Token would contain:');
      console.log('   - userId:', authResult.user!._id);
      console.log('   - email:', authResult.user!.email);
      console.log('   - role:', authResult.user!.role);
      console.log('   - isSuperAdmin:', authResult.user!.isSuperAdmin);
      console.log('   - clientId:', authResult.user!.clientId);
    } else {
      console.log('❌ Super admin login failed:', authResult.error);
    }

    console.log('\n🔐 Testing client admin login...');
    
    // Test client admin login
    const clientAuthResult = await UserService.authenticateUser({
      email: 'admin@techsolutions.com',
      password: 'client123'
    });

    if (clientAuthResult.success) {
      console.log('✅ Client admin login successful!');
      console.log('👤 User:', clientAuthResult.user);
      console.log('🔑 Token would contain:');
      console.log('   - userId:', clientAuthResult.user!._id);
      console.log('   - email:', clientAuthResult.user!.email);
      console.log('   - role:', clientAuthResult.user!.role);
      console.log('   - isSuperAdmin:', clientAuthResult.user!.isSuperAdmin);
      console.log('   - clientId:', clientAuthResult.user!.clientId);
    } else {
      console.log('❌ Client admin login failed:', clientAuthResult.error);
    }

  } catch (error) {
    console.error('❌ Error testing login:', error);
  } finally {
    process.exit(0);
  }
}

// Run the test
testLogin();
