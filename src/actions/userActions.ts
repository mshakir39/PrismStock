'use server';

import { connectToMongoDB } from '@/app/libs/connectToMongoDB';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { IUser } from '@/interfaces/user';

// Server action to fetch users
export async function fetchUsersAction(selectedClientId?: string) {
  try {
    // Get authenticated user
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    // Decode token to get user info
    let decoded;
    try {
      decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    } catch {
      return { success: false, error: 'Invalid authentication token' };
    }

    // Get user from database to check if super admin
    const { UserService } = await import('@/services/userService');
    const userResult = await UserService.getUserById(decoded.userId);

    if (!userResult.success || !userResult.user) {
      return { success: false, error: 'User not found' };
    }

    const user = userResult.user;
    let clientId: string | null = null;

    if (user.isSuperAdmin) {
      // Super admin: must select a client to view users
      if (!selectedClientId) {
        return {
          success: true,
          data: [],
          message: 'Please select a client to view users'
        };
      }
      clientId = selectedClientId;
    } else {
      // Regular user: use their assigned client
      clientId = user.clientId;
    }

    // Query users based on access level
    const db = await connectToMongoDB();
    if (!db) {
      return { success: false, error: 'Database connection failed' };
    }

    const usersCollection = db.collection('users');
    let users: IUser[];

    // Single query for all cases
    if (clientId) {
      users = (await usersCollection.find({ 
        clientId,
        isSuperAdmin: { $ne: true }
      }).sort({ name: 1 }).toArray()) as unknown as IUser[];
    } else {
      users = [];
    }

    // Serialize users for client components
    users = users.map(user => ({
      ...user,
      _id: user._id?.toString(),
      createdAt: user.createdAt?.toISOString(),
      updatedAt: user.updatedAt?.toISOString(),
      lastLogin: user.lastLogin?.toISOString(),
    })) as IUser[];

    // Remove duplicates and sort by name
    if (Array.isArray(users)) {
      // Remove duplicates by _id
      const uniqueUsers = users.filter((user, index, arr) => 
        arr.findIndex(u => u._id?.toString() === user._id?.toString()) === index
      );

      // Sort by name
      uniqueUsers.sort((a: IUser, b: IUser) => {
        const nameA = a.name || '';
        const nameB = b.name || '';
        return nameA.localeCompare(nameB);
      });

      users = uniqueUsers;
    }

    return {
      success: true,
      data: users || []
    };
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch users'
    };
  }
}

// Server action to create user
export async function createUserAction(formData: {
  name: string;
  email: string;
  password: string;
  role: string;
  isActive: boolean;
}, selectedClientId?: string) {
  try {
    // Get authenticated user
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    let decoded;
    try {
      decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    } catch {
      return { success: false, error: 'Invalid authentication token' };
    }

    const { UserService } = await import('@/services/userService');
    const authUserResult = await UserService.getUserById(decoded.userId);

    if (!authUserResult.success || !authUserResult.user) {
      return { success: false, error: 'User not found' };
    }

    const authUser = authUserResult.user;
    let clientId: string | null = null;

    if (authUser.isSuperAdmin) {
      // Super admin: use selected client if provided
      clientId = selectedClientId || null;
      if (!clientId) {
        return { success: false, error: 'Please select a client' };
      }
    } else {
      // Regular user: use their assigned client
      clientId = authUser.clientId;
      if (!clientId) {
        return { success: false, error: 'No client access' };
      }
    }

    if (!formData.name?.trim()) {
      return { success: false, error: 'Name is required' };
    }

    if (!formData.email?.trim()) {
      return { success: false, error: 'Email is required' };
    }

    if (!formData.password?.trim()) {
      return { success: false, error: 'Password is required' };
    }

    if (formData.password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters' };
    }

    // Get database connection
    const db = await connectToMongoDB();
    if (!db) {
      return { success: false, error: 'Database connection failed' };
    }

    const usersCollection = db.collection('users');

    // Check if email already exists
    const existingUser = await usersCollection.findOne({
      email: formData.email.trim()
    });

    if (existingUser) {
      return { success: false, error: 'Email already exists' };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(formData.password, 12);

    // Create new user
    const result = await usersCollection.insertOne({
      name: formData.name.trim(),
      email: formData.email.trim(),
      password: hashedPassword,
      role: formData.role,
      isActive: formData.isActive,
      clientId: clientId,
      isSuperAdmin: formData.role === 'super_admin',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const newUser = { 
      _id: result.insertedId.toString(), 
      name: formData.name.trim(),
      email: formData.email.trim(),
      role: formData.role,
      isActive: formData.isActive,
      clientId: clientId,
      isSuperAdmin: formData.role === 'super_admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    revalidatePath('/dashboard/users');

    return {
      success: true,
      message: `User ${formData.name} created successfully`,
      user: newUser,
    };
  } catch (error: any) {
    console.error('Error creating user:', error);
    return {
      success: false,
      error: error.message || 'Failed to create user',
    };
  }
}

// Server action to update user
export async function updateUserAction(
  userId: string,
  formData: {
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    password?: string;
  }
) {
  try {
    // Get authenticated user
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    let decoded;
    try {
      decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    } catch {
      return { success: false, error: 'Invalid authentication token' };
    }

    const { UserService } = await import('@/services/userService');
    const authUserResult = await UserService.getUserById(decoded.userId);

    if (!authUserResult.success || !authUserResult.user) {
      return { success: false, error: 'User not found' };
    }

    const authUser = authUserResult.user;
    let clientId: string | null = null;

    if (authUser.isSuperAdmin) {
      // Super admin can update any user
      clientId = null; // Super admins can update users across all clients
    } else {
      // Regular user: can only update users in their client
      clientId = authUser.clientId;
    }

    // Get database connection
    const db = await connectToMongoDB();
    if (!db) {
      return { success: false, error: 'Database connection failed' };
    }

    const usersCollection = db.collection('users');

    if (!userId) {
      return { success: false, error: 'User ID is required' };
    }

    if (!formData.name?.trim()) {
      return { success: false, error: 'Name is required' };
    }

    if (!formData.email?.trim()) {
      return { success: false, error: 'Email is required' };
    }

    // Get the current user to check permissions
    const { ObjectId } = await import('mongodb');
    const currentUser = await usersCollection.findOne({
      _id: new ObjectId(userId)
    });

    if (!currentUser) {
      return { success: false, error: 'User not found' };
    }

    // Check permissions - regular users can only update users in their client
    if (!authUser.isSuperAdmin && currentUser.clientId !== authUser.clientId) {
      return { success: false, error: 'Permission denied' };
    }

    // Check if email already exists (excluding current user)
    if (formData.email !== currentUser.email) {
      const existingUser = await usersCollection.findOne({
        email: formData.email.trim(),
        _id: { $ne: new ObjectId(userId) }
      });

      if (existingUser) {
        return { success: false, error: 'Email already exists' };
      }
    }

    const updateData: any = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      role: formData.role,
      isActive: formData.isActive,
      isSuperAdmin: formData.role === 'super_admin',
      updatedAt: new Date(),
    };

    // Only update password if provided
    if (formData.password && formData.password.trim()) {
      if (formData.password.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters' };
      }
      updateData.password = await bcrypt.hash(formData.password, 12);
    }

    // Update the user
    await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: updateData }
    );

    revalidatePath('/dashboard/users');

    return {
      success: true,
      message: 'User updated successfully',
    };
  } catch (error: any) {
    console.error('Error updating user:', error);
    return {
      success: false,
      error: error.message || 'Failed to update user',
    };
  }
}

// Server action to delete user
export async function deleteUserAction(userId: string) {
  try {
    // Get authenticated user
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    let decoded;
    try {
      decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    } catch {
      return { success: false, error: 'Invalid authentication token' };
    }

    const { UserService } = await import('@/services/userService');
    const authUserResult = await UserService.getUserById(decoded.userId);

    if (!authUserResult.success || !authUserResult.user) {
      return { success: false, error: 'User not found' };
    }

    const authUser = authUserResult.user;

    // Get database connection
    const db = await connectToMongoDB();
    if (!db) {
      return { success: false, error: 'Database connection failed' };
    }

    const usersCollection = db.collection('users');

    if (!userId) {
      return { success: false, error: 'User ID is required' };
    }

    // Check if user exists
    const { ObjectId } = await import('mongodb');
    const userToDelete = await usersCollection.findOne({
      _id: new ObjectId(userId)
    });

    if (!userToDelete) {
      return { success: false, error: 'User not found' };
    }

    // Check permissions - regular users can only delete users in their client
    if (!authUser.isSuperAdmin && userToDelete.clientId !== authUser.clientId) {
      return { success: false, error: 'Permission denied' };
    }

    // Prevent deleting super admin users
    if (userToDelete.isSuperAdmin) {
      return { success: false, error: 'Cannot delete super admin users' };
    }

    // Delete the user
    await usersCollection.deleteOne({ _id: new ObjectId(userId) });

    revalidatePath('/dashboard/users');

    return {
      success: true,
      message: 'User deleted successfully',
    };
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete user',
    };
  }
}

// Server action to toggle user status
export async function toggleUserStatusAction(userId: string) {
  try {
    // Get authenticated user
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    let decoded;
    try {
      decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    } catch {
      return { success: false, error: 'Invalid authentication token' };
    }

    const { UserService } = await import('@/services/userService');
    const authUserResult = await UserService.getUserById(decoded.userId);

    if (!authUserResult.success || !authUserResult.user) {
      return { success: false, error: 'User not found' };
    }

    const authUser = authUserResult.user;

    // Get database connection
    const db = await connectToMongoDB();
    if (!db) {
      return { success: false, error: 'Database connection failed' };
    }

    const usersCollection = db.collection('users');

    if (!userId) {
      return { success: false, error: 'User ID is required' };
    }

    // Get current user
    const { ObjectId } = await import('mongodb');
    const currentUser = await usersCollection.findOne({
      _id: new ObjectId(userId)
    });

    if (!currentUser) {
      return { success: false, error: 'User not found' };
    }

    // Check permissions - regular users can only toggle status of users in their client
    if (!authUser.isSuperAdmin && currentUser.clientId !== authUser.clientId) {
      return { success: false, error: 'Permission denied' };
    }

    // Prevent deactivating super admin users
    if (currentUser.isSuperAdmin) {
      return { success: false, error: 'Cannot deactivate super admin users' };
    }

    const newStatus = !currentUser.isActive;

    // Update user status
    await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          isActive: newStatus,
          updatedAt: new Date(),
        }
      }
    );

    revalidatePath('/dashboard/users');

    return {
      success: true,
      message: `User ${newStatus ? 'activated' : 'deactivated'} successfully`,
    };
  } catch (error: any) {
    console.error('Error toggling user status:', error);
    return {
      success: false,
      error: error.message || 'Failed to toggle user status',
    };
  }
}

// Simple getUsers function for pages that need all users
export async function getUsers() {
  try {
    const db = await connectToMongoDB();
    if (!db) {
      throw new Error('Failed to connect to database');
    }
    const users = await db.collection('users').find({}).sort({ createdAt: -1 }).limit(1000).toArray();

    // Serialize users
    const serializedUsers = users.map((user: any) => ({
      ...user,
      _id: user._id?.toString(),
      id: user._id?.toString(),
      createdAt: user.createdAt?.toISOString(),
      updatedAt: user.updatedAt?.toISOString(),
    }));

    return { success: true, data: serializedUsers };
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return { success: false, error: error.message };
  }
}
