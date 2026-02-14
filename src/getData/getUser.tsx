'use server';
import { executeOperation } from '@/app/libs/executeOperation';

export const getUser = async () => {
  try {
    // Execute a find operation to retrieve data from the "categories" collection
    const user = await executeOperation('user', 'findOne');
    // Return the categories as a JSON response
    return user as any;
  } catch (err: any) {
    // If an error occurs, return a JSON response with the error message
    return [err.message];
  }
};
