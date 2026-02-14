'use server';
import { executeOperation } from '@/app/libs/executeOperation';

interface SalesData {
  customerName: string;
  brandName: string;
  series: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  saleDate: Date;
  paymentMethod?: string;
  notes?: string;
}

export async function createSale(data: SalesData) {
  try {
    const result = await executeOperation('sales', 'insertOne', {
      ...data,
      createdAt: new Date(),
    });
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateSale(id: string, data: Partial<SalesData>) {
  try {
    const result = await executeOperation('sales', 'updateOne', {
      documentId: id,
      ...data,
      updatedAt: new Date(),
    });
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteSale(id: string) {
  try {
    if (!id) {
      throw new Error('Sale ID is required');
    }

    // React 19: Enhanced with better validation
    const result = await executeOperation('sales', 'delete', {
      documentId: id,
    });

    if (!result) {
      throw new Error('Sale not found or already deleted');
    }

    return { success: true, data: result };
  } catch (error: any) {
    console.error('Error deleting sale:', error);
    return { success: false, error: error.message };
  }
}

export async function getSales(clientId?: string) {
  try {
    // Use findAllWithFilter for client filtering, or findAll for no filtering
    let sales;
    if (clientId) {
      // Filter by clientId for multi-tenancy
      sales = await executeOperation('sales', 'findAllWithFilter', { clientId });
    } else {
      sales = await executeOperation('sales', 'findAll');
    }

    // Sort sales by date (newest first) - client-side sorting
    if (Array.isArray(sales)) {
      sales.sort((a: any, b: any) => {
        const dateA = new Date(a.date || a.createdAt).getTime();
        const dateB = new Date(b.date || b.createdAt).getTime();
        return dateB - dateA; // Descending order (newest first)
      });
    }

    return { success: true, data: sales };
  } catch (error: any) {
    console.error('Error fetching sales:', error);
    return { success: false, error: error.message };
  }
}

export async function getSalesByDateRange(startDate: Date, endDate: Date) {
  try {
    // React 19: Enhanced with better error handling and validation
    if (!startDate || !endDate) {
      throw new Error('Start date and end date are required');
    }

    if (startDate > endDate) {
      throw new Error('Start date must be before end date');
    }

    // Use basic find operation and filter in JavaScript (compatible with executeOperation)
    const sales = await executeOperation('sales', 'find');

    // Filter by date range and sort
    const filteredSales = Array.isArray(sales)
      ? sales
          .filter((sale: any) => {
            const saleDate = new Date(sale.date || sale.createdAt);
            return saleDate >= startDate && saleDate <= endDate;
          })
          .sort((a: any, b: any) => {
            const dateA = new Date(a.date || a.createdAt).getTime();
            const dateB = new Date(b.date || b.createdAt).getTime();
            return dateB - dateA; // Descending order (newest first)
          })
      : [];

    return { success: true, data: filteredSales };
  } catch (error: any) {
    console.error('Error fetching sales by date range:', error);
    return { success: false, error: error.message };
  }
}

export async function getSalesByCustomer(customerName: string) {
  try {
    // Use basic find operation and filter in JavaScript (compatible with executeOperation)
    const sales = await executeOperation('sales', 'find');

    // Filter by customer name and sort
    const filteredSales = Array.isArray(sales)
      ? sales
          .filter((sale: any) => sale.customerName === customerName)
          .sort((a: any, b: any) => {
            const dateA = new Date(a.date || a.createdAt).getTime();
            const dateB = new Date(b.date || b.createdAt).getTime();
            return dateB - dateA; // Descending order (newest first)
          })
      : [];

    return { success: true, data: filteredSales };
  } catch (error: any) {
    console.error('Error fetching sales by customer:', error);
    return { success: false, error: error.message };
  }
}
