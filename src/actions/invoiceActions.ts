'use server';
import { executeOperation } from '@/app/libs/executeOperation';

interface InvoiceItem {
  brandName: string;
  series: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface InvoiceData {
  invoiceNumber?: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod?: string;
  paymentStatus?: 'pending' | 'paid' | 'partial';
  invoiceDate?: Date;
  dueDate?: Date;
  notes?: string;
  // Category-specific fields
  category?: string;
  // Battery-specific fields
  batteryDetails?: {
    plateCount?: string;
    ah?: string;
    noWarranty?: boolean;
    warrantyStartDate?: Date;
    warrantyDuration?: string | number;
    warrantyEndDate?: Date;
    warrantyCode?: string;
  };
  // Generic data field for extensibility
  [key: string]: any;
}

export async function createInvoice(data: InvoiceData, clientId?: string) {
  try {
    // Prepare base invoice data
    const baseInvoiceData = {
      ...data,
      clientId, // Add clientId for multi-tenancy
      createdAt: new Date(),
    };

    // Handle category-specific data
    if (data.category === 'Batteries' && data.batteryDetails) {
      baseInvoiceData.batteryDetails = data.batteryDetails;
    }

    const result = await executeOperation('invoices', 'insertOne', baseInvoiceData);
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateInvoice(id: string, data: Partial<InvoiceData>) {
  try {
    const result = await executeOperation('invoices', 'updateOne', {
      documentId: id,
      ...data,
      updatedAt: new Date(),
    });
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteInvoice(id: string) {
  try {
    const result = await executeOperation('invoices', 'delete', {
      documentId: id,
    });
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getInvoices(clientId?: string) {
  try {
    // Use findAllWithFilter for client filtering, or findAll for no filtering
    let invoices;
    if (clientId) {
      // Filter by clientId for multi-tenancy
      invoices = await executeOperation('invoices', 'findAllWithFilter', { clientId });
    } else {
      invoices = await executeOperation('invoices', 'findAll');
    }

    // Sort invoices by creation date (newest first) - client-side sorting
    if (Array.isArray(invoices)) {
      invoices.sort((a: any, b: any) => {
        const dateA = new Date(a.createdDate || a.createdAt).getTime();
        const dateB = new Date(b.createdDate || b.createdAt).getTime();
        return dateB - dateA; // Descending order (newest first)
      });
    }

    return { success: true, data: invoices };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getInvoiceById(id: string) {
  try {
    const invoice = await executeOperation('invoices', 'findOne', {
      documentId: id,
    });
    return { success: true, data: invoice };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getInvoicesByCustomer(customerName: string, clientId?: string) {
  try {
    const query = clientId ? { customerName, clientId } : { customerName };
    const invoices = await executeOperation('invoices', 'find', query);
    return { success: true, data: invoices };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getInvoicesByDateRange(startDate: Date, endDate: Date, clientId?: string) {
  try {
    const query = clientId 
      ? { 
          invoiceDate: { $gte: startDate, $lte: endDate },
          clientId 
        }
      : { 
          invoiceDate: { $gte: startDate, $lte: endDate }
        };
    const invoices = await executeOperation('invoices', 'find', query);
    return { success: true, data: invoices };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateInvoicePaymentStatus(
  id: string,
  paymentStatus: 'pending' | 'paid' | 'partial'
) {
  try {
    const result = await executeOperation('invoices', 'updateOne', {
      documentId: id,
      paymentStatus,
      updatedAt: new Date(),
    });
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
