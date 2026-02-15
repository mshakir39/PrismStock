'use server';
import { executeOperation } from '@/app/libs/executeOperation';
import { cookies } from 'next/headers';

interface CustomerData {
  customerName: string;
  phoneNumber: string;
  address?: string;
  email?: string;
}

export async function createCustomer(data: CustomerData) {
  try {
    // Get clientId from cookies for multi-tenancy
    const cookieStore = await cookies();
    const selectedClientCookie = cookieStore.get('selectedClient')?.value;
    
    const result = await executeOperation('customers', 'insertOne', {
      ...data,
      clientId: selectedClientCookie, // Add clientId for multi-tenancy
      createdAt: new Date(),
    });
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateCustomer(id: string, data: Partial<CustomerData>) {
  try {
    // Get clientId from cookies for multi-tenancy
    const cookieStore = await cookies();
    const selectedClientCookie = cookieStore.get('selectedClient')?.value;
    
    const result = await executeOperation('customers', 'updateOne', {
      id,
      ...data,
      clientId: selectedClientCookie, // Add clientId for multi-tenancy
    });
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteCustomer(id: string) {
  try {
    if (!id) {
      throw new Error('Customer ID is required');
    }

    // Get clientId from cookies for multi-tenancy
    const cookieStore = await cookies();
    const selectedClientCookie = cookieStore.get('selectedClient')?.value;

    const result = await executeOperation('customers', 'delete', {
      id,
      clientId: selectedClientCookie, // Add clientId for multi-tenancy
    });

    if (!result) {
      throw new Error('Customer not found or already deleted');
    }

    return { success: true, data: result };
  } catch (error: any) {
    console.error('Error deleting customer:', error);
    return { success: false, error: error.message };
  }
}

export async function getCustomers() {
  try {
    // Get clientId from cookies for multi-tenancy
    const cookieStore = await cookies();
    const selectedClientCookie = cookieStore.get('selectedClient')?.value;
    
    // Use findAllWithFilter for client filtering, or findAll for no filtering
    let customers;
    if (selectedClientCookie) {
      // Filter by clientId for multi-tenancy
      customers = await executeOperation('customers', 'findAllWithFilter', { clientId: selectedClientCookie });
    } else {
      customers = await executeOperation('customers', 'findAll');
    }

    // Sort customers by creation date (newest first)
    if (Array.isArray(customers)) {
      customers.sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA; // Descending order (newest first)
      });
    }

    return { success: true, data: customers };
  } catch (error: any) {
    console.error('Error fetching customers:', error);
    return { success: false, error: error.message };
  }
}
