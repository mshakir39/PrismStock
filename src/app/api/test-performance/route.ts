import { connectToMongoDB } from '@/app/libs/connectToMongoDB';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    console.log('🚀 Testing database performance...');

    const db = await connectToMongoDB();
    if (!db) {
      throw new Error('Failed to connect to database');
    }

    const results = [];

    // Test invoice queries
    console.log('📊 Testing invoice queries...');

    // Test 1: Get recent invoices
    const start1 = Date.now();
    const recentInvoices = await db
      .collection('invoices')
      .find({})
      .sort({ createdDate: -1 })
      .limit(10)
      .toArray();
    const time1 = Date.now() - start1;

    results.push({
      test: 'Recent Invoices (10 items)',
      time: `${time1}ms`,
      count: recentInvoices.length,
    });

    // Test 2: Search by customer
    const start2 = Date.now();
    const customerInvoices = await db
      .collection('invoices')
      .find({ customerName: { $regex: 'test', $options: 'i' } })
      .limit(10)
      .toArray();
    const time2 = Date.now() - start2;

    results.push({
      test: 'Customer Search',
      time: `${time2}ms`,
      count: customerInvoices.length,
    });

    // Test 3: Get stock data
    const start3 = Date.now();
    const stockData = await db.collection('stock').find({}).limit(10).toArray();
    const time3 = Date.now() - start3;

    results.push({
      test: 'Stock Data (10 items)',
      time: `${time3}ms`,
      count: stockData.length,
    });

    // Test 4: Get categories
    const start4 = Date.now();
    const categories = await db.collection('categories').find({}).toArray();
    const time4 = Date.now() - start4;

    results.push({
      test: 'Categories',
      time: `${time4}ms`,
      count: categories.length,
    });

    // Performance analysis
    const totalTime = time1 + time2 + time3 + time4;
    const averageTime = totalTime / 4;

    let performance = 'Excellent';
    if (averageTime > 1000) {
      performance = 'Needs Optimization';
    } else if (averageTime > 500) {
      performance = 'Good';
    } else if (averageTime > 200) {
      performance = 'Very Good';
    }

    console.log('✅ Performance test complete!');

    return NextResponse.json({
      success: true,
      performance: performance,
      totalTime: `${totalTime}ms`,
      averageTime: `${Math.round(averageTime)}ms`,
      results: results,
      recommendations:
        averageTime > 500
          ? [
              'Consider adding more database indexes',
              'Implement caching for frequently accessed data',
              'Use pagination for large datasets',
            ]
          : [
              'Performance looks good!',
              'Consider implementing caching for even better performance',
              'Monitor performance as data grows',
            ],
    });
  } catch (error: any) {
    console.error('❌ Error testing performance:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
