'use server';
import { executeOperation } from '@/app/libs/executeOperation';
import { getClientId } from '@/utils/auth';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // 🔐 AUTHENTICATION: Get clientId from authenticated user
    const clientId = await getClientId(req);
    if (!clientId) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    const products = await executeOperation('products', 'find', { clientId });
    return Response.json(products);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, res: any) {
  try {
    // 🔐 AUTHENTICATION: Get clientId from authenticated user
    const clientId = await getClientId(req);
    if (!clientId) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    const productData = await req.json();

    // Populate productCategories with full category data (filtered by clientId)
    if (productData.productCategories && Array.isArray(productData.productCategories)) {
      const categories = await executeOperation('categories', 'find', { clientId }) as any[];
      productData.productCategories = productData.productCategories
        .map((id: string) => categories.find((cat: any) => cat._id === id || cat.id === id))
        .filter(Boolean);
    }

    const newProduct = await executeOperation('products', 'insertOne', {
      ...productData,
      clientId, // Add clientId for multi-tenancy
      createdAt: new Date(),
      isActive: true,
    });

    return Response.json({
      success: true,
      message: 'Product added successfully',
      product: newProduct,
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
    // 🔐 AUTHENTICATION: Get clientId from authenticated user
    const clientId = await getClientId(req);
    if (!clientId) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id, data } = await req.json();
    if (!id || !data) {
      return Response.json({ error: 'Missing id or data' }, { status: 400 });
    }

    // Populate productCategories with full category data (filtered by clientId)
    if (data.productCategories && Array.isArray(data.productCategories)) {
      const categories = await executeOperation('categories', 'find', { clientId }) as any[];
      data.productCategories = data.productCategories
        .map((catId: string) => categories.find((cat: any) => cat._id === catId || cat.id === catId))
        .filter(Boolean);
    }

    await executeOperation('products', 'updateOne', {
      id,
      data,
      clientId, // Ensure update is scoped to client's products
    });
    return Response.json({
      success: true,
      message: 'Product updated successfully',
    });
  } catch (err: any) {
    return Response.json({ success: false, error: err.message });
  }
}

export async function DELETE(req: NextRequest, res: any) {
  try {
    // 🔐 AUTHENTICATION: Get clientId from authenticated user
    const clientId = await getClientId(req);
    if (!clientId) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await req.json();
    if (!id) {
      return Response.json({ error: 'Missing product id' }, { status: 400 });
    }
    const { ObjectId } = await import('mongodb');
    const objectId = new ObjectId(id);
    await executeOperation('products', 'deleteOne', { 
      _id: objectId,
      clientId // Ensure deletion is scoped to client's products
    });
    return Response.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (err: any) {
    return Response.json({ success: false, error: err.message });
  }
}
