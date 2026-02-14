'use server';

import { revalidatePath } from 'next/cache';
import { executeOperation } from '@/app/libs/executeOperation';
import { cookies } from 'next/headers';
import { getEffectiveClientIdForServerAction } from '@/utils/auth';

interface Product {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  category?: any; // Main category object
  breadcrumb?: Array<{ id: string; name: string; slug: string }>; // Category breadcrumb path
  categoryInfo?: {
    parentCategory?: any; // Parent category object
    subCategory?: any; // Sub category object
    productCategories?: any[]; // Array of category objects
  };
  price?: number;
  cost?: number;
  stock?: number;
  minStock?: number;
  maxStock?: number;
  unit?: string;
  specifications?: Record<string, any>;
  isActive: boolean;
  images?: string[];
  clientId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Server action to fetch products
export async function fetchProductsAction(selectedClientId?: string) {
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

    // Use the passed selectedClientId first (from client context), then fallback to cookie
    if (selectedClientId) {
      clientId = selectedClientId;
    } else {
      // Fallback to cookie for all users
      const selectedClientCookie = cookieStore.get('selectedClient')?.value;
      clientId = selectedClientCookie || user.clientId || null;
    }

    // Query products based on client access
    let products;
    if (clientId) {
      // Filter by specific client
      console.log('Query: Filtering products by clientId:', clientId);
      products = await executeOperation('products', 'find', { clientId });
    } else {
      // No client access
      console.log('Query: No client access, returning empty array');
      products = [];
    }

    console.log('Raw products from database:', products);
    console.log('First product breadcrumb:', products && Array.isArray(products) && products.length > 0 ? products[0]?.breadcrumb : 'No products');

    return {
      success: true,
      data: products || []
    };
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch products'
    };
  }
}

// Server action to create product
export async function createProductAction(formData: {
  name: string;
  description?: string;
  category?: any; // Main category object
  categoryInfo?: {
    parentCategory?: any; // Parent category object
    subCategory?: any; // Sub category object
    productCategories?: any[]; // Array of category objects
  };
  price?: number;
  cost?: number;
  stock?: number;
  minStock?: number;
  maxStock?: number;
  unit?: string;
  specifications?: Record<string, any>;
  isActive: boolean;
}) {
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
      // Super admin: use selected client if provided
      const selectedClientCookie = cookieStore.get('selectedClient')?.value;
      clientId = selectedClientCookie || null;
      if (!clientId) {
        return { success: false, error: 'Please select a client' };
      }
    } else {
      // Regular user: use their assigned client
      clientId = user.clientId;
      if (!clientId) {
        return { success: false, error: 'No client access' };
      }
    }

    if (!formData.name?.trim()) {
      return { success: false, error: 'Product name is required' };
    }

    if (formData.price && formData.price < 0) {
      return { success: false, error: 'Price cannot be negative' };
    }

    if (formData.cost && formData.cost < 0) {
      return { success: false, error: 'Cost cannot be negative' };
    }

    if (formData.stock && formData.stock < 0) {
      return { success: false, error: 'Stock cannot be negative' };
    }

    // Check if product name already exists
    const existingProduct = await executeOperation('products', 'findOne', {
      name: formData.name.trim(),
      clientId
    });

    if (existingProduct) {
      return { success: false, error: 'Product name already exists' };
    }

    // Create new product
    const newProduct = await executeOperation('products', 'insertOne', {
      name: formData.name.trim(),
      description: formData.description?.trim() || '',
      category: formData.category || null,
      categoryInfo: formData.categoryInfo,
      price: formData.price || 0,
      cost: formData.cost || 0,
      stock: formData.stock || 0,
      minStock: formData.minStock || 0,
      maxStock: formData.maxStock || 0,
      unit: formData.unit || 'pcs',
      specifications: formData.specifications || {},
      isActive: formData.isActive,
      clientId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log('Data being saved to MongoDB:', {
      name: formData.name.trim(),
      description: formData.description?.trim() || '',
      category: formData.category,
      categoryInfo: formData.categoryInfo,
      price: formData.price || 0,
      cost: formData.cost || 0,
      stock: formData.stock || 0,
      minStock: formData.minStock || 0,
      maxStock: formData.maxStock || 0,
      unit: formData.unit || 'pcs',
      specifications: formData.specifications || {},
      isActive: formData.isActive,
      clientId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log('MongoDB result:', newProduct);

    revalidatePath('/dashboard/products');

    // Convert the result to a plain object with string ID
    const productResult = {
      _id: (newProduct as any)._id?.toString() || (newProduct as any).insertedId?.toString(),
      name: formData.name.trim(),
      description: formData.description?.trim() || '',
      category: formData.category,
      categoryInfo: formData.categoryInfo,
      price: formData.price || 0,
      cost: formData.cost || 0,
      stock: formData.stock || 0,
      minStock: formData.minStock || 0,
      maxStock: formData.maxStock || 0,
      unit: formData.unit || 'pcs',
      specifications: formData.specifications || {},
      isActive: formData.isActive,
      clientId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return {
      success: true,
      message: `Product ${formData.name} added successfully`,
      product: productResult,
    };
  } catch (error: any) {
    console.error('Error creating product:', error);
    return {
      success: false,
      error: error.message || 'Failed to create product',
    };
  }
}

// Server action to update product
export async function updateProductAction(
  productId: string,
  formData: {
    name: string;
    description?: string;
    category?: any;
    price?: number;
    cost?: number;
    stock?: number;
    minStock?: number;
    maxStock?: number;
    unit?: string;
    specifications?: Record<string, any>;
    isActive: boolean;
  }
) {
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
      // Super admin: use selected client if provided
      const selectedClientCookie = cookieStore.get('selectedClient')?.value;
      clientId = selectedClientCookie || null;
      if (!clientId) {
        return { success: false, error: 'Please select a client' };
      }
    } else {
      // Regular user: use their assigned client
      clientId = user.clientId;
      if (!clientId) {
        return { success: false, error: 'No client access' };
      }
    }

    if (!productId) {
      return { success: false, error: 'Product ID is required' };
    }

    if (!formData.name?.trim()) {
      return { success: false, error: 'Product name is required' };
    }

    // Get the current product to check permissions
    const { ObjectId } = await import('mongodb');
    const currentProduct = await executeOperation('products', 'findOne', {
      _id: new ObjectId(productId),
      clientId
    });

    if (!currentProduct) {
      return { success: false, error: 'Product not found or access denied' };
    }

    // Update the product
    await executeOperation('products', 'updateOne', {
      _id: new ObjectId(productId),
      update: {
        $set: {
          name: formData.name.trim(),
          description: formData.description?.trim() || '',
          category: formData.category || null,
          price: formData.price || 0,
          cost: formData.cost || 0,
          stock: formData.stock || 0,
          minStock: formData.minStock || 0,
          maxStock: formData.maxStock || 0,
          unit: formData.unit || 'pcs',
          specifications: formData.specifications || {},
          isActive: formData.isActive,
          updatedAt: new Date(),
        },
      },
    });

    revalidatePath('/dashboard/products');

    return {
      success: true,
      message: 'Product updated successfully',
    };
  } catch (error: any) {
    console.error('Error updating product:', error);
    return {
      success: false,
      error: error.message || 'Failed to update product',
    };
  }
}

// Server action to delete product
export async function deleteProductAction(productId: string) {
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
      // Super admin: use selected client if provided
      const selectedClientCookie = cookieStore.get('selectedClient')?.value;
      clientId = selectedClientCookie || null;
      if (!clientId) {
        return { success: false, error: 'Please select a client' };
      }
    } else {
      // Regular user: use their assigned client
      clientId = user.clientId;
      if (!clientId) {
        return { success: false, error: 'No client access' };
      }
    }

    if (!productId) {
      return { success: false, error: 'Product ID is required' };
    }

    // Check if product exists and belongs to client
    const { ObjectId } = await import('mongodb');
    const productToDelete = await executeOperation('products', 'findOne', {
      _id: new ObjectId(productId),
      clientId
    });

    if (!productToDelete) {
      return { success: false, error: 'Product not found or access denied' };
    }

    // Delete the product
    await executeOperation('products', 'deleteOne', { _id: new ObjectId(productId) });

    revalidatePath('/dashboard/products');

    return {
      success: true,
      message: 'Product deleted successfully',
    };
  } catch (error: any) {
    console.error('Error deleting product:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete product',
    };
  }
}
