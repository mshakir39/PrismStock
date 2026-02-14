import bcrypt from 'bcryptjs';
import { connectToMongoDB } from '@/app/libs/connectToMongoDB';
import { IUser, UserRole, LoginCredentials, AuthResponse, CreateUserData } from '@/interfaces/user';
import { ObjectId } from 'mongodb';

export class UserService {
  private static readonly SALT_ROUNDS = 12;

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static async createUser(userData: CreateUserData): Promise<AuthResponse> {
    try {
      const db = await connectToMongoDB();
      if (!db) {
        return { success: false, error: 'Database connection failed' };
      }

      const usersCollection = db.collection('users');

      // Check if user already exists
      const existingUser = await usersCollection.findOne({ email: userData.email.toLowerCase() });
      if (existingUser) {
        return { success: false, error: 'User with this email already exists' };
      }

      // Hash password
      const hashedPassword = await this.hashPassword(userData.password);

      // Create user object
      const newUser: Omit<IUser, '_id'> = {
        name: userData.name,
        email: userData.email.toLowerCase(),
        password: hashedPassword,
        role: userData.role,
        clientId: userData.clientId || null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        profile: userData.profile || {},
        permissions: this.getRolePermissions(userData.role)
      };

      // Insert user
      const result = await usersCollection.insertOne(newUser);

      // Return user without password
      const { password, ...userWithoutPassword } = newUser;
      const userResponse = { ...userWithoutPassword, _id: result.insertedId.toString() } as Omit<IUser, 'password'>;

      return { success: true, user: userResponse };
    } catch (error) {
      console.error('Error creating user:', error);
      return { success: false, error: 'Failed to create user' };
    }
  }

  static async authenticateUser(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const db = await connectToMongoDB();
      if (!db) {
        return { success: false, error: 'Database connection failed' };
      }

      const usersCollection = db.collection('users');

      // Find user by email
      const user = await usersCollection.findOne({ 
        email: credentials.email.toLowerCase(),
        isActive: true 
      });

      if (!user) {
        return { success: false, error: 'Invalid email or password' };
      }

      // Compare password
      const isPasswordValid = await this.comparePassword(credentials.password, user.password);
      if (!isPasswordValid) {
        return { success: false, error: 'Invalid email or password' };
      }

      // Update last login
      await usersCollection.updateOne(
        { _id: user._id },
        { $set: { lastLogin: new Date(), updatedAt: new Date() } }
      );

      // Return user without password
      const { password, ...userWithoutPassword } = user;
      const userResponse = {
        ...userWithoutPassword,
        _id: user._id.toString()
      } as Omit<IUser, 'password'>;

      return { success: true, user: userResponse };
    } catch (error) {
      console.error('Error authenticating user:', error);
      return { success: false, error: 'Authentication failed' };
    }
  }

  static async getUserById(userId: string): Promise<AuthResponse> {
    try {
      const db = await connectToMongoDB();
      if (!db) {
        return { success: false, error: 'Database connection failed' };
      }

      const usersCollection = db.collection('users');

      const user = await usersCollection.findOne({ 
        _id: new ObjectId(userId),
        isActive: true 
      });

      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // Return user without password
      const { password, ...userWithoutPassword } = user;
      const userResponse = {
        ...userWithoutPassword,
        _id: user._id.toString()
      } as Omit<IUser, 'password'>;

      return { success: true, user: userResponse };
    } catch (error) {
      console.error('Error getting user:', error);
      return { success: false, error: 'Failed to get user' };
    }
  }

  static async getAllUsers(): Promise<AuthResponse & { users?: Omit<IUser, 'password'>[] }> {
    try {
      const db = await connectToMongoDB();
      if (!db) {
        return { success: false, error: 'Database connection failed' };
      }

      const usersCollection = db.collection('users');

      const users = await usersCollection
        .find({})
        .project({ password: 0 }) // Exclude password field
        .toArray();

      const usersResponse = users.map(user => ({
        ...user,
        _id: user._id.toString()
      })) as Omit<IUser, 'password'>[];

      return { success: true, users: usersResponse };
    } catch (error) {
      console.error('Error getting users:', error);
      return { success: false, error: 'Failed to get users' };
    }
  }

  static async getUsersByClientId(clientId: string): Promise<AuthResponse & { users?: Omit<IUser, 'password'>[] }> {
    try {
      const db = await connectToMongoDB();
      if (!db) {
        return { success: false, error: 'Database connection failed' };
      }

      const usersCollection = db.collection('users');

      const users = await usersCollection
        .find({ clientId })
        .sort({ createdAt: -1 })
        .toArray();

      // Remove passwords from response
      const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return {
          ...userWithoutPassword,
          _id: user._id.toString()
        } as Omit<IUser, 'password'>;
      });

      return { success: true, users: usersWithoutPasswords };
    } catch (error) {
      console.error('Get users by client ID error:', error);
      return { success: false, error: 'Failed to fetch client users' };
    }
  }

  static getRolePermissions(role: UserRole): string[] {
    const permissions = {
      [UserRole.SUPER_ADMIN]: [
        'users.create', 'users.read', 'users.update', 'users.delete',
        'brands.create', 'brands.read', 'brands.update', 'brands.delete',
        'categories.create', 'categories.read', 'categories.update', 'categories.delete',
        'customers.create', 'customers.read', 'customers.update', 'customers.delete',
        'invoices.create', 'invoices.read', 'invoices.update', 'invoices.delete',
        'sales.create', 'sales.read', 'sales.update', 'sales.delete',
        'stock.create', 'stock.read', 'stock.update', 'stock.delete',
        'warranty.create', 'warranty.read', 'warranty.update', 'warranty.delete',
        'meetups.create', 'meetups.read', 'meetups.update', 'meetups.delete',
        'system.admin'
      ],
      [UserRole.ADMIN]: [
        'users.create', 'users.read', 'users.update', 'users.delete',
        'brands.create', 'brands.read', 'brands.update', 'brands.delete',
        'categories.create', 'categories.read', 'categories.update', 'categories.delete',
        'customers.create', 'customers.read', 'customers.update', 'customers.delete',
        'invoices.create', 'invoices.read', 'invoices.update', 'invoices.delete',
        'sales.create', 'sales.read', 'sales.update', 'sales.delete',
        'stock.create', 'stock.read', 'stock.update', 'stock.delete',
        'warranty.create', 'warranty.read', 'warranty.update', 'warranty.delete',
        'meetups.create', 'meetups.read', 'meetups.update', 'meetups.delete'
      ],
      [UserRole.MANAGER]: [
        'brands.read', 'brands.update',
        'categories.read', 'categories.update',
        'customers.create', 'customers.read', 'customers.update',
        'invoices.create', 'invoices.read', 'invoices.update',
        'sales.create', 'sales.read', 'sales.update',
        'stock.read', 'stock.update',
        'warranty.read', 'warranty.update',
        'meetups.read', 'meetups.update'
      ],
      [UserRole.SALES]: [
        'customers.create', 'customers.read', 'customers.update',
        'invoices.create', 'invoices.read',
        'sales.create', 'sales.read',
        'stock.read',
        'warranty.read'
      ],
      [UserRole.VIEWER]: [
        'brands.read',
        'categories.read',
        'customers.read',
        'invoices.read',
        'sales.read',
        'stock.read',
        'warranty.read',
        'meetups.read'
      ]
    };

    return permissions[role] || [];
  }

  static hasPermission(userRole: UserRole, permission: string): boolean {
    const permissions = this.getRolePermissions(userRole);
    return permissions.includes(permission);
  }
}
