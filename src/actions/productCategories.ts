'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { executeOperation } from '@/app/libs/executeOperation';

interface Category {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  parentCategory?: string;
  isActive: boolean;
}

export async function fetchCategoriesAction(selectedClientId?: string) {
  try {
    // Get authenticated user
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    console.log("selectedClientId from cookie in productCategories");

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

    // Query categories based on client access
    let categories;
    if (clientId) {
      // Filter by specific client
      console.log('Query: Filtering categories by clientId:', clientId);
      categories = await executeOperation('categories', 'find', { clientId });
    } else {
      // No client access
      console.log('Query: No client access, returning empty array');
      categories = [];
    }

    return {
      success: true,
      data: categories || []
    };
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch categories'
    };
  }
}

// Server action to create category
export async function createCategoryAction(formData: {
  name: string;
  description?: string;
  parentCategory?: string;
  isActive: boolean;
}) {
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
      return { success: false, error: 'Category name is required' };
    }

    if (formData.name.trim().length < 2) {
      return { success: false, error: 'Category name must be at least 2 characters' };
    }

    if (formData.name.trim().length > 50) {
      return { success: false, error: 'Category name must be less than 50 characters' };
    }

    // Check if category already exists
    const existingCategory = await executeOperation('categories', 'findOne', {
      name: formData.name.trim(),
      parentCategory: formData.parentCategory || null,
      clientId,
    });

    if (existingCategory) {
      return { success: false, error: 'Category already exists with this name and parent' };
    }

    // Create new category
    const newCategory = await executeOperation('categories', 'insertOne', {
      name: formData.name.trim(),
      description: formData.description?.trim() || '',
      parentCategory: formData.parentCategory || null,
      isActive: formData.isActive,
      clientId,
      createdAt: new Date(),
    });

    // If this category has a parent, add it to the parent's subCategories array
    if (formData.parentCategory && newCategory && (newCategory as any).insertedId) {
      const { ObjectId } = await import('mongodb');
      const parentObjectId = new ObjectId(formData.parentCategory);
      const newCategoryId = (newCategory as any).insertedId.toString();

      const subcategoryData = {
        id: newCategoryId,
        name: formData.name.trim(),
        description: formData.description?.trim() || '',
        isActive: formData.isActive,
        createdAt: new Date()
      };

      await executeOperation('categories', 'updateOne', {
        id: parentObjectId,
        data: {
          $addToSet: { subCategories: subcategoryData }
        }
      });
    }

    revalidatePath('/dashboard/categories');

    // Convert the result to a plain object with string ID
    const categoryResult = {
      ...(newCategory as any),
      _id: (newCategory as any)._id?.toString() || (newCategory as any).insertedId?.toString()
    };

    return {
      success: true,
      message: `Category ${formData.name} added successfully`,
      category: categoryResult,
    };
  } catch (error: any) {
    console.error('Error creating category:', error);
    return {
      success: false,
      error: error.message || 'Failed to create category',
    };
  }
}

// Server action to update category
export async function updateCategoryAction(
  categoryId: string,
  formData: {
    name: string;
    description?: string;
    parentCategory?: string;
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

    let decoded;
    try {
      decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    } catch {
      return { success: false, error: 'Invalid authentication token' };
    }

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

    if (!categoryId) {
      return { success: false, error: 'Category ID is required' };
    }

    if (!formData.name?.trim()) {
      return { success: false, error: 'Category name is required' };
    }

    // Get the current category to check permissions
    const { ObjectId } = await import('mongodb');
    const currentCategory = await executeOperation('categories', 'findOne', {
      _id: new ObjectId(categoryId),
      clientId
    });

    if (!currentCategory) {
      return { success: false, error: 'Category not found or access denied' };
    }

    // If parentCategory is changing, update subCategories arrays
    if (formData.parentCategory !== (currentCategory as any).parentCategory) {
      // Remove from old parent's subCategories
      if ((currentCategory as any).parentCategory) {
        const oldParentObjectId = new ObjectId((currentCategory as any).parentCategory);
        await executeOperation('categories', 'updateOne', {
          id: oldParentObjectId,
          data: {
            $pull: { subCategories: { id: categoryId } }
          }
        });
      }

      // Add to new parent's subCategories with full data
      if (formData.parentCategory) {
        const newParentObjectId = new ObjectId(formData.parentCategory);
        const subcategoryData = {
          id: categoryId,
          name: formData.name.trim(),
          description: formData.description?.trim() || '',
          isActive: formData.isActive,
          createdAt: (currentCategory as any).createdAt || new Date()
        };

        await executeOperation('categories', 'updateOne', {
          id: newParentObjectId,
          data: {
            $addToSet: { subCategories: subcategoryData }
          }
        });
      }
    }

    // Update the category
    await executeOperation('categories', 'updateOne', {
      id: new ObjectId(categoryId),
      data: {
        name: formData.name.trim(),
        description: formData.description?.trim() || '',
        parentCategory: formData.parentCategory || null,
        isActive: formData.isActive,
      },
    });

    revalidatePath('/dashboard/categories');

    return {
      success: true,
      message: 'Category updated successfully',
    };
  } catch (error: any) {
    console.error('Error updating category:', error);
    return {
      success: false,
      error: error.message || 'Failed to update category',
    };
  }
}

// Server action to delete category
export async function deleteCategoryAction(categoryId: string) {
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

    if (!categoryId) {
      return { success: false, error: 'Category ID is required' };
    }

    // Get the category to find its parent
    const { ObjectId } = await import('mongodb');
    const categoryToDelete = await executeOperation('categories', 'findOne', {
      _id: new ObjectId(categoryId),
      clientId
    }) as Record<string, any> | null;

    if (!categoryToDelete) {
      return { success: false, error: 'Category not found or access denied' };
    }

    // Check if category has children
    const children = await executeOperation('categories', 'find', {
      parentCategory: categoryId,
      clientId
    });
    const childrenCount = Array.isArray(children) ? children.length : 0;

    if (childrenCount > 0) {
      return { success: false, error: 'Cannot delete parent categories with sub categories' };
    }

    // If this category has a parent, remove it from the parent's subCategories array
    if (categoryToDelete.parentCategory) {
      const parentObjectId = new ObjectId(categoryToDelete.parentCategory);
      await executeOperation('categories', 'updateOne', {
        id: parentObjectId,
        data: {
          $pull: { subCategories: { id: categoryId } }
        }
      });
    }

    // Also remove this category from any other category's subCategories array
    await executeOperation('categories', 'updateMany', {
      filter: { subCategories: { $elemMatch: { id: categoryId } } },
      data: { $pull: { subCategories: { id: categoryId } } }
    });

    // Finally, delete the category
    await executeOperation('categories', 'deleteOne', { _id: new ObjectId(categoryId) });

    revalidatePath('/dashboard/categories');

    return {
      success: true,
      message: 'Category deleted successfully',
    };
  } catch (error: any) {
    console.error('Error deleting category:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete category',
    };
  }
}
