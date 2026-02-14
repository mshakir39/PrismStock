'use server';
import { fastGetInvoices } from '@/app/libs/fastData';

export async function getInvoices() {
  try {
    const result = await fastGetInvoices();
    return result.success ? result.data : [];
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return [];
  }
}

export async function getAllInvoices() {
  try {
    const result = await fastGetInvoices();
    return result.success ? result.data : [];
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return [];
  }
}
