import { NextRequest, NextResponse } from 'next/server';
import { executeOperation } from '@/app/libs/executeOperation';

export async function POST(request: NextRequest) {
  try {
    console.log('🧹 Starting cleanup of test data...');

    // Test invoice IDs to delete
    const testInvoiceIds = [
      '00000004',
      '00000005',
      '00000006',
      '00000007',
      '00000008',
      '00000009',
      '000000010',
    ];

    let deletedSales = 0;
    let deletedInvoices = 0;

    // Delete from sales collection
    for (const invoiceId of testInvoiceIds) {
      try {
        const salesResult = await executeOperation('sales', 'deleteOne', {
          invoiceId,
        });

        if (
          salesResult &&
          typeof salesResult === 'object' &&
          'deletedCount' in salesResult
        ) {
          deletedSales += salesResult.deletedCount || 0;
          console.log(
            `🗑️ Deleted ${salesResult.deletedCount || 0} sales for invoice ${invoiceId}`
          );
        }
      } catch (error) {
        console.error(`Error deleting sales for invoice ${invoiceId}:`, error);
      }
    }

    // Delete from invoices collection
    for (const invoiceId of testInvoiceIds) {
      try {
        const invoicesResult = await executeOperation('invoices', 'deleteOne', {
          invoiceNo: invoiceId,
        });

        if (
          invoicesResult &&
          typeof invoicesResult === 'object' &&
          'deletedCount' in invoicesResult
        ) {
          deletedInvoices += invoicesResult.deletedCount || 0;
          console.log(
            `🗑️ Deleted ${invoicesResult.deletedCount || 0} invoices for invoice ${invoiceId}`
          );
        }
      } catch (error) {
        console.error(
          `Error deleting invoices for invoice ${invoiceId}:`,
          error
        );
      }
    }

    console.log(
      `✅ Cleanup completed: ${deletedSales} sales and ${deletedInvoices} invoices deleted`
    );

    return NextResponse.json({
      success: true,
      message: 'Test data cleanup completed',
      deletedSales,
      deletedInvoices,
      testInvoiceIds,
    });
  } catch (error: any) {
    console.error('Error during cleanup:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
