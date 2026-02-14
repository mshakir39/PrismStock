import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/services/userService';
import { CreateUserData, UserRole } from '@/interfaces/user';

export async function POST(request: NextRequest) {
  try {
    // Get token from cookie for authentication
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
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

    const body: CreateUserData = await request.json();

    // Validate input
    if (!body.name || !body.email || !body.password || !body.role) {
      return NextResponse.json(
        { success: false, error: 'Name, email, password, and role are required' },
        { status: 400 }
      );
    }

    // Validate role
    if (!Object.values(UserRole).includes(body.role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role specified' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (body.password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Get user to check permissions and client context
    const userResult = await UserService.getUserById(decoded.userId);

    if (!userResult.success) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 401 }
      );
    }

    // Check if user has permission to create users
    if (!UserService.hasPermission(userResult.user!.role, 'users.create')) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Add clientId to user data for non-super admins
    const userData = {
      ...body,
      clientId: userResult.user!.isSuperAdmin ? body.clientId : (userResult.user!.clientId || userResult.user!._id),
      isSuperAdmin: userResult.user!.isSuperAdmin ? body.isSuperAdmin : false
    };

    // Create user
    const result = await UserService.createUser(userData);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      user: result.user,
      message: 'User created successfully'
    });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get token from cookie for authentication
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
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

    // Get user to check permissions
    const userResult = await UserService.getUserById(decoded.userId);

    if (!userResult.success) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 401 }
      );
    }

    // Check if user has permission to view users
    if (!UserService.hasPermission(userResult.user!.role, 'users.read')) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get users based on user role and client context
    let usersResult;
    if (userResult.user!.isSuperAdmin) {
      // For super admin, check if there's a client context in the request
      const clientId = request.nextUrl.searchParams.get('clientId');

      if (clientId && clientId !== 'all') {
        // Filter by specific client
        usersResult = await UserService.getUsersByClientId(clientId);
      } else {
        // Show all users for super admin when no client is selected or 'all' is selected
        usersResult = await UserService.getAllUsers();
      }
    } else {
      // Client admin can only see users from their client
      usersResult = await UserService.getUsersByClientId(userResult.user!.clientId!);
    }

    if (!usersResult.success) {
      return NextResponse.json(
        { success: false, error: usersResult.error },
        { status: 500 }
      );
    }

    console.log('🔍 GET users API returning:', {
      success: true,
      userCount: usersResult.users?.length || 0,
      users: usersResult.users?.map(u => ({ id: u._id || u.id, name: u.name, email: u.email })) || []
    });

    return NextResponse.json({
      success: true,
      users: usersResult.users
    });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
