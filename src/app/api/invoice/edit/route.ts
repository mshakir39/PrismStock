'use server';
import { connectToMongoDB } from '@/app/libs/connectToMongoDB';
import { executeOperation } from '@/app/libs/executeOperation';
import { getAllSum } from '@/utils/getTotalSum';
import { ObjectId } from 'mongodb';
import { NextRequest, NextResponse } from 'next/server';

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

export async function PATCH(req: NextRequest) {
  const formData = await req.json();
  const requestId = `edit-${formData.id}-${Date.now()}`;

  if (processingInvoices.has(requestId)) {
    return NextResponse.json(
      { error: 'Invoice edit is already being processed. Please wait.' },
      { status: 409 }
    );
  }

  processingInvoices.add(requestId);

  try {
    console.log('🔄 Starting comprehensive invoice edit for:', formData.id);

    const db = await connectToMongoDB();
    if (!db) {
      throw new Error('Failed to connect to database');
    }

    const invoiceId = new ObjectId(formData.id);

    // 1. Get the original invoice
    console.log('📄 Fetching original invoice...');
    const originalInvoice: any = await db
      .collection('invoices')
      .findOne({ _id: invoiceId });
    if (!originalInvoice) {
      throw new Error('Original invoice not found');
    }

    console.log('📋 Original invoice:', {
      invoiceNo: originalInvoice.invoiceNo,
      productsCount: originalInvoice.products?.length || 0,
      totalAmount: getAllSum(originalInvoice.products, 'totalPrice'),
    });

    // 2. Get current stock levels for validation
    console.log('📦 Validating current stock levels...');
    const stockValidationPromises = formData.productDetail.map(
      async (product: any) => {
        const seriesName = product.batteryDetails?.name || product.series;
        const quantity = parseInt(product.quantity) || 0;

        if (quantity <= 0) {
          throw new Error(`Invalid quantity for ${seriesName}: ${quantity}`);
        }

        const stockQuery = { 'seriesStock.series': seriesName };
        const stockExists = await db.collection('stock').findOne(stockQuery);

        if (!stockExists) {
          throw new Error(`Series '${seriesName}' not found in stock.`);
        }

        const stockData = stockExists as any;
        const currentStock = stockData.seriesStock?.find(
          (item: any) => item.series === seriesName
        );
        if (!currentStock) {
          throw new Error(`Series '${seriesName}' not found in stock data.`);
        }

        const currentInStock = parseInt(currentStock.inStock) || 0;

        // For editing, we need to consider the original quantity that will be restored
        const originalProduct = originalInvoice.products?.find(
          (p: any) => p.series === seriesName
        );
        const originalQuantity = originalProduct
          ? parseInt(originalProduct.quantity) || 0
          : 0;
        const availableStock = currentInStock + originalQuantity; // Available after restoring original

        if (availableStock < quantity) {
          throw new Error(
            `Insufficient stock for ${seriesName}. Available: ${availableStock}, Requested: ${quantity}`
          );
        }

        return { seriesName, quantity, currentInStock, originalQuantity };
      }
    );

    const stockValidations = await Promise.all(stockValidationPromises);
    console.log(
      '✅ Stock validation completed:',
      stockValidations.length,
      'products validated'
    );

    // 3. Archive original invoice for history
    console.log('📁 Archiving original invoice for edit history...');
    await db.collection('invoiceEditHistory').insertOne({
      originalInvoice,
      editedAt: new Date(),
      editReason: formData.editReason || 'Invoice edited by user',
      originalId: originalInvoice._id,
      invoiceNo: originalInvoice.invoiceNo,
    });

    // 4. Reverse original stock changes (restore original quantities)
    console.log('📦 Reversing original stock changes...');
    if (originalInvoice.products && Array.isArray(originalInvoice.products)) {
      for (const product of originalInvoice.products) {
        const seriesName = product.batteryDetails?.name || product.series;
        const originalQuantity = parseInt(product.quantity) || 0;

        console.log(
          `🔄 Restoring stock for ${seriesName}: +${originalQuantity} units`
        );

        // Restore stock quantities (increase inStock, decrease soldCount)
        await executeOperation('stock', 'restoreStockFromInvoice', {
          series: seriesName,
          quantity: originalQuantity,
        });

        console.log(`✅ Stock restored for ${seriesName}`);
      }
    }

    // 5. Calculate new invoice values
    console.log('💰 Calculating new invoice values...');

    // Process products with warranty calculations
    const updatedProducts = formData.productDetail.map((product: any) => {
      const productPrice = parseFloat(product.productPrice);
      const quantity = parseInt(product.quantity);

      if (isNaN(productPrice) || productPrice <= 0) {
        throw new Error(
          `Invalid product price for ${product.brandName} - ${product.series}: ${product.productPrice}`
        );
      }

      if (isNaN(quantity) || quantity <= 0) {
        throw new Error(
          `Invalid quantity for ${product.brandName} - ${product.series}: ${product.quantity}`
        );
      }

      const totalPrice = productPrice * quantity;

      // Check if product is battery tonic (distilled water) - skip warranty validation
      const isBatteryTonic =
        product.series &&
        (product.series.toLowerCase().includes('tonic') ||
          product.series.toLowerCase().includes('ml') ||
          (product.series.toLowerCase().includes('battery') &&
            product.series.toLowerCase().includes('water')) ||
          product.series.toLowerCase().includes('distilled'));

      // Validate warranty information if provided (skip for battery tonic)
      if (
        !isBatteryTonic &&
        product.warrentyCode &&
        product.warrentyCode.trim() !== '' &&
        product.warrentyCode !== 'No Warranty'
      ) {
        // Ensure warranty start date is provided when warranty code is set
        if (
          !product.warrentyStartDate ||
          product.warrentyStartDate.trim() === ''
        ) {
          throw new Error(
            `Warranty start date is required for ${product.brandName} - ${product.series} when warranty code is provided`
          );
        }

        // Ensure warranty duration is provided when warranty code is set
        if (
          !product.warrentyDuration ||
          product.warrentyDuration.toString().trim() === ''
        ) {
          throw new Error(
            `Warranty duration is required for ${product.brandName} - ${product.series} when warranty code is provided`
          );
        }

        // Ensure warranty start date is a valid date
        const warrantyStartDate = new Date(product.warrentyStartDate);
        if (isNaN(warrantyStartDate.getTime())) {
          throw new Error(
            `Invalid warranty start date for ${product.brandName} - ${product.series}: ${product.warrentyStartDate}`
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
            `Invalid warranty duration for ${product.brandName} - ${product.series}: ${product.warrentyDuration}. Must be between 1 and 120 months.`
          );
        }
      }

      // Calculate warranty end date if warranty code is provided (skip for battery tonic)
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
        !isBatteryTonic &&
        product.warrentyCode &&
        actualWarrantyStartDate &&
        product.warrentyDuration
      ) {
        const startDate = new Date(actualWarrantyStartDate);
        if (!isNaN(startDate.getTime())) {
          const endDate = new Date(startDate);
          endDate.setMonth(
            endDate.getMonth() + parseInt(product.warrentyDuration.toString())
          );
          warrantyEndDate = endDate.toISOString().split('T')[0];
        }
      }

      // Auto-set warranty start date to custom date if enabled (skip for battery tonic)
      let finalWarrantyStartDate = product.warrentyStartDate;
      if (
        !isBatteryTonic &&
        (formData.useCustomDate === true ||
          formData.useCustomDate === 'true') &&
        formData.customDate
      ) {
        finalWarrantyStartDate = new Date(formData.customDate)
          .toISOString()
          .split('T')[0];
      }

      return {
        brandName: product.brandName,
        series: product.series,
        productPrice: product.productPrice,
        quantity: product.quantity,
        warrentyCode: product.warrentyCode ? product.warrentyCode.trim() : '',
        warrentyStartDate: finalWarrantyStartDate,
        warrentyEndDate: warrantyEndDate,
        totalPrice: totalPrice,
        batteryDetails: product.batteryDetails,
      };
    });

    // Calculate financial values
    const totalProductAmount = getAllSum(updatedProducts, 'totalPrice') || 0;

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

    // Calculate remaining amount
    const remainingAmount = totalProductAmount - receivedAmount - batteriesRate;

    // Set payment status based on remaining amount
    let paymentStatus = 'partial';
    if (remainingAmount === 0) {
      paymentStatus = 'paid';
    } else if (receivedAmount === 0 && batteriesRate === 0) {
      paymentStatus = 'pending';
    }

    // 6. Create updated invoice object
    console.log('📝 Creating updated invoice object...');
    const updatedInvoice = {
      ...originalInvoice,
      customerName: formData.customerName,
      customerAddress: formData.customerAddress,
      customerContactNumber: formData.customerContactNumber,
      customerType: formData.customerType || 'WalkIn Customer',
      customerId:
        formData.customerType === 'Regular' ? formData.customerId : null,
      vehicleNo: formData.vehicleNo || '',
      paymentMethod: formData.paymentMethod,
      batteriesCountAndWeight: formData?.batteriesCountAndWeight,
      batteriesRate: batteriesRate,
      receivedAmount: receivedAmount,
      remainingAmount: remainingAmount,
      paymentStatus: paymentStatus,
      products: updatedProducts,
      createdDate:
        (formData.useCustomDate === true ||
          formData.useCustomDate === 'true') &&
        formData.customDate
          ? new Date(formData.customDate)
          : originalInvoice.createdDate,
      updatedAt: new Date(),
      editHistory: [
        ...(originalInvoice.editHistory || []),
        {
          editedAt: new Date(),
          editReason: formData.editReason || 'Invoice edited by user',
          changes: getChangesSummary(
            originalInvoice,
            formData,
            updatedProducts
          ),
        },
      ],
    };

    console.log('💰 Updated amounts:', {
      totalProductAmount,
      receivedAmount,
      batteriesRate,
      remainingAmount,
      paymentStatus,
    });

    // 7. Update stock quantities for new products
    console.log('📦 Updating stock quantities for new products...');
    for (const product of formData.productDetail) {
      const seriesName = product.batteryDetails?.name || product.series;
      const quantity = parseInt(product.quantity) || 0;

      console.log(`🔄 Updating stock for ${seriesName}: -${quantity} units`);

      // Update stock quantities and increment sold count
      await executeOperation('stock', 'updateStockAndSoldCount', {
        series: seriesName,
        quantity: quantity,
      });

      console.log(`✅ Stock updated for ${seriesName}`);
    }

    // 8. Update the invoice in database
    console.log('💾 Updating invoice in database...');
    await db
      .collection('invoices')
      .updateOne({ _id: invoiceId }, { $set: updatedInvoice });

    // 9. Update corresponding sales record
    console.log('💼 Updating sales record...');
    const salesTotalAmount = getAllSum(updatedProducts, 'totalPrice');
    const updatedSalesRecord = {
      invoiceId: originalInvoice.invoiceNo,
      date: updatedInvoice.createdDate,
      customerName: updatedInvoice.customerName,
      products: updatedProducts,
      totalAmount: salesTotalAmount,
      paymentMethod: updatedInvoice.paymentMethod,
      updatedAt: new Date(),
    };

    await db
      .collection('sales')
      .updateOne(
        { invoiceId: originalInvoice.invoiceNo },
        { $set: updatedSalesRecord }
      );

    console.log('✅ Sales record updated');

    // 10. Handle warranty data updates if needed
    console.log('🔧 Handling warranty data updates...');
    if (updatedProducts.some((p: any) => p.warrentyCode)) {
      // Preserve warranty data for any products that had warranties
      for (const product of updatedProducts) {
        if (product.warrentyCode && product.warrentyCode !== 'No Warranty') {
          try {
            await db.collection('warrantyHistory').insertOne({
              warrentyCode: product.warrentyCode.trim(),
              customerName: updatedInvoice.customerName,
              customerContactNumber: updatedInvoice.customerContactNumber,
              customerAddress: updatedInvoice.customerAddress,
              productDetails: {
                brandName: product.brandName,
                series: product.series,
                warrentyStartDate: product.warrentyStartDate,
                warrentyEndDate: product.warrentyEndDate,
                warrentyDuration: product.warrentyDuration,
              },
              originalInvoiceNo: originalInvoice.invoiceNo,
              originalInvoiceId: originalInvoice._id,
              updatedAt: new Date(),
              updateReason: 'Invoice edited - warranty information updated',
            });
            console.log(
              `✅ Warranty data updated for: ${product.warrentyCode}`
            );
          } catch (warrantyError) {
            console.warn(
              `⚠️ Failed to update warranty data for ${product.warrentyCode}:`,
              warrantyError
            );
          }
        }
      }
    }

    console.log(
      '🎉 Comprehensive invoice edit completed successfully:',
      originalInvoice.invoiceNo
    );

    return NextResponse.json({
      message: 'Invoice updated successfully',
      updatedInvoice: {
        invoiceNo: originalInvoice.invoiceNo,
        totalAmount: totalProductAmount,
        paymentStatus,
        productsCount: updatedProducts.length,
      },
    });
  } catch (err: any) {
    console.error('❌ Error during comprehensive invoice edit:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    // Remove from processing set
    processingInvoices.delete(requestId);
  }
}

// Helper function to summarize changes made to the invoice
function getChangesSummary(
  originalInvoice: any,
  newData: any,
  updatedProducts: any[]
) {
  const changes: any[] = [];

  // Customer information changes
  if (originalInvoice.customerName !== newData.customerName) {
    changes.push({
      field: 'customerName',
      oldValue: originalInvoice.customerName,
      newValue: newData.customerName,
      type: 'customer',
    });
  }

  if (originalInvoice.customerAddress !== newData.customerAddress) {
    changes.push({
      field: 'customerAddress',
      oldValue: originalInvoice.customerAddress,
      newValue: newData.customerAddress,
      type: 'customer',
    });
  }

  if (originalInvoice.customerContactNumber !== newData.customerContactNumber) {
    changes.push({
      field: 'customerContactNumber',
      oldValue: originalInvoice.customerContactNumber,
      newValue: newData.customerContactNumber,
      type: 'customer',
    });
  }

  // Payment changes
  if (
    JSON.stringify(originalInvoice.paymentMethod) !==
    JSON.stringify(newData.paymentMethod)
  ) {
    changes.push({
      field: 'paymentMethod',
      oldValue: originalInvoice.paymentMethod,
      newValue: newData.paymentMethod,
      type: 'payment',
    });
  }

  if (originalInvoice.receivedAmount !== newData.receivedAmount) {
    changes.push({
      field: 'receivedAmount',
      oldValue: originalInvoice.receivedAmount,
      newValue: newData.receivedAmount,
      type: 'payment',
    });
  }

  // Product changes
  const originalProductMap = new Map<string, any>();
  originalInvoice.products?.forEach((p: any) => {
    originalProductMap.set(p.series, p);
  });

  const updatedProductMap = new Map<string, any>();
  updatedProducts.forEach((p: any) => {
    updatedProductMap.set(p.series, p);
  });

  // Check for product changes
  Array.from(updatedProductMap.entries()).forEach(
    ([series, updatedProduct]) => {
      const originalProduct = originalProductMap.get(series);
      if (originalProduct) {
        if (originalProduct.quantity !== (updatedProduct as any).quantity) {
          changes.push({
            field: `product.${series}.quantity`,
            oldValue: originalProduct.quantity,
            newValue: (updatedProduct as any).quantity,
            type: 'product',
          });
        }
        if (
          originalProduct.productPrice !== (updatedProduct as any).productPrice
        ) {
          changes.push({
            field: `product.${series}.price`,
            oldValue: originalProduct.productPrice,
            newValue: (updatedProduct as any).productPrice,
            type: 'product',
          });
        }
      } else {
        changes.push({
          field: `product.${series}`,
          oldValue: null,
          newValue: updatedProduct,
          type: 'product',
        });
      }
    }
  );

  // Check for removed products
  Array.from(originalProductMap.entries()).forEach(
    ([series, originalProduct]) => {
      if (!updatedProductMap.has(series)) {
        changes.push({
          field: `product.${series}`,
          oldValue: originalProduct,
          newValue: null,
          type: 'product',
        });
      }
    }
  );

  // Date changes
  if (
    originalInvoice.createdDate?.getTime() !==
    new Date(newData.customDate || originalInvoice.createdDate).getTime()
  ) {
    changes.push({
      field: 'invoiceDate',
      oldValue: originalInvoice.createdDate,
      newValue: newData.customDate || originalInvoice.createdDate,
      type: 'date',
    });
  }

  return changes;
}
