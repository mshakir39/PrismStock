import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/services/userService';
import { UserRole } from '@/interfaces/user';

export async function POST(request: NextRequest) {
  try {
    // Check if this is a development environment
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { success: false, error: 'This endpoint is only available in development' },
        { status: 403 }
      );
    }

    const initialUsers = [
      {
        name: 'Super Admin',
        email: 'admin@prismstock.com',
        password: 'admin123',
        role: UserRole.SUPER_ADMIN,
        profile: {
          phone: '+923349627745',
          address: 'General Bus Stand, near Badozai Market, Dera Ghazi Khan'
        }
      },
      {
        name: 'Store Manager',
        email: 'manager@prismstock.com',
        password: 'manager123',
        role: UserRole.MANAGER,
        profile: {
          phone: '+923215392445',
          address: 'General Bus Stand, near Badozai Market, Dera Ghazi Khan'
        }
      },
      {
        name: 'Sales Person',
        email: 'sales@prismstock.com',
        password: 'sales123',
        role: UserRole.SALES,
        profile: {
          phone: '+923000000000',
          address: 'General Bus Stand, near Badozai Market, Dera Ghazi Khan'
        }
      },
      {
        name: 'Viewer',
        email: 'viewer@prismstock.com',
        password: 'viewer123',
        role: UserRole.VIEWER,
        profile: {
          phone: '+923111111111',
          address: 'General Bus Stand, near Badozai Market, Dera Ghazi Khan'
        }
      }
    ];

    const results = [];

    for (const userData of initialUsers) {
      try {
        const result = await UserService.createUser(userData);
        results.push({
          email: userData.email,
          role: userData.role,
          success: result.success,
          error: result.error
        });
      } catch (error) {
        results.push({
          email: userData.email,
          role: userData.role,
          success: false,
          error: 'Unexpected error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Initial users seeded successfully',
      results
    });
  } catch (error) {
    console.error('Seed users error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
