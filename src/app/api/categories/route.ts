'use server';
import { executeOperation } from '@/app/libs/executeOperation';
import { getEffectiveClientId, getClientId } from '@/utils/auth';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // 🔐 AUTHENTICATION: Get clientId from authenticated user
    const clientId = await getClientId(req);
    if (!clientId) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const includePath = searchParams.get('includePath');

    const categories = await executeOperation('categories', 'find', { clientId });
    
    if (includePath === 'true' && Array.isArray(categories)) {
      // Build hierarchical paths for each category
      const categoriesWithPath = categories.map((category: any) => {
        const path = buildCategoryPath(category, categories);
        return {
          ...category,
          path,
          level: path.length - 1
        };
      });
      return Response.json(categoriesWithPath);
    }
    
    return Response.json(categories);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

function buildCategoryPath(category: any, allCategories: any[]): string[] {
  const path: string[] = [category._id];
  let currentCategory = category;
  
  while (currentCategory.parentCategory) {
    const parent = allCategories.find((cat: any) => cat._id === currentCategory.parentCategory);
    if (!parent) break;
    path.unshift(parent._id);
    currentCategory = parent;
  }
  
  return path;
}

export async function POST(req: NextRequest, res: any) {
  try {
    const requestBody = await req.json();
    const { name, description, parentCategory, isActive = true, targetClientId } = requestBody;

    // 🔐 AUTHENTICATION: Get effective clientId (respects targetClientId for super admins)
    const clientId = await getEffectiveClientId(req, requestBody);
    if (!clientId) {
      return Response.json({ error: 'Authentication required or invalid target client' }, { status: 401 });
    }

    if (!name) {
      return Response.json({ error: 'Name is required' }, { status: 400 });
    }

    // Check if category already exists with same name and parent
    const existingCategory = await executeOperation('categories', 'findOne', {
      name,
      parentCategory,
      clientId, // Include clientId in uniqueness check
    });

    if (existingCategory) {
      return Response.json({ error: 'Category already exists with this name and parent' });
    }

    // Insert new category
    const newCategory = await executeOperation('categories', 'insertOne', {
      name,
      description,
      parentCategory,
      isActive,
      clientId, // Add clientId for multi-tenancy
      createdAt: new Date(),
    });

    // If this category has a parent, add it to the parent's subCategories array
    if (parentCategory && newCategory && (newCategory as any).insertedId) {
      const { ObjectId } = await import('mongodb');
      const parentObjectId = new ObjectId(parentCategory);
      const newCategoryId = (newCategory as any).insertedId.toString();

      // Create full subcategory data object
      const subcategoryData = {
        id: newCategoryId,
        name,
        description,
        isActive,
        createdAt: new Date()
      };

      await executeOperation('categories', 'updateOne', {
        id: parentObjectId,
        data: {
          $addToSet: { subCategories: subcategoryData }
        }
      });
    }

    return Response.json({
      success: true,
      message: `Category ${name} added successfully`,
      category: newCategory,
    });
  } catch (err: any) {
    return Response.json({
      success: false,
      error: err.message,
    });
  }
}

export async function PATCH(req: NextRequest, res: any) {
  try {
    const requestBody = await req.json();
    const { id, data, targetClientId } = requestBody;

    // 🔐 AUTHENTICATION: Get effective clientId (respects targetClientId for super admins)
    const clientId = await getEffectiveClientId(req, requestBody);
    if (!clientId) {
      return Response.json({ error: 'Authentication required or invalid target client' }, { status: 401 });
    }

    if (!id || !data) {
      return Response.json({ error: 'Missing id or data' }, { status: 400 });
    }

    // Get the current category to check if parent is changing
    const { ObjectId } = await import('mongodb');
    const currentCategory = await executeOperation('categories', 'findOne', {
      _id: new ObjectId(id),
      clientId // Ensure category belongs to the effective client
    });

    if (!currentCategory) {
      return Response.json({ error: 'Category not found or access denied' }, { status: 404 });
    }

    // If parentCategory is changing, update subCategories arrays
    if (data.parentCategory !== undefined && data.parentCategory !== (currentCategory as any).parentCategory) {
      // Remove from old parent's subCategories
      if ((currentCategory as any).parentCategory) {
        const oldParentObjectId = new ObjectId((currentCategory as any).parentCategory);
        await executeOperation('categories', 'updateOne', {
          id: oldParentObjectId,
          data: {
            $pull: { subCategories: { id: id } }
          }
        });
      }

      // Add to new parent's subCategories with full data
      if (data.parentCategory) {
        const newParentObjectId = new ObjectId(data.parentCategory);
        const subcategoryData = {
          id: id,
          name: data.name || (currentCategory as any).name,
          description: data.description || (currentCategory as any).description,
          isActive: data.isActive !== undefined ? data.isActive : (currentCategory as any).isActive,
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
      id,
      data,
    });

    return Response.json({
      success: true,
      message: 'Category updated successfully',
    });
  } catch (err: any) {
    return Response.json({ success: false, error: err.message });
  }
}

export async function DELETE(req: NextRequest, res: any) {
  try {
    const requestBody = await req.json();
    const { id, targetClientId } = requestBody;

    // 🔐 AUTHENTICATION: Get effective clientId (respects targetClientId for super admins)
    const clientId = await getEffectiveClientId(req, requestBody);
    if (!clientId) {
      return Response.json({ error: 'Authentication required or invalid target client' }, { status: 401 });
    }

    console.log('DELETE request body:', requestBody);

    if (!id) {
      console.log('Missing category id in request');
      return Response.json({ error: 'Missing category id' }, { status: 400 });
    }

    console.log('Deleting category with ID:', id);

    // Convert string ID to ObjectId for MongoDB
    const { ObjectId } = await import('mongodb');
    const objectId = new ObjectId(id);

    // First, get the category to find its parent (include effective clientId filter)
    const categoryToDelete = await executeOperation('categories', 'findOne', {
      _id: objectId,
      clientId // Ensure category belongs to the effective client
    }) as Record<string, any> | null;

    if (!categoryToDelete) {
      return Response.json({ error: 'Category not found' }, { status: 404 });
    }

    // If this category has a parent, remove it from the parent's subCategories array
    if ((categoryToDelete as any).parentCategory) {
      const parentObjectId = new ObjectId(categoryToDelete.parentCategory);
      await executeOperation('categories', 'updateOne', {
        id: parentObjectId,
        data: {
          $pull: { subCategories: { id: id } }
        }
      });
    }

    // Also remove this category from any other category's subCategories array (in case of data inconsistency)
    await executeOperation('categories', 'updateMany', {
      filter: { subCategories: { $elemMatch: { id: id } } },
      data: { $pull: { subCategories: { id: id } } }
    });

    // Finally, delete the category
    await executeOperation('categories', 'deleteOne', { _id: objectId });

    return Response.json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (err: any) {
    console.error('Error in DELETE endpoint:', err);
    return Response.json({ success: false, error: err.message });
  }
}
