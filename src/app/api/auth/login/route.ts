import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/services/userService';
import { LoginCredentials } from '@/interfaces/user';

export async function POST(request: NextRequest) {
  try {
    const body: LoginCredentials = await request.json();

    // Validate input
    if (!body.email || !body.password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Authenticate user
    console.log('🔍 Login attempt:', { email: body.email });
    const authResult = await UserService.authenticateUser(body);
    console.log('🔍 Auth result:', { success: authResult.success, error: authResult.error });

    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      );
    }

    // Create session token (simple JWT-like token for now)
    const token = Buffer.from(JSON.stringify({
      userId: authResult.user!._id,
      email: authResult.user!.email,
      role: authResult.user!.role,
      isSuperAdmin: authResult.user!.isSuperAdmin || false,
      clientId: authResult.user!.clientId,
      timestamp: Date.now()
    })).toString('base64');

    // Set HTTP-only cookie with token
    const response = NextResponse.json({
      success: true,
      user: authResult.user,
      token
    });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
