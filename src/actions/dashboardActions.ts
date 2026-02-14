'use server';
import { executeOperation } from '@/app/libs/executeOperation';
import { getEffectiveClientIdForServerAction } from '@/utils/auth';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ROUTES } from '@/constants/routes';

interface DashboardStats {
  totalProducts: number;
  totalInventoryValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalSales: number;
  totalRevenue: number;
  totalProfit?: number;
  averageOrderValue: number;
  totalPending: number;
  totalCustomers: number;
  topSellingProducts: any[];
  alerts: {
    lowStock: number;
    outOfStock: number;
    pendingPayments: number;
  };
  salesTrend?: any[];
  inventoryByBrand?: any[];
}

// Server action to fetch dashboard data
export async function fetchDashboardAction() {
  try {
    // Get client ID from server-side auth
    const clientId = await getEffectiveClientIdForServerAction();

    if (!clientId) {
      return { success: false, error: 'Authentication required' };
    }

    // Get product statistics
    const products = await executeOperation('products', 'find', { clientId });
    const totalProducts = Array.isArray(products) ? products.length : 0;

    // Calculate inventory value and stock alerts
    let totalInventoryValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let inventoryByBrand: any[] = [];

    if (Array.isArray(products)) {
      const brandStats: { [key: string]: { count: number; value: number } } = {};

      products.forEach((product: any) => {
        const price = product.price || 0;
        const stock = product.stock || 0;
        const brand = product.brand || 'Unknown';

        // Calculate inventory value
        totalInventoryValue += price * stock;

        // Count stock alerts
        if (stock === 0) {
          outOfStockCount++;
        } else if (stock <= (product.minStock || 5)) {
          lowStockCount++;
        }

        // Aggregate by brand
        if (!brandStats[brand]) {
          brandStats[brand] = { count: 0, value: 0 };
        }
        brandStats[brand].count += stock;
        brandStats[brand].value += price * stock;
      });

      inventoryByBrand = Object.entries(brandStats).map(([brand, stats]) => ({
        brand,
        ...stats
      }));
    }

    // Get sales statistics
    const sales = await executeOperation('sales', 'find', { clientId });
    const totalSales = Array.isArray(sales) ? sales.length : 0;

    let totalRevenue = 0;
    let totalProfit = 0;

    if (Array.isArray(sales)) {
      sales.forEach((sale: any) => {
        totalRevenue += sale.total || 0;
        totalProfit += sale.profit || 0;
      });
    }

    const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Get customer count
    const customers = await executeOperation('customers', 'find', { clientId });
    const totalCustomers = Array.isArray(customers) ? customers.length : 0;

    // Get pending orders/invoices
    const pendingInvoices = await executeOperation('invoices', 'find', {
      clientId,
      status: 'pending'
    });
    const totalPending = Array.isArray(pendingInvoices) ? pendingInvoices.length : 0;

    // Get top selling products
    const topSellingProducts = Array.isArray(products)
      ? products
          .filter((p: any) => p.stock > 0)
          .sort((a: any, b: any) => (b.salesCount || 0) - (a.salesCount || 0))
          .slice(0, 5)
          .map((p: any) => ({
            name: p.name,
            sales: p.salesCount || 0,
            revenue: (p.price || 0) * (p.salesCount || 0)
          }))
      : [];

    // Create sales trend (last 30 days)
    const salesTrend = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return {
        date: date.toISOString().split('T')[0],
        sales: Math.floor(Math.random() * 100) + 10 // Mock data for now
      };
    });

    const dashboardData: DashboardStats = {
      totalProducts,
      totalInventoryValue,
      lowStockCount,
      outOfStockCount,
      totalSales,
      totalRevenue,
      totalProfit,
      averageOrderValue,
      totalPending,
      totalCustomers,
      topSellingProducts,
      alerts: {
        lowStock: lowStockCount,
        outOfStock: outOfStockCount,
        pendingPayments: totalPending
      },
      salesTrend,
      inventoryByBrand
    };

    return {
      success: true,
      data: dashboardData
    };
  } catch (error: any) {
    console.error('Error fetching dashboard data:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch dashboard data'
    };
  }
}

export async function getSalesTrend(startDate: Date, endDate: Date) {
  try {
    const sales = await executeOperation('sales', 'find', {
      saleDate: {
        $gte: startDate,
        $lte: endDate,
      },
    });

    // Group sales by date
    const salesByDate = Array.isArray(sales)
      ? sales.reduce((acc: any, sale: any) => {
          const date = new Date(sale.saleDate).toISOString().split('T')[0];
          if (!acc[date]) {
            acc[date] = { date, totalAmount: 0, count: 0 };
          }
          acc[date].totalAmount += sale.totalAmount || 0;
          acc[date].count += 1;
          return acc;
        }, {})
      : {};

    const salesTrend = Object.values(salesByDate).sort(
      (a: any, b: any) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return { success: true, data: salesTrend };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getInventoryByBrand() {
  try {
    const stock = await executeOperation('stock', 'findAll');

    const inventoryByBrand = Array.isArray(stock)
      ? stock.map((item: any) => {
          const totalStock =
            item.seriesStock && Array.isArray(item.seriesStock)
              ? item.seriesStock.reduce(
                  (sum: number, series: any) =>
                    sum + (parseInt(series.inStock) || 0),
                  0
                )
              : 0;

          return {
            brandName: item.brandName,
            totalStock,
            seriesCount: item.seriesStock ? item.seriesStock.length : 0,
          };
        })
      : [];

    return { success: true, data: inventoryByBrand };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function unlockDashboard() {
  const cookieStore = await cookies();
  cookieStore.set('dashboard-unlocked', 'true', {
    path: '/',
    maxAge: 60 * 30, // 30 minutes
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  });
  redirect('/');
}

export async function lockDashboard() {
  const cookieStore = await cookies();
  cookieStore.delete('dashboard-unlocked');
  redirect(ROUTES.DASHBOARD_PASSWORD);
}
