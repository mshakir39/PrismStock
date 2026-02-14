import { NextRequest } from 'next/server';
import { connectToMongoDB } from '@/app/libs/connectToMongoDB';

// Helper function to safely convert to number
const toNumber = (value: any): number => {
  if (value === null || value === undefined || value === '') return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

// Helper function to validate and fix soldCount data
const validateSoldCount = (soldCount: any): number => {
  const num = toNumber(soldCount);
  if (num < 0) {
    console.warn(`⚠️ Negative soldCount detected: ${soldCount}, setting to 0`);
    return 0;
  }
  return num;
};

// Helper function to verify sales-stock synchronization
const verifySalesStockSync = (salesData: any[], stockData: any[]) => {
  console.log('🔍 Starting comprehensive sales-stock sync verification...');

  const syncIssues: any[] = [];
  const syncSummary = {
    totalProducts: 0,
    syncedProducts: 0,
    mismatchedProducts: 0,
    missingInSales: 0,
    missingInStock: 0,
    totalSalesRecords: salesData.length,
    totalStockRecords: stockData.length,
  };

  // Create a map of stock data for quick lookup
  const stockMap = new Map();
  stockData.forEach((stockDoc) => {
    if (stockDoc.seriesStock && Array.isArray(stockDoc.seriesStock)) {
      stockDoc.seriesStock.forEach((series: any) => {
        const key = `${stockDoc.brandName}-${series.series}`;
        stockMap.set(key, {
          brandName: stockDoc.brandName,
          series: series.series,
          stockSoldCount: validateSoldCount(series.soldCount),
          inStock: toNumber(series.inStock),
          productCost: toNumber(series.productCost),
        });
      });
    }
  });

  // Calculate actual sales from sales data
  const salesMap = new Map();
  const salesDetails: any[] = [];

  salesData.forEach((sale) => {
    if (Array.isArray(sale.products)) {
      sale.products.forEach((product: any) => {
        const brandName =
          product.brandName || product.batteryDetails?.brandName || '';
        const series = product.series || product.batteryDetails?.name || '';

        if (brandName && series) {
          const key = `${brandName}-${series}`;
          const quantity = toNumber(product.quantity);

          if (salesMap.has(key)) {
            salesMap.set(key, salesMap.get(key) + quantity);
          } else {
            salesMap.set(key, quantity);
          }

          // Store detailed sales information
          salesDetails.push({
            product: key,
            brandName,
            series,
            quantity,
            saleDate: sale.date,
            invoiceId: sale.invoiceId,
            customerName: sale.customerName,
          });
        }
      });
    }
  });

  // Compare stock soldCount with actual sales
  stockMap.forEach((stockItem, key) => {
    syncSummary.totalProducts++;
    const actualSales = salesMap.get(key) || 0;
    const stockSoldCount = stockItem.stockSoldCount;

    if (Math.abs(actualSales - stockSoldCount) > 0) {
      syncSummary.mismatchedProducts++;
      syncIssues.push({
        product: key,
        brandName: stockItem.brandName,
        series: stockItem.series,
        stockSoldCount,
        actualSales,
        difference: actualSales - stockSoldCount,
        inStock: stockItem.inStock,
        productCost: stockItem.productCost,
        issue:
          actualSales > stockSoldCount
            ? 'Stock undercounted'
            : 'Stock overcounted',
        severity:
          Math.abs(actualSales - stockSoldCount) > 5 ? 'High' : 'Medium',
      });

      console.log(
        `❌ Sync issue: ${key} - Stock: ${stockSoldCount}, Sales: ${actualSales}, Diff: ${actualSales - stockSoldCount}`
      );
    } else {
      syncSummary.syncedProducts++;
      console.log(
        `✅ Synced: ${key} - Stock: ${stockSoldCount}, Sales: ${actualSales}`
      );
    }
  });

  // Check for products in sales but not in stock
  salesMap.forEach((salesCount, key) => {
    if (!stockMap.has(key)) {
      syncSummary.missingInStock++;
      syncIssues.push({
        product: key,
        actualSales: salesCount,
        stockSoldCount: 0,
        difference: salesCount,
        issue: 'Product in sales but missing from stock',
        severity: 'High',
      });
      console.log(`❌ Missing in stock: ${key} - Sales: ${salesCount}`);
    }
  });

  // Check for products in stock but no sales
  stockMap.forEach((stockItem, key) => {
    if (!salesMap.has(key) && stockItem.stockSoldCount > 0) {
      syncSummary.missingInSales++;
      syncIssues.push({
        product: key,
        brandName: stockItem.brandName,
        series: stockItem.series,
        stockSoldCount: stockItem.stockSoldCount,
        actualSales: 0,
        difference: -stockItem.stockSoldCount,
        inStock: stockItem.inStock,
        productCost: stockItem.productCost,
        issue: 'Product in stock with soldCount but no sales records',
        severity: 'Medium',
      });
      console.log(
        `❌ Missing in sales: ${key} - Stock soldCount: ${stockItem.stockSoldCount}`
      );
    }
  });

  console.log('📊 Sales-Stock Sync Summary:', syncSummary);
  console.log(`🔍 Found ${syncIssues.length} sync issues`);

  return {
    syncSummary,
    syncIssues,
    salesDetails,
    isFullySynced: syncIssues.length === 0,
    verificationDate: new Date().toISOString(),
  };
};

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Starting sync verification...');
    const db = await connectToMongoDB();

    if (!db) {
      console.error('❌ Failed to connect to MongoDB');
      return Response.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Get date range from query parameters (optional)
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let salesQuery = {};
    if (startDate && endDate) {
      salesQuery = {
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      };
      console.log(
        `📅 Filtering sales by date range: ${startDate} to ${endDate}`
      );
    } else {
      console.log('📅 No date range specified - checking all-time sync');
    }

    // Fetch sales and stock data
    const [salesDocs, stockDocs] = await Promise.all([
      db.collection('sales').find(salesQuery).toArray(),
      db.collection('stock').find().toArray(),
    ]);

    console.log(
      `📊 Fetched ${salesDocs.length} sales records and ${stockDocs.length} stock records`
    );

    // Perform sync verification
    const syncVerification = verifySalesStockSync(salesDocs, stockDocs);

    return Response.json({
      success: true,
      data: {
        ...syncVerification,
        dateRange: startDate && endDate ? { startDate, endDate } : null,
        verificationType: startDate && endDate ? 'Date Range' : 'All Time',
      },
      message: syncVerification.isFullySynced
        ? 'All sales and stock data are perfectly synchronized!'
        : `Found ${syncVerification.syncIssues.length} synchronization issues that need attention.`,
    });
  } catch (error: any) {
    console.error('❌ Error during sync verification:', error);
    return Response.json(
      {
        success: false,
        error: error.message || 'Failed to verify synchronization',
      },
      { status: 500 }
    );
  }
}
