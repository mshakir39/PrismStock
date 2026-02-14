import { NextRequest, NextResponse } from 'next/server';
import { executeOperation } from '@/app/libs/executeOperation';

export async function GET(request: NextRequest) {
  try {
    const clientId = request.cookies.get('selectedClient')?.value;
    console.log('Getting client from cookie:', clientId);

    if (!clientId) {
      return NextResponse.json({ success: true, client: null });
    }

    // Fetch client data from database
    const { ObjectId } = await import('mongodb');
    const client = await executeOperation('clients', 'findOne', {
      _id: new ObjectId(clientId)
    });

    if (!client) {
      return NextResponse.json({ success: true, client: null });
    }

    return NextResponse.json({ success: true, client });
  } catch (error) {
    console.error('Error getting client from cookie:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get client from cookie' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { clientId } = await request.json();
    console.log('Setting client cookie:', clientId);
    const response = NextResponse.json({ success: true });

    if (clientId) {
      response.cookies.set('selectedClient', clientId, {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
        httpOnly: false, // Allow client-side access
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
      console.log('Client cookie set successfully');
    } else {
      response.cookies.delete('selectedClient');
      console.log('Client cookie deleted');
    }

    return response;
  } catch (error) {
    console.error('Error setting client cookie:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to set client cookie' },
      { status: 500 }
    );
  }
}
