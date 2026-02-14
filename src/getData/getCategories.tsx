'use server';
import { fastGetCategories } from '@/app/libs/fastData';
import { connectToMongoDB } from '@/app/libs/connectToMongoDB';

export async function getCategories(clientId?: string) {
  try {
    const result = await fastGetCategories(clientId);
    return result.success ? result.data : [];
  } catch (err: any) {
    // If an error occurs, return empty array instead of error message
    console.error('Error fetching categories:', err.message);
    return [];
  }
}

export async function getCategory(id: string) {
  try {
    const db = await connectToMongoDB();
    if (!db) {
      throw new Error('Failed to connect to database');
    }

    const category = await db.collection('categories').findOne({ id });
    if (category) {
      const serializedDocument: Record<string, any> = {};
      for (const key in category) {
        if (key === '_id') {
          serializedDocument['id'] = category[key].toString();
        } else {
          serializedDocument[key] = category[key];
        }
      }
      return serializedDocument;
    } else {
      return null;
    }
  } catch (err: any) {
    console.error('Error fetching category:', err.message);
    return null;
  }
}
