'use server';
import { executeOperation } from '@/app/libs/executeOperation';

interface StoreDetail {
  storeName: string;
  address: string;
  phone: string;
  email?: string;
  taxRate: number;
  currency: string;
  logo?: string;
  businessHours?: string;
  notes?: string;
}

export async function getStoreDetail() {
  try {
    const storeDetail = await executeOperation('storeDetail', 'findAll');
    return {
      success: true,
      data: Array.isArray(storeDetail) ? storeDetail[0] : null,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createStoreDetail(data: StoreDetail) {
  try {
    const result = await executeOperation('storeDetail', 'insertOne', {
      ...data,
      createdAt: new Date(),
    });
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateStoreDetail(
  id: string,
  data: Partial<StoreDetail>
) {
  try {
    const result = await executeOperation('storeDetail', 'updateOne', {
      id,
      ...data,
      updatedAt: new Date(),
    });
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function upsertStoreDetail(data: StoreDetail) {
  try {
    const result = await executeOperation('storeDetail', 'upsert', {
      ...data,
      updatedAt: new Date(),
    });
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
