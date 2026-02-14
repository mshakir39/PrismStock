// app/api/auth/getToken/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function GET(req: NextRequest) {
  const secret = process.env.GOOGLE_CLIENT_SECRET ?? '';
  const token = await getToken({ req, secret });

  return NextResponse.json({ token });
}
