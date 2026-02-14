'use server';
import { fastGetSales } from '@/app/libs/fastData';

export async function getSales() {
  try {
    const result = await fastGetSales();
    return result.success ? result.data : [];
  } catch (error) {
    console.error('Error fetching sales:', error);
    return [];
  }
}
