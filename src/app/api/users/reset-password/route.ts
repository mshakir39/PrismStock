import { NextRequest, NextResponse } from 'next/server';
import { executeOperation } from '@/app/libs/executeOperation';
import { ObjectId } from 'mongodb';
import { UserService } from '@/services/userService';
import { connectToMongoDB } from '@/app/libs/connectToMongoDB';
import bcrypt from 'bcryptjs';


export async function POST(request: NextRequest) {
  try {
    // Get token from cookie (custom auth system)
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'No authentication token found' },
        { status: 401 }
      );
    }

    // Decode token
    let decoded;
    try {
      decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Check if token is expired (24 hours)
    if (Date.now() - decoded.timestamp > 24 * 60 * 60 * 1000) {
      return NextResponse.json(
        { success: false, error: 'Token expired' },
        { status: 401 }
      );
    }

    // Get current user from database
    const userResult = await UserService.getUserById(decoded.userId);

    if (!userResult.success || !userResult.user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 401 }
      );
    }

    // Verify the user is a super admin
    if (userResult.user.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Super admin access required' }, { status: 403 });
    }

    const { userId, newPassword, adminId } = await request.json();

    if (!userId || !newPassword) {
      return NextResponse.json({ success: false, error: 'User ID and new password are required' }, { status: 400 });
    }

    // Check if user exists first
    const targetUserResult = await UserService.getUserById(userId);
    
    if (!targetUserResult.success || !targetUserResult.user) {
      return NextResponse.json({ success: false, error: 'User not found or inactive' }, { status: 404 });
    }
    
    const existingUser = targetUserResult.user;

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user with new password using direct MongoDB update
    const db = await connectToMongoDB();
    if (!db) {
      return NextResponse.json({ success: false, error: 'Database connection failed' }, { status: 500 });
    }

    const usersCollection = db.collection('users');
    const updateResult = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          password: hashedPassword,
          forcePasswordChange: true,
          passwordResetBy: adminId,
          passwordResetAt: new Date(),
        }
      }
    );

    if (updateResult.modifiedCount === 0) {
      return NextResponse.json({ success: false, error: 'Failed to update password' }, { status: 500 });
    }

    // Get user details for logging
    const userData = await executeOperation('users', 'findOne', {
      document: { _id: new ObjectId(userId) }
    });
    const user = userData as any; // Cast to access user properties

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully',
      userEmail: user?.email
    });

  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
