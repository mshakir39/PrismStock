'use server';
import { executeOperation } from '@/app/libs/executeOperation';

export const getStoreDetail = async () => {
  try {
    // Execute a find operation to retrieve data from the "categories" collection
    const storeDetail = await executeOperation('storeDetail', 'findAll');
    // Return the categories as a JSON response
    return storeDetail as any;
  } catch (err: any) {
    // If an error occurs, return a JSON response with the error message
    return [err.message];
  }
};
