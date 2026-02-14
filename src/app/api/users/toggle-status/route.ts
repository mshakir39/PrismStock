import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/libs/auth';
import { executeOperation } from '@/app/libs/executeOperation';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated and is super admin
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the user is a super admin
    const currentUser = await executeOperation('users', 'findOne', {
      document: { _id: new ObjectId(session.user.id) }
    });

    if (!currentUser || currentUser.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Super admin access required' }, { status: 403 });
    }

    const { userId, adminId } = await request.json();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    // Get current user status
    const user = await executeOperation('users', 'findOne', {
      document: { _id: new ObjectId(userId) }
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Toggle the user's active status
    const newStatus = !user.isActive;

    // Update user status
    const updateResult = await executeOperation('users', 'updateOne', {
      document: {
        documentId: userId,
        isActive: newStatus,
        statusChangedBy: adminId,
        statusChangedAt: new Date(),
      }
    });

    if (!updateResult) {
      return NextResponse.json({ success: false, error: 'Failed to update user status' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `User ${newStatus ? 'unblocked' : 'blocked'} successfully`,
      newStatus: newStatus,
      userEmail: user.email
    });

  } catch (error) {
    console.error('User status toggle error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
