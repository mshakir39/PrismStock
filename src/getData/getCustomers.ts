'use server';
import { fastGetCustomers } from '@/app/libs/fastData';
import { cookies } from 'next/headers';

export async function getCustomers() {
  try {
    // Get clientId from cookies for multi-tenancy
    const cookieStore = await cookies();
    const selectedClientCookie = cookieStore.get('selectedClient')?.value;
    
    const result = await fastGetCustomers(selectedClientCookie);
    return result.success ? result.data : [];
  } catch (error) {
    console.error('Error fetching customers:', error);
    return [];
  }
}
