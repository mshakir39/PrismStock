'use server';

import { executeOperation } from '@/app/libs/executeOperation';
import { cookies } from 'next/headers';

interface WarrantyData {
  productName: string;
  category?: any;
  breadcrumb?: any[];
  warrentyStartDate: string;
  warrentyDuration: number;
  warrentyCode: string;
  customerName: string;
  customerContactNumber: string;
  invoiceNumber: string;
  saleDate: string;
  isDeleted?: boolean; // Added for deleted warranty history
  deletedAt?: string; // Added for deleted warranty history
  // React 19: Add search metadata
  searchTimestamp?: string;
  searchDuration?: number;
}

interface WarrantySearchResult {
  success: boolean;
  data?: any;
  error?: string;
  // React 19: Add search performance tracking
  searchDuration?: number;
}

export async function searchWarranty(
  warrantyCode: string
): Promise<WarrantySearchResult> {
  try {
    // React 19: Enhanced validation and error handling
    const trimmedWarrantyCode = warrantyCode.trim();
    console.log('🔍 Searching for warranty code:', trimmedWarrantyCode);

    if (!trimmedWarrantyCode) {
      return { success: false, error: 'Warranty code is required' };
    }

    // Get clientId from cookies for multi-tenancy
    const cookieStore = await cookies();
    const selectedClientCookie = cookieStore.get('selectedClient')?.value;

    // React 19: Add search analytics (optional)
    const searchStartTime = Date.now();

    // Helper function to check if a warranty code exists in a space or comma-separated string
    const hasWarrantyCode = (
      warrantyString: string,
      searchCode: string
    ): boolean => {
      if (!warrantyString || !searchCode) return false;

      console.log(
        `🔍 Checking if '${searchCode}' exists in '${warrantyString}'`
      );

      // First, try exact match (in case the search code is the complete warranty string)
      if (warrantyString.trim() === searchCode.trim()) {
        console.log(`✅ Exact match found!`);
        return true;
      }

      // Split the warranty string by spaces OR commas and check if the search code exists
      const codes = warrantyString
        .split(/[\s,]+/)
        .filter((code) => code.length > 0);
      console.log(`📋 Split codes: [${codes.join(', ')}]`);

      // Check if the search code exists as a complete code in the array
      const found = codes.includes(searchCode);
      console.log(`✅ Found: ${found}`);

      // If not found, try to match by combining adjacent codes
      if (!found) {
        // Try to find the search code by combining adjacent parts
        for (let i = 0; i < codes.length - 1; i++) {
          const combinedCode = `${codes[i]} ${codes[i + 1]}`;
          if (combinedCode === searchCode) {
            console.log(`✅ Found combined code: ${combinedCode}`);
            return true;
          }
        }
      }

      return found;
    };

    // React 19: Enhanced search with better error handling and performance tracking
    console.log('📄 Checking invoices collection for warranty code...');

    // Get invoices filtered by clientId for multi-tenancy
    const allInvoices = await executeOperation('invoices', 'findAllWithFilter', selectedClientCookie ? { clientId: selectedClientCookie } : {});

    if (!allInvoices || !Array.isArray(allInvoices)) {
      console.log('⚠️ No invoices found or invalid response');
    } else {
      console.log(`📊 Found ${allInvoices.length} invoices to check`);

      // React 19: Enhanced debugging with search performance tracking
      const searchDuration = Date.now() - searchStartTime;
      console.log(`⏱️ Search performance: ${searchDuration}ms so far`);

      // Debug: Show some warranty codes from invoices
      let debugCount = 0;
      for (const invoice of allInvoices) {
        if (invoice.products && Array.isArray(invoice.products)) {
          for (const product of invoice.products) {
            if (product.warrentyCode && debugCount < 5) {
              console.log(
                `🔍 Invoice warranty code: "${product.warrentyCode}"`
              );
              debugCount++;
            }
          }
        }
      }
      for (const invoice of allInvoices) {
        if (!invoice.products || !Array.isArray(invoice.products)) continue;

        for (const product of invoice.products) {
          if (
            product.warrentyCode &&
            hasWarrantyCode(product.warrentyCode, trimmedWarrantyCode)
          ) {
            console.log(
              `✅ Found warranty code '${trimmedWarrantyCode}' in invoice: ${invoice.invoiceNo}`
            );

            // React 19: Enhanced warranty data with additional fields
            const warrantyData: WarrantyData = {
              productName: product.productName || product.name || 'Unknown Product',
              category: product.category,
              breadcrumb: product.breadcrumb,
              warrentyStartDate: product.warrentyStartDate,
              warrentyDuration: product.warrentyDuration || 6,
              warrentyCode: product.warrentyCode,
              customerName: invoice.customerName,
              customerContactNumber: invoice.customerContactNumber,
              invoiceNumber: invoice.invoiceNo,
              saleDate:
                invoice.createdAt ||
                invoice.createdDate ||
                new Date().toISOString(),
              // React 19: Add search metadata
              searchTimestamp: new Date().toISOString(),
              searchDuration: Date.now() - searchStartTime,
            };

            return { success: true, data: warrantyData };
          }
        }
      }
    }

    // If not found in invoices, try sales collection
    console.log('💼 Checking sales collection for warranty code...');

    const allSales = await executeOperation('sales', 'findAllWithFilter', selectedClientCookie ? { clientId: selectedClientCookie } : {});

    if (!allSales || !Array.isArray(allSales)) {
      console.log('⚠️ No sales found or invalid response');
    } else {
      for (const sale of allSales) {
        if (!sale.products || !Array.isArray(sale.products)) continue;

        for (const product of sale.products) {
          if (
            product.warrentyCode &&
            hasWarrantyCode(product.warrentyCode, trimmedWarrantyCode)
          ) {
            console.log(
              `✅ Found warranty code '${trimmedWarrantyCode}' in sale: ${sale.invoiceId || sale.id}`
            );

            const warrantyData: WarrantyData = {
              productName: product.productName || product.name || 'Unknown Product',
              category: product.category,
              breadcrumb: product.breadcrumb,
              warrentyStartDate: product.warrentyStartDate,
              warrentyDuration: product.warrentyDuration || 6,
              warrentyCode: product.warrentyCode,
              customerName: sale.customerName,
              customerContactNumber: sale.customerContactNumber,
              invoiceNumber: sale.invoiceId,
              saleDate: sale.date,
              // React 19: Add search metadata
              searchTimestamp: new Date().toISOString(),
              searchDuration: Date.now() - searchStartTime,
            };

            return { success: true, data: warrantyData };
          }
        }
      }
    }

    // If not found in active collections, check warranty history (deleted invoices)
    console.log('📚 Checking warranty history for warranty code...');

    const allWarrantyHistory = await executeOperation(
      'warrantyHistory',
      'findAllWithFilter',
      selectedClientCookie ? { clientId: selectedClientCookie } : {}
    );

    if (!allWarrantyHistory || !Array.isArray(allWarrantyHistory)) {
      console.log('⚠️ No warranty history found or invalid response');
    } else {
      for (const warrantyRecord of allWarrantyHistory) {
        if (
          warrantyRecord.warrentyCode &&
          hasWarrantyCode(warrantyRecord.warrentyCode, trimmedWarrantyCode)
        ) {
          console.log(
            `✅ Found warranty code '${trimmedWarrantyCode}' in warranty history`
          );

          if (!warrantyRecord.productDetails) {
            console.log(
              '⚠️ Warranty history found but no product details:',
              warrantyRecord
            );
            continue;
          }

          const warrantyData: WarrantyData = {
            productName: warrantyRecord.productDetails.productName || warrantyRecord.productDetails.name || 'Unknown Product',
            category: warrantyRecord.productDetails.category,
            breadcrumb: warrantyRecord.productDetails.breadcrumb,
            warrentyStartDate: warrantyRecord.productDetails.warrentyStartDate,
            warrentyDuration:
              warrantyRecord.productDetails.warrentyDuration || 6,
            warrentyCode: warrantyRecord.warrentyCode,
            customerName: warrantyRecord.customerName,
            customerContactNumber: warrantyRecord.customerContactNumber,
            invoiceNumber: warrantyRecord.originalInvoiceNo,
            saleDate: warrantyRecord.deletedAt || new Date().toISOString(),
            isDeleted: true, // Flag to indicate this is from a deleted invoice
            deletedAt: warrantyRecord.deletedAt,
            // React 19: Add search metadata
            searchTimestamp: new Date().toISOString(),
            searchDuration: Date.now() - searchStartTime,
          };

          return { success: true, data: warrantyData };
        }
      }
    }

    // React 19: Enhanced logging with search performance
    const totalSearchDuration = Date.now() - searchStartTime;
    console.log(
      `❌ No warranty code match found in any collection (search took ${totalSearchDuration}ms)`
    );

    return {
      success: false,
      error: 'No warranty found with this code',
      searchDuration: totalSearchDuration,
    };
  } catch (error: any) {
    console.error('❌ Error searching warranty:', error);
    return {
      success: false,
      error: error.message,
      searchDuration: Date.now() - (Date.now() - 0), // Calculate approximate duration
    };
  }
}
