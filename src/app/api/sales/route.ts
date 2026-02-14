import { executeOperation } from '@/app/libs/executeOperation';
import { NextRequest } from 'next/server';
import { getClientId } from '@/utils/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    // 🔐 AUTHENTICATION: Get clientId from authenticated user
    const clientId = await getClientId(req);
    if (!clientId) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    const sales = await executeOperation('sales', 'find', { clientId });

    // Sort sales by date (newest first)
    if (Array.isArray(sales)) {
      sales.sort((a: any, b: any) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA; // Descending order (newest first)
      });
    }

    return Response.json(sales);
  } catch (error: any) {
    console.error('Error fetching sales:', error);
    return Response.json(
      { error: error.message || 'Failed to fetch sales' },
      { status: 500 }
    );
  }
}
