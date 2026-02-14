import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { UserService } from '@/services/userService';

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  clientId?: string;
  isSuperAdmin?: boolean;
}

export async function getAuthenticatedUser(request: NextRequest): Promise<AuthUser | null> {
  try {
    // Get token from cookie
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return null;
    }

    // Decode token
    let decoded;
    try {
      decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    } catch {
      return null;
    }

    // Check if token is expired (24 hours)
    if (Date.now() - decoded.timestamp > 24 * 60 * 60 * 1000) {
      return null;
    }

    // Get user from database
    const userResult = await UserService.getUserById(decoded.userId);

    if (!userResult.success || !userResult.user) {
      return null;
    }

    return userResult.user as AuthUser;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

export async function getClientId(request: NextRequest): Promise<string | null> {
  const user = await getAuthenticatedUser(request);
  return user?.clientId || null;
}

export async function getAuthenticatedUserForServerAction(): Promise<AuthUser | null> {
  try {
    // Get token from cookie using next/headers
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return null;
    }

    // Decode token
    let decoded;
    try {
      decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    } catch {
      return null;
    }

    // Check if token is expired (24 hours)
    if (Date.now() - decoded.timestamp > 24 * 60 * 60 * 1000) {
      return null;
    }

    // Get user from database
    const userResult = await UserService.getUserById(decoded.userId);

    if (!userResult.success || !userResult.user) {
      return null;
    }

    return {
      _id: userResult.user._id.toString(),
      name: userResult.user.name,
      email: userResult.user.email,
      role: userResult.user.role,
      clientId: userResult.user.clientId,
      isSuperAdmin: userResult.user.isSuperAdmin,
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

export async function getEffectiveClientId(request?: NextRequest, requestBody?: any): Promise<string | null> {
  const user = request ? await getAuthenticatedUser(request) : await getAuthenticatedUserForServerAction();

  if (!user) {
    return null;
  }

  // Super admins can specify targetClientId in request body
  if (user.isSuperAdmin && requestBody?.targetClientId) {
    return requestBody.targetClientId;
  }

  // Regular users and super admins without targetClientId use their own clientId
  return user.clientId || null;
}

// Alias for server actions
export async function getEffectiveClientIdForServerAction(): Promise<string | null> {
  return getEffectiveClientId();
}
