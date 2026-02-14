import { NextRequest, NextResponse } from 'next/server';
import { executeOperation } from '@/app/libs/executeOperation';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('Fetching invoice with ID:', id);

    // Convert string ID to ObjectId for MongoDB query
    let query;
    try {
      query = { _id: new ObjectId(id) };
    } catch {
      // If it's not a valid ObjectId, try as string ID
      query = { id: id };
    }

    const result = await executeOperation('invoices', 'findOne', query);

    console.log('Database result:', result);

    if (!result) {
      return NextResponse.json(
        { error: 'Invoice not found', query },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoice', details: error.message },
      { status: 500 }
    );
  }
}
