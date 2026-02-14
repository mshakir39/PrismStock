import { NextRequest, NextResponse } from 'next/server';
import { executeOperation } from '@/app/libs/executeOperation';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brand = searchParams.get('brand');
    const series = searchParams.get('series');

    if (!brand || !series) {
      return NextResponse.json(
        { error: 'Brand and series are required' },
        { status: 400 }
      );
    }

    console.log(`🔍 Debugging sales for: ${brand}-${series}`);

    // Search in sales collection
    const salesQuery = {
      'products.brandName': brand,
      'products.series': series,
    };

    const sales = await executeOperation('sales', 'find', salesQuery);

    // Search in invoices collection
    const invoicesQuery = {
      'products.brandName': brand,
      'products.series': series,
    };

    const invoices = await executeOperation('invoices', 'find', invoicesQuery);

    // Search in warranty history
    const warrantyQuery = {
      'productDetails.brandName': brand,
      'productDetails.series': series,
    };

    const warrantyHistory = await executeOperation(
      'warrantyHistory',
      'find',
      warrantyQuery
    );

    const salesArray = Array.isArray(sales) ? sales : [];
    const invoicesArray = Array.isArray(invoices) ? invoices : [];
    const warrantyArray = Array.isArray(warrantyHistory) ? warrantyHistory : [];

    const result = {
      brand,
      series,
      sales: salesArray,
      invoices: invoicesArray,
      warrantyHistory: warrantyArray,
      totalSales: salesArray.length,
      totalInvoices: invoicesArray.length,
      totalWarrantyHistory: warrantyArray.length,
    };

    console.log(
      `📊 Found ${result.totalSales} sales, ${result.totalInvoices} invoices, ${result.totalWarrantyHistory} warranty records`
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error debugging sales:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
