'use server';
import { executeOperation } from '@/app/libs/executeOperation';
import { ObjectId } from 'mongodb';

export async function POST(req: any, res: any) {
  const { storeName, id } = await req.json();
  try {
    if (id) {
      await executeOperation('storeDetail', 'upsert', {
        storeName: storeName,
        _id: new ObjectId(id),
      });
    } else {
      await executeOperation('storeDetail', 'upsert', {
        storeName: storeName,
      });
    }

    return Response.json({ message: 'Store Detail has been Update' });
  } catch (err: any) {
    // If an error occurs, return a JSON response with the error message
    return Response.json({ error: err.message });
  }
}
