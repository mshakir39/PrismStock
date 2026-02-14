import { getClientId } from '@/utils/auth';
import { executeOperation } from '@/app/libs/executeOperation';
import { getAllSum } from '@/utils/getTotalSum';
import { ObjectId } from 'mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Escape user-provided text for use inside a RegExp
function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeText(s: string) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

// Build a regex that requires all tokens (split by space, '/', ',', '(', ')', '-') to appear in any order
function buildTokenRegex(input: string) {
  const tokens = String(input || '')
    .split(/[\s/,()\-]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
  if (tokens.length === 0) return '.*';
  const lookaheads = tokens.map((t) => `(?=.*${escapeRegex(t)})`).join('');
  return `^${lookaheads}.*$`;
}

// Track processing invoices to prevent duplicates
const processingInvoices = new Set<string>();

// Cache for frequently accessed data
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Cache helper function
function getCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = CACHE_TTL
): Promise<T> {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < ttl) {
    return Promise.resolve(cached.data);
  }

  return fetcher().then((data) => {
    cache.set(key, { data, timestamp: Date.now() });
    return data;
  });
}

// Performance tracking
async function trackPerformance<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  const result = await fn();
  const duration = Date.now() - start;

  console.log(`⏱️ ${operation} took ${duration}ms`);

  if (duration > 1000) {
    console.warn(`⚠️ Slow operation: ${operation} (${duration}ms)`);
  }

  return result;
}

export async function POST(req: NextRequest) {
  const formData = await req.json();
  const requestId = `${formData.customerName}-${formData.customerContactNumber}-${Date.now()}`;

  if (processingInvoices.has(requestId)) {
    return NextResponse.json(
      { error: 'Invoice is already being processed. Please wait.' },
      { status: 409 }
    );
  }

  processingInvoices.add(requestId);

  try {
    // 🔐 AUTHENTICATION: Get clientId like product actions do
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Decode token to get user info
    let decoded;
    try {
      decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    } catch {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Get user from database to check if super admin
    const { UserService } = await import('@/services/userService');
    const userResult = await UserService.getUserById(decoded.userId);

    if (!userResult.success || !userResult.user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }

    const user = userResult.user;
    let clientId: string | null = null;

    // Use the passed selectedClientId first (from client context), then fallback to cookie like product actions
    if (formData.selectedClientId) {
      clientId = formData.selectedClientId;
    } else {
      // Fallback to cookie for all users
      const selectedClientCookie = cookieStore.get('selectedClient')?.value;
      clientId = selectedClientCookie || user.clientId || null;
    }

    // Handle case where clientId is null
    if (!clientId) {
      console.warn('⚠️ No clientId found for user - this may cause issues with multi-tenancy');
      // For now, continue without clientId to prevent "null" string in database
      // In production, this should return an error requiring client selection
    }
    // Debug custom date logic
    console.log('🔍 Custom Date Debug:');
    console.log('useCustomDate:', formData.useCustomDate);
    console.log('customDate:', formData.customDate);
    console.log('useCustomDate type:', typeof formData.useCustomDate);
    console.log('customDate type:', typeof formData.customDate);

    // Log warranty auto-sync feature
    if (formData.useCustomDate === true || formData.useCustomDate === 'true') {
      console.log(
        '🔄 Warranty Auto-Sync: Custom date enabled - warranty start dates will automatically sync with custom invoice date'
      );
      console.log(
        '📅 Note: All warranty start dates will be set to the custom invoice date for consistency'
      );
    }

    const lastInvoices = await executeOperation('invoices', 'find', {}, { sort: { invoiceNo: -1 }, limit: 1 }) as any[];
    const lastInvoice = lastInvoices?.[0];
    let nextInvoiceNumber;
    if (lastInvoice && typeof lastInvoice === 'object') {
      const lastInvoiceNumber = lastInvoice.invoiceNo;
      const numericPart = lastInvoiceNumber.replace(/^.*?(\d+)$/, '$1'); // Extract the numeric part
      const nextNumber = parseInt(numericPart) + 1;

      // 🔒 VALIDATION: Ensure invoice number is valid
      if (isNaN(nextNumber) || nextNumber <= 0) {
        throw new Error(`Invalid invoice number generated: ${nextNumber}`);
      }

      nextInvoiceNumber = nextNumber.toString().padStart(8, '0'); // Ensure exactly 8 digits
    } else {
      nextInvoiceNumber = '00000001'; // Start with 1 if no invoices exist
    }

    // 🔒 VALIDATION: Ensure invoice number format is correct
    if (!/^\d{8}$/.test(nextInvoiceNumber)) {
      throw new Error(
        `Invalid invoice number format: ${nextInvoiceNumber}. Expected 8 digits.`
      );
    }

    // Create an invoice document
    const invoice: any = {
      invoiceNo: nextInvoiceNumber,
      customerName: formData.customerName,
      customerAddress: formData.customerAddress,
      customerContactNumber: formData.customerContactNumber,
      customerType: formData.customerType || 'WalkIn Customer', // Add customer type
      customerId:
        formData.customerType === 'Regular' ? formData.customerId : null, // Add customerId for regular customers
      vehicleNo: formData.vehicleNo || '',
      paymentMethod: formData.paymentMethod,
      batteriesCountAndWeight: formData?.batteriesCountAndWeight,
      batteriesRate: 0, // Will be validated and set below
      receivedAmount: 0, // Will be validated and set below
      isPayLater: formData?.paymentMethod?.includes('Pay Later') || false,
      ...(clientId ? { clientId } : {}), // Only include clientId if it exists

      products: await Promise.all(formData.productDetail.map(async (product: any) => {
        // 🔒 VALIDATION: Ensure product has required fields
        if (
          !product.productId ||
          !product.productName ||
          !product.productPrice ||
          !product.quantity
        ) {
          throw new Error(
            `Product is missing required fields: ${JSON.stringify(product)}`
          );
        }

        const productPrice = parseFloat(product.productPrice);
        const quantity = parseInt(product.quantity);

        if (isNaN(productPrice) || productPrice <= 0) {
          throw new Error(
            `Invalid product price for ${product.productName}: ${product.productPrice}`
          );
        }

        if (isNaN(quantity) || quantity <= 0) {
          throw new Error(
            `Invalid quantity for ${product.productName}: ${product.quantity}`
          );
        }

        const totalPrice = productPrice * quantity;

        // Fetch full product data from database to include category, brand, etc.
        let fullProductData = null;
        try {
          const { ObjectId } = await import('mongodb');
          const dbProduct = await executeOperation('products', 'findOne', {
            _id: new ObjectId(product.productId)
          }) as any; // Cast to any to access product properties
          if (dbProduct) {
            fullProductData = {
              category: dbProduct.category || null,
              description: dbProduct.description || '',
              specifications: dbProduct.specifications || {},
            };
          }
        } catch (error) {
          console.warn(`Could not fetch full product data for ${product.productId}:`, error);
        }

        // Calculate warranty end date if warranty code is provided
        let warrantyEndDate = product.warrentyEndDate;

        // Determine the actual warranty start date to use for calculations
        let actualWarrantyStartDate = product.warrentyStartDate;
        if (
          (formData.useCustomDate === true ||
            formData.useCustomDate === 'true') &&
          formData.customDate
        ) {
          actualWarrantyStartDate = new Date(formData.customDate)
            .toISOString()
            .split('T')[0];
        }

        if (
          product.warrentyCode &&
          actualWarrantyStartDate &&
          product.warrentyDuration
        ) {
          const startDate = new Date(actualWarrantyStartDate);
          if (!isNaN(startDate.getTime())) {
            // 🔒 VALIDATION: Ensure warranty start date is not in the future
            const warrantyStartDateNow = new Date();
            if (startDate > warrantyStartDateNow) {
              throw new Error(
                `Warranty start date for ${product.brandName} - ${product.series} cannot be in the future: ${actualWarrantyStartDate}`
              );
            }
            const endDate = new Date(startDate);
            endDate.setMonth(
              endDate.getMonth() + parseInt(product.warrentyDuration.toString())
            );
            warrantyEndDate = endDate.toISOString().split('T')[0];

            // 🔒 VALIDATION: Ensure warranty end date is valid
            const calculatedEndDate = new Date(warrantyEndDate);
            if (isNaN(calculatedEndDate.getTime())) {
              throw new Error(
                `Invalid warranty end date calculated for ${product.brandName} - ${product.series}: ${warrantyEndDate}`
              );
            }

            // Note: Allow warranty end date to be in the past to support backdated invoices
          }
        }

        // Auto-set warranty start date to custom date if enabled
        let finalWarrantyStartDate = product.warrentyStartDate;
        if (
          (formData.useCustomDate === true ||
            formData.useCustomDate === 'true') &&
          formData.customDate
        ) {
          // Use custom date for warranty start date
          finalWarrantyStartDate = new Date(formData.customDate)
            .toISOString()
            .split('T')[0];
          console.log(
            `📅 Auto-setting warranty start date for ${product.productName} to custom date: ${finalWarrantyStartDate}`
          );
          console.log(
            `📅 Original warranty start date was: ${product.warrentyStartDate}`
          );
        }

        return {
          productId: product.productId,
          productName: product.productName,
          productPrice: product.productPrice,
          quantity: product.quantity,
          warrentyCode: product.warrentyCode ? product.warrentyCode.trim() : '',
          warrentyStartDate: finalWarrantyStartDate,
          warrentyEndDate: warrantyEndDate,
          totalPrice: totalPrice,
          batteryDetails: product.batteryDetails,
          productCategories: product.productCategories || [],
          fullCategoryPath: product.fullCategoryPath || '',
          // Include full product data fetched from database
          category: fullProductData?.category || null,
          description: fullProductData?.description || '',
          specifications: fullProductData?.specifications || {},
        };
      })),
      createdDate:
        (formData.useCustomDate === true ||
          formData.useCustomDate === 'true') &&
        formData.customDate
          ? new Date(formData.customDate)
          : new Date(),
    };

    // Debug the final createdDate
    console.log('📅 Final createdDate:', invoice.createdDate);
    console.log('📅 Final createdDate type:', typeof invoice.createdDate);

    // 🔒 VALIDATION: Ensure custom date is valid when provided
    if (formData.useCustomDate === true || formData.useCustomDate === 'true') {
      if (!formData.customDate) {
        throw new Error(
          'Custom date is required when useCustomDate is enabled'
        );
      }

      const customDate = new Date(formData.customDate);
      if (isNaN(customDate.getTime())) {
        throw new Error(`Invalid custom date: ${formData.customDate}`);
      }

      // Ensure custom date is not in the future
      const customDateNow = new Date();
      if (customDate > customDateNow) {
        throw new Error(
          `Custom date cannot be in the future: ${formData.customDate}`
        );
      }
    }

    // Calculate remaining amount
    const totalProductAmount = getAllSum(invoice.products, 'totalPrice') || 0;

    // 🔒 VALIDATION: Ensure totalProductAmount is always a valid number
    if (isNaN(totalProductAmount) || totalProductAmount < 0) {
      throw new Error(
        `Invalid total product amount: ${totalProductAmount}. Must be a positive number.`
      );
    }

    // 🔒 VALIDATION: Ensure receivedAmount is always a valid number
    let receivedAmount = 0;
    if (
      formData?.receivedAmount !== undefined &&
      formData?.receivedAmount !== null &&
      formData?.receivedAmount !== ''
    ) {
      const parsedAmount = parseFloat(formData.receivedAmount);
      if (isNaN(parsedAmount) || parsedAmount < 0) {
        throw new Error(
          `Invalid received amount: ${formData.receivedAmount}. Must be a positive number.`
        );
      }
      receivedAmount = parsedAmount;
    }

    // Ensure receivedAmount is never null or undefined
    if (
      receivedAmount === null ||
      receivedAmount === undefined ||
      isNaN(receivedAmount)
    ) {
      receivedAmount = 0;
    }

    // 🔒 VALIDATION: Ensure batteriesRate is always a valid number
    let batteriesRate = 0;
    if (
      formData?.batteriesRate !== undefined &&
      formData?.batteriesRate !== null &&
      formData?.batteriesRate !== ''
    ) {
      const parsedRate = parseFloat(formData.batteriesRate);
      if (isNaN(parsedRate) || parsedRate < 0) {
        throw new Error(
          `Invalid battery rate: ${formData.batteriesRate}. Must be a positive number.`
        );
      }
      batteriesRate = parsedRate;
    }

    // Ensure batteriesRate is never null or undefined
    if (
      batteriesRate === null ||
      batteriesRate === undefined ||
      isNaN(batteriesRate)
    ) {
      batteriesRate = 0;
    }

    // Calculate remaining amount
    invoice.remainingAmount =
      totalProductAmount - receivedAmount - batteriesRate;

    // 🔒 VALIDATION: Ensure remainingAmount is a valid number
    if (isNaN(invoice.remainingAmount)) {
      throw new Error(
        `Invalid remaining amount calculation. Total: ${totalProductAmount}, Received: ${receivedAmount}, Batteries: ${batteriesRate}`
      );
    }

    // 🔒 VALIDATION: Ensure received amount doesn't exceed total amount
    if (receivedAmount > totalProductAmount) {
      throw new Error(
        `Received amount (${receivedAmount}) cannot exceed total product amount (${totalProductAmount})`
      );
    }

    // 🔒 VALIDATION: Ensure batteries rate doesn't exceed total amount
    if (batteriesRate > totalProductAmount) {
      throw new Error(
        `Batteries rate (${batteriesRate}) cannot exceed total product amount (${totalProductAmount})`
      );
    }

    // 🔒 VALIDATION: Ensure combined received amount and batteries rate don't exceed total
    if (receivedAmount + batteriesRate > totalProductAmount) {
      throw new Error(
        `Combined received amount (${receivedAmount}) and batteries rate (${batteriesRate}) cannot exceed total product amount (${totalProductAmount})`
      );
    }

    // 🔒 VALIDATION: Ensure warranty codes are valid when provided
    for (const product of formData.productDetail) {
      // Check if product is battery tonic (distilled water) - skip warranty validation
      const isBatteryTonic =
        product.series &&
        (product.series.toLowerCase().includes('tonic') ||
          product.series.toLowerCase().includes('ml') ||
          (product.series.toLowerCase().includes('battery') &&
            product.series.toLowerCase().includes('water')) ||
          product.series.toLowerCase().includes('distilled'));

      // Skip warranty validation for battery tonic
      if (isBatteryTonic) {
        continue;
      }

      // Only validate warranty data for battery products
      if (product.isBattery) {
        if (product.warrentyCode && product.warrentyCode.trim() !== '') {
          const warrantyCode = product.warrentyCode.trim();
          if (warrantyCode.length < 3) {
            throw new Error(
              `Warranty code for ${product.productName} must be at least 3 characters long`
            );
          }

          // Ensure warranty start date is provided when warranty code is set
          if (
            !product.warrentyStartDate ||
            product.warrentyStartDate.trim() === ''
          ) {
            throw new Error(
              `Warranty start date is required for ${product.productName} when warranty code is provided`
            );
          }

          // Ensure warranty duration is provided when warranty code is set
          if (
            !product.warrentyDuration ||
            product.warrentyDuration.toString().trim() === ''
          ) {
            throw new Error(
              `Warranty duration is required for ${product.productName} when warranty code is provided`
            );
          }

          // Ensure warranty start date is a valid date
          const warrantyStartDate = new Date(product.warrentyStartDate);
          if (isNaN(warrantyStartDate.getTime())) {
            throw new Error(
              `Invalid warranty start date for ${product.productName}: ${product.warrentyStartDate}`
            );
          }

          // Ensure warranty duration is a valid number
          const warrantyDuration = parseInt(product.warrentyDuration.toString());
          if (
            isNaN(warrantyDuration) ||
            warrantyDuration <= 0 ||
            warrantyDuration > 120
          ) {
            throw new Error(
              `Invalid warranty duration for ${product.productName}: ${product.warrentyDuration}. Must be between 1 and 120 months.`
            );
          }
        }
      }
    }

    // 🔒 Set the validated batteriesRate in the invoice object
    invoice.batteriesRate = batteriesRate;

    // 🔒 Set the validated receivedAmount in the invoice object
    invoice.receivedAmount = receivedAmount;

    // 🔒 VALIDATION: Final validation of invoice object
    if (
      !invoice.invoiceNo ||
      !invoice.customerName ||
      !invoice.products ||
      invoice.products.length === 0
    ) {
      throw new Error(
        'Invoice object is missing required fields after validation'
      );
    }

    if (
      typeof invoice.remainingAmount !== 'number' ||
      isNaN(invoice.remainingAmount)
    ) {
      throw new Error(
        `Invalid remaining amount in invoice object: ${invoice.remainingAmount}`
      );
    }

    if (
      typeof invoice.batteriesRate !== 'number' ||
      isNaN(invoice.batteriesRate)
    ) {
      throw new Error(
        `Invalid batteries rate in invoice object: ${invoice.batteriesRate}`
      );
    }

    if (
      typeof invoice.receivedAmount !== 'number' ||
      isNaN(invoice.receivedAmount)
    ) {
      throw new Error(
        `Invalid received amount in invoice object: ${invoice.receivedAmount}`
      );
    }

    // 🔒 VALIDATION: Ensure invoice number format is correct
    if (!/^\d{8}$/.test(invoice.invoiceNo)) {
      throw new Error(
        `Invalid invoice number format in invoice object: ${invoice.invoiceNo}`
      );
    }

    // 🔒 VALIDATION: Ensure customer name is not empty (accepts "-" as valid)
    if (invoice.customerName.trim() === '') {
      throw new Error('Customer name cannot be empty in invoice object');
    }

    // 🔒 VALIDATION: Ensure customer contact is not empty (accepts "-" as valid)
    if (invoice.customerContactNumber.trim() === '') {
      throw new Error(
        'Customer contact number cannot be empty in invoice object'
      );
    }

    // 🔒 VALIDATION: Ensure products array is properly structured
    for (const product of invoice.products) {
      if (
        !product.productId ||
        !product.productName ||
        !product.productPrice ||
        !product.quantity ||
        !product.totalPrice
      ) {
        throw new Error(
          `Product in invoice object is missing required fields: ${JSON.stringify(product)}`
        );
      }

      if (
        typeof product.totalPrice !== 'number' ||
        isNaN(product.totalPrice) ||
        product.totalPrice <= 0
      ) {
        throw new Error(
          `Invalid product total price in invoice object: ${product.totalPrice}`
        );
      }

      if (
        typeof product.quantity !== 'string' ||
        parseInt(product.quantity) <= 0
      ) {
        throw new Error(
          `Invalid product quantity in invoice object: ${product.quantity}`
        );
      }
    }

    // Debug the calculation
    console.log('💰 Amount Calculation Debug:');
    console.log('  totalProductAmount:', totalProductAmount);
    console.log('  receivedAmount (raw):', formData?.receivedAmount);
    console.log('  receivedAmount (parsed):', receivedAmount);
    console.log('  batteriesRate (raw):', formData?.batteriesRate);
    console.log('  batteriesRate (parsed):', batteriesRate);
    console.log('  remainingAmount:', invoice.remainingAmount);

    // Set payment status based on remaining amount
    if (invoice.remainingAmount === 0) {
      invoice.paymentStatus = 'paid';
    } else {
      invoice.paymentStatus = 'partial';
    }

    // 🔒 VALIDATION: Ensure customer information is provided (any text but not empty)
    if (!formData.customerName || formData.customerName.trim() === '') {
      throw new Error(
        'Customer name is required. Please enter a name (e.g., "John Doe", "Walk-in Customer", "ABC Company", "-")'
      );
    }

    if (!formData.customerAddress || formData.customerAddress.trim() === '') {
      throw new Error(
        'Customer address is required. Please enter a location (e.g., "Downtown Area", "Main Street", "Not specified", "-")'
      );
    }

    if (
      !formData.customerContactNumber ||
      formData.customerContactNumber.trim() === ''
    ) {
      throw new Error(
        'Customer contact number is required. Please enter a number (e.g., "03123456789", "Not provided", "Walk-in customer", "-")'
      );
    }

    // 🔒 VALIDATION: Ensure products are provided
    if (
      !formData.productDetail ||
      !Array.isArray(formData.productDetail) ||
      formData.productDetail.length === 0
    ) {
      throw new Error('At least one product is required for the invoice');
    }

    // 🔒 VALIDATION: Ensure each product has required fields
    for (const product of formData.productDetail) {
      if (
        !product.productId ||
        !product.productName ||
        !product.productPrice ||
        !product.quantity
      ) {
        throw new Error(
          `Product is missing required fields: productId, productName, productPrice, or quantity`
        );
      }

      if (parseFloat(product.productPrice) <= 0) {
        throw new Error(
          `Invalid product price for ${product.productName}: ${product.productPrice}`
        );
      }

      if (parseInt(product.quantity) <= 0) {
        throw new Error(
          `Invalid quantity for ${product.productName}: ${product.quantity}`
        );
      }
    }

    // 🔒 VALIDATION: Ensure payment method is provided
    if (
      !formData.paymentMethod ||
      !Array.isArray(formData.paymentMethod) ||
      formData.paymentMethod.length === 0
    ) {
      throw new Error('Payment method is required and must be an array');
    }

    // 🔒 PRE-FLIGHT VALIDATION: Ensure all stock updates can succeed before creating invoice
    console.log('🔒 Pre-flight stock validation...');
    for (const product of formData.productDetail) {
      if (product.productId) {
        try {
          // Check if product exists and has sufficient stock
          const { ObjectId } = await import('mongodb');
          const currentProduct = await executeOperation('products', 'findOne', {
            _id: new ObjectId(product.productId)
          });
          
          if (!currentProduct) {
            throw new Error(`Product ${product.productName} not found in database`);
          }
          
          const currentStock = parseInt((currentProduct as any).stock) || 0;
          const quantity = parseInt(product.quantity) || 0;
          
          if (currentStock < quantity) {
            throw new Error(`Insufficient stock for ${product.productName}: Available ${currentStock}, Requested ${quantity}`);
          }
          
          console.log(`✅ Stock validation passed for ${product.productName}: ${currentStock} >= ${quantity}`);
        } catch (error: any) {
          console.error(`❌ Stock validation failed for ${product.productName}:`, error);
          throw new Error(`Stock validation failed: ${error?.message || 'Unknown error'}`);
        }
      }
    }
    console.log('✅ All stock validations passed');

    // Skip stock validation - using products and categories only
    console.log('📦 Skipping stock validation - using products and categories only');

    // Insert the invoice into the database
    console.log('📄 Inserting invoice into database...');
    const invoiceResult = await executeOperation(
      'invoices',
      'insertOne',
      invoice
    );

    // 🔒 VALIDATION: Ensure invoice insertion was successful
    if (!invoiceResult) {
      throw new Error('Failed to insert invoice into database');
    }

    // Update product quantities (reduce stock)
    console.log('📦 Updating product quantities...');
    console.log('📦 Products to process:', formData.productDetail);
    
    for (const product of formData.productDetail) {
      console.log(`🔍 Processing product: ${JSON.stringify({
        productId: product.productId,
        productName: product.productName,
        quantity: product.quantity
      })}`);
      
      if (product.productId) {
        let currentStock = 0;
        let quantity = 0;
        let newStock = 0;
        
        try {
          // Get current product
          const { ObjectId } = await import('mongodb');
          const currentProduct = await executeOperation('products', 'findOne', {
            _id: new ObjectId(product.productId)
          });
          
          console.log(`🔍 Current product data: ${JSON.stringify(currentProduct)}`);
          
          if (currentProduct) {
            currentStock = parseInt((currentProduct as any).stock) || 0;
            quantity = parseInt(product.quantity) || 0;
            
            console.log(`📊 Stock check for ${product.productName}: current=${currentStock}, selling=${quantity}`);
            
            // Validate that we have enough stock
            if (currentStock < quantity) {
              console.warn(`⚠️ Insufficient product stock for ${product.productName}: Available ${currentStock}, Requested ${quantity}`);
              // Still allow the sale but warn about insufficient stock
            }
            
            newStock = Math.max(0, currentStock - quantity);
            
            console.log(`🔄 Updating product ${product.productName}: ${currentStock} → ${newStock} (-${quantity})`);
            
            // Update product stock
            console.log(`🔧 About to call executeOperation with:`, {
              collection: 'products',
              operation: 'updateOne',
              data: {
                id: product.productId,
                data: {
                  stock: newStock.toString(),
                  updatedAt: new Date()
                }
              }
            });
            
            // Update product stock using direct MongoDB call
            const { ObjectId } = await import('mongodb');
            const { connectToMongoDB } = await import('@/app/libs/connectToMongoDB');
            
            const db = await connectToMongoDB();
            if (!db) {
              throw new Error('Failed to connect to database for stock update');
            }
            
            const updateResult = await db.collection('products').updateOne(
              { _id: new ObjectId(product.productId) },
              { 
                $set: { 
                  stock: newStock.toString(),
                  updatedAt: new Date()
                } 
              }
            );
            
            console.log(`✅ Product update result: ${JSON.stringify(updateResult)}`);
            console.log(`✅ Product quantity updated for ${product.productName}`);
          } else {
            console.log(`⚠️ Product ${product.productName} not found`);
            console.log(`  Product exists: ${!!currentProduct}`);
          }
        } catch (error: any) {
          console.error(`❌ CRITICAL: Failed to update product quantity for ${product.productName}:`, error);
          console.error(`❌ Product ID: ${product.productId}`);
          console.error(`❌ Current stock: ${currentStock}`);
          console.error(`❌ Quantity to subtract: ${quantity}`);
          console.error(`❌ New stock would be: ${newStock}`);
          
          // Throw the error to fail the invoice creation
          throw new Error(`Failed to update stock for product ${product.productName}: ${error?.message || 'Unknown error'}`);
        }
      } else {
        console.log(`⚠️ Product missing productId: ${product.productName}`);
      }
    }

    // Insert a sales record into the sales collection
    console.log('💼 Inserting sales record...');

    // 🔒 VALIDATION: Ensure sales record data is valid
    const salesTotalAmount = getAllSum(invoice.products, 'totalPrice');
    if (isNaN(salesTotalAmount) || salesTotalAmount <= 0) {
      throw new Error(`Invalid sales total amount: ${salesTotalAmount}`);
    }

    const salesRecord = {
      invoiceId: invoice.invoiceNo,
      date: invoice.createdDate,
      customerName: invoice.customerName,
      products: invoice.products,
      totalAmount: salesTotalAmount,
      paymentMethod: invoice.paymentMethod,
      clientId, // Add clientId for multi-tenancy
    };

    // 🔒 VALIDATION: Ensure sales record has required fields
    if (
      !salesRecord.invoiceId ||
      !salesRecord.customerName ||
      !salesRecord.products ||
      salesRecord.products.length === 0
    ) {
      throw new Error('Sales record is missing required fields');
    }

    const salesResult = await executeOperation(
      'sales',
      'insertOne',
      salesRecord
    );

    // 🔒 VALIDATION: Ensure sales record insertion was successful
    if (!salesResult) {
      throw new Error('Failed to insert sales record into database');
    }

    // Log warranty information summary
    if (formData.useCustomDate === true || formData.useCustomDate === 'true') {
      console.log('📋 Warranty Summary (Custom Date Enabled):');
      invoice.products.forEach((product: any, index: number) => {
        if (product.warrentyCode && product.warrentyStartDate) {
          console.log(
            `  Product ${index + 1}: ${product.productName}`
          );
          console.log(`    Warranty Code: ${product.warrentyCode}`);
          console.log(`    Warranty Start: ${product.warrentyStartDate}`);
          console.log(`    Warranty End: ${product.warrentyEndDate}`);
          console.log(
            `    Duration: ${formData.productDetail[index]?.warrentyDuration} months`
          );
        }
      });
    }

    console.log('✅ Invoice created successfully');
    return NextResponse.json({ message: 'Invoice created successfully' });
  } catch (err: any) {
    console.error('❌ Error creating invoice:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    // Remove from processing set
    processingInvoices.delete(requestId);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { additionalPayment, paymentMethod, id } = await req.json();

    // 🔒 VALIDATION: Validate additional payment amount
    if (
      !additionalPayment ||
      isNaN(parseFloat(additionalPayment)) ||
      parseFloat(additionalPayment) <= 0
    ) {
      return NextResponse.json(
        {
          error: `Invalid additional payment amount: ${additionalPayment}. Must be a positive number.`,
        },
        { status: 400 }
      );
    }

    // 🔒 VALIDATION: Validate payment method
    if (
      !paymentMethod ||
      !Array.isArray(paymentMethod) ||
      paymentMethod.length === 0
    ) {
      return NextResponse.json(
        {
          error: 'Payment method is required and must be an array.',
        },
        { status: 400 }
      );
    }

    const invoiceId = new ObjectId(id);
    const invoice: any = await executeOperation('invoices', 'findOne', {
      _id: invoiceId,
    });

    if (
      typeof invoice === 'object' &&
      invoice !== null &&
      'remainingAmount' in invoice
    ) {
      const remainingAmount = parseFloat(invoice.remainingAmount) || 0;
      const paymentAmount = parseFloat(additionalPayment) || 0;

      // 🔒 VALIDATION: Ensure payment amount doesn't exceed remaining amount
      if (paymentAmount > remainingAmount) {
        return NextResponse.json(
          {
            error: `Payment amount (${paymentAmount}) cannot exceed remaining amount (${remainingAmount})`,
          },
          { status: 400 }
        );
      }

      const newPayment = {
        addedDate: new Date(),
        amount: paymentAmount,
        paymentMethod: paymentMethod,
      };

      const updatedInvoice = {
        ...invoice,
        additionalPayment: [...(invoice.additionalPayment || []), newPayment],
        remainingAmount: remainingAmount - paymentAmount,
      };

      await executeOperation('invoices', 'updateOne', updatedInvoice);

      return NextResponse.json({ message: 'Invoice updated successfully' });
    } else {
      return NextResponse.json({ error: 'Invalid Invoice' }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Invoice ID is required' },
        { status: 400 }
      );
    }

    const invoiceId = new ObjectId(id);

    // 1. First, get the invoice details before deleting
    const invoice: any = await executeOperation('invoices', 'findOne', {
      _id: invoiceId,
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    console.log(
      '🗑️ Starting complete invoice deletion for:',
      invoice.invoiceNo
    );
    console.log('📋 Invoice details:', {
      customerName: invoice.customerName,
      totalProducts: invoice.products?.length || 0,
      totalAmount: invoice.remainingAmount,
      paymentMethod: invoice.paymentMethod,
    });

    // 2. Preserve warranty data before deletion (for warranty lookups)
    if (invoice.products && Array.isArray(invoice.products)) {
      console.log('🔧 Preserving warranty data...');
      for (const product of invoice.products) {
        if (product.warrentyCode) {
          try {
            await executeOperation('warrantyHistory', 'insertOne', {
              warrentyCode: product.warrentyCode
                ? product.warrentyCode.trim()
                : '',
              customerName: invoice.customerName,
              customerContactNumber: invoice.customerContactNumber,
              customerAddress: invoice.customerAddress,
              productDetails: {
                brandName: product.brandName,
                series: product.series,
                warrentyStartDate: product.warrentyStartDate,
                warrentyEndDate: product.warrentyEndDate,
                warrentyDuration: product.warrentyDuration,
              },
              originalInvoiceNo: invoice.invoiceNo,
              originalInvoiceId: invoice._id,
              deletedAt: new Date(),
              deletionReason: 'Invoice deleted by user',
            });
            console.log(
              `✅ Warranty data preserved for: ${product.warrentyCode}`
            );
          } catch (warrantyError) {
            console.warn(
              `⚠️ Failed to preserve warranty data for ${product.warrentyCode}:`,
              warrantyError
            );
          }
        }
      }
    }

    // 3. Reverse stock changes (restore quantities)
    if (invoice.products && Array.isArray(invoice.products)) {
      console.log('📦 Reversing stock changes...');
      for (const product of invoice.products) {
        const quantity = parseInt(product.quantity) || 0;

        console.log(`🔄 Restoring stock for ${product.productName}: +${quantity} units`);

        try {
          // Check if product has productId (should be available from invoice)
          if (product.productId) {
            // Directly update the products collection (same way stock is reduced during creation)
            const { ObjectId } = await import('mongodb');
            const { connectToMongoDB } = await import('@/app/libs/connectToMongoDB');

            const db = await connectToMongoDB();
            if (!db) {
              throw new Error('Failed to connect to database for stock restoration');
            }

            // Get current product stock
            const currentProduct = await db.collection('products').findOne(
              { _id: new ObjectId(product.productId) }
            ) as any;

            if (currentProduct) {
              const currentStock = parseInt(currentProduct.stock) || 0;
              const restoredStock = currentStock + quantity;

              // Update product stock
              const updateResult = await db.collection('products').updateOne(
                { _id: new ObjectId(product.productId) },
                {
                  $set: {
                    stock: restoredStock.toString(),
                    updatedAt: new Date()
                  }
                }
              );

              if (updateResult.modifiedCount > 0) {
                console.log(`✅ Stock restored for ${product.productName}: ${currentStock} → ${restoredStock} (+${quantity})`);
              } else {
                console.warn(`⚠️ Stock update failed for ${product.productName} - no changes made`);
              }
            } else {
              console.warn(`⚠️ Product ${product.productName} not found for stock restoration`);
            }
          } else {
            console.warn(`⚠️ Product ${product.productName} missing productId, cannot restore stock`);
          }
        } catch (stockError: any) {
          console.error(
            `❌ Failed to restore stock for ${product.productName}:`,
            stockError
          );
          throw new Error(
            `Failed to restore stock for ${product.productName}: ${stockError.message}`
          );
        }
      }
    }

    // 4. Delete the sales record
    console.log('💼 Deleting sales record...');
    try {
      await executeOperation('sales', 'deleteOne', {
        invoiceId: invoice.invoiceNo,
      });
      console.log('✅ Sales record deleted');
    } catch (salesError: any) {
      console.error('❌ Failed to delete sales record:', salesError);
      throw new Error(`Failed to delete sales record: ${salesError.message}`);
    }

    // 5. Archive invoice data for audit purposes
    console.log('📁 Archiving invoice data...');
    try {
      await executeOperation('archivedInvoices', 'insertOne', {
        originalInvoice: invoice,
        deletedAt: new Date(),
        deletionReason: 'Invoice deleted by user',
        originalId: invoice._id,
        invoiceNo: invoice.invoiceNo,
      });
      console.log('✅ Invoice data archived');
    } catch (archiveError) {
      console.warn('⚠️ Failed to archive invoice data:', archiveError);
      // Don't fail the deletion if archiving fails
    }

    // 6. Delete the invoice
    console.log('🗑️ Deleting main invoice record...');
    try {
      await executeOperation('invoices', 'deleteOne', {
        _id: invoiceId,
      });
      console.log('✅ Main invoice record deleted');
    } catch (invoiceError: any) {
      console.error('❌ Failed to delete invoice:', invoiceError);
      throw new Error(`Failed to delete invoice: ${invoiceError.message}`);
    }

    console.log('🎉 Complete invoice deletion successful:', invoice.invoiceNo);

    return NextResponse.json({
      message: 'Invoice completely deleted and all related data reverted',
      deletedInvoiceNo: invoice.invoiceNo,
      actionsCompleted: [
        'Warranty data preserved',
        'Stock quantities restored',
        'Sales record deleted',
        'Invoice data archived',
        'Main invoice deleted',
      ],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    // 🔐 AUTHENTICATION: Get clientId like product actions do
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Decode token to get user info
    let decoded;
    try {
      decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    } catch {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Get user from database to check if super admin
    const { UserService } = await import('@/services/userService');
    const userResult = await UserService.getUserById(decoded.userId);

    if (!userResult.success || !userResult.user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }

    const user = userResult.user;
    let clientId: string | null = null;

    // Check for selectedClientId in query parameters first, then fallback to cookie like product actions
    const url = new URL(req.url);
    const selectedClientId = url.searchParams.get('selectedClientId');
    
    if (selectedClientId) {
      clientId = selectedClientId;
    } else {
      // Fallback to cookie for all users
      const selectedClientCookie = cookieStore.get('selectedClient')?.value;
      clientId = selectedClientCookie || user.clientId || null;
    }

    // Handle case where clientId is null
    if (!clientId) {
      console.warn('⚠️ No clientId found for user - this may cause issues with multi-tenancy');
      // For now, return empty array instead of error
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
        message: 'No client access'
      });
    }
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const customerName = url.searchParams.get('customerName');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    // Build query with clientId filter
    const query: any = { clientId };

    // Add optional filters
    if (customerName) {
      query.customerName = { $regex: customerName, $options: 'i' };
    }

    if (startDate || endDate) {
      query.createdDate = {};
      if (startDate) {
        query.createdDate.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdDate.$lte = new Date(endDate);
      }
    }

    // Fetch invoices with pagination
    const invoices = await executeOperation('invoices', 'find', query, {
      sort: { createdDate: -1 },
      limit: Math.min(limit, 100), // Max 100 per request
      skip: offset,
    });

    // Get total count for pagination
    const { ObjectId } = await import('mongodb');
    const { connectToMongoDB } = await import('@/app/libs/connectToMongoDB');
    const db = await connectToMongoDB();
    if (!db) {
      throw new Error('Failed to connect to database');
    }
    const totalCount = await db.collection('invoices').countDocuments(query);

    return NextResponse.json({
      success: true,
      data: invoices,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    });
  } catch (error: any) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoices', details: error.message },
      { status: 500 }
    );
  }
}
