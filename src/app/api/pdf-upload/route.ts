// app/api/pdf-upload/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'PDF Upload API is working!',
    methods: ['POST'],
    note: 'PDF processing happens on client-side',
  });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const brandName = formData.get('brandName') as string;
    const salesTax = Number(formData.get('salesTax')) || 18;
    const extractedText = formData.get('extractedText') as string; // Client sends extracted text

    console.log('📋 Received data:', {
      hasFile: !!file,
      brandName,
      salesTax,
      textLength: extractedText?.length || 0,
    });

    if (!extractedText || !brandName) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing extracted text or brand name',
        },
        { status: 400 }
      );
    }

    // Process the extracted text
    const batteryData = extractBatteryDataFromText(extractedText, salesTax);

    if (batteryData.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No battery data found in the extracted text',
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        brandName,
        series: batteryData,
        salesTax: salesTax.toString(),
        message: `Successfully extracted ${batteryData.length} battery series`,
      },
    });
  } catch (error: any) {
    console.error('Error processing data:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

interface BatteryData {
  name: string;
  plate: string;
  ah: number;
  retailPrice?: number;
  salesTax?: number;
  maxRetailPrice?: number;
}

function extractBatteryDataFromText(
  text: string,
  salesTax: number
): BatteryData[] {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 10);

  const batteryData: BatteryData[] = [];
  const seenNames = new Set<string>();

  for (const line of lines) {
    if (/^(model|price|list|battery|specification)/i.test(line)) continue;

    const extracted = extractDataFromLine(line);

    if (extracted && !seenNames.has(extracted.name)) {
      seenNames.add(extracted.name);
      const retailPrice = extracted.retailPrice || 0;

      batteryData.push({
        ...extracted,
        salesTax,
        maxRetailPrice: Math.round(
          retailPrice + (retailPrice * salesTax) / 100
        ),
      });
    }
  }

  return batteryData;
}

function extractDataFromLine(line: string): BatteryData | null {
  const parts = line.replace(/\s+/g, ' ').trim().split(' ');
  if (parts.length < 3) return null;

  // Find price
  let price: number | null = null;
  let priceIndex = -1;

  for (let i = parts.length - 1; i >= 0; i--) {
    const cleanPart = parts[i].replace(/[,₹$€£\s\-]/g, '');
    const num = parseFloat(cleanPart);

    if (!isNaN(num) && num > 50 && num < 100000) {
      price = num;
      priceIndex = i;
      break;
    }
  }

  if (!price) return null;

  // Find AH
  let ah: number | null = null;
  let ahIndex = -1;

  for (let i = 0; i < priceIndex; i++) {
    const part = parts[i].toLowerCase();

    if (part.includes('ah')) {
      const match = part.match(/(\d+(?:\.\d+)?)/);
      if (match) {
        ah = parseFloat(match[1]);
        ahIndex = i;
        break;
      }
    }
  }

  if (!ah) {
    for (let i = 0; i < priceIndex; i++) {
      const num = parseFloat(parts[i]);
      if (!isNaN(num) && num > 0 && num < 1000) {
        ah = num;
        ahIndex = i;
        break;
      }
    }
  }

  if (!ah) return null;

  // Extract name
  const nameParts: string[] = [];

  for (let i = 0; i < parts.length; i++) {
    if (i === ahIndex || i === priceIndex) continue;

    const part = parts[i];
    if (!/^\d+$/.test(part) && /[a-zA-Z]/.test(part)) {
      nameParts.push(part);
    }
  }

  if (nameParts.length === 0) return null;

  return {
    name: nameParts.join(' ').trim(),
    plate: '0', // Default value
    ah,
    retailPrice: price,
  };
}
