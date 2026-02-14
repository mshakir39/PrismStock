'use server';
import { connectToMongoDB } from '@/app/libs/connectToMongoDB';
import { executeOperation } from '@/app/libs/executeOperation';
import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';

export async function PATCH(req: NextRequest) {
  try {
    await connectToMongoDB();
    const { invoiceId, paymentIndex } = await req.json();

    if (!invoiceId || paymentIndex === undefined) {
      return NextResponse.json(
        { error: 'Invoice ID and payment index are required' },
        { status: 400 }
      );
    }

    // Convert string ID to ObjectId
    const invoiceObjectId = new ObjectId(invoiceId);

    // Get the invoice
    const invoice: any = await executeOperation('invoices', 'findOne', {
      _id: invoiceObjectId,
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Check if additionalPayment exists and has the specified index
    if (
      !invoice.additionalPayment ||
      !Array.isArray(invoice.additionalPayment) ||
      paymentIndex >= invoice.additionalPayment.length ||
      paymentIndex < 0
    ) {
      return NextResponse.json(
        { error: 'Payment not found at specified index' },
        { status: 400 }
      );
    }

    // Get the payment to be reverted
    const paymentToRevert = invoice.additionalPayment[paymentIndex];
    const paymentAmount = parseFloat(paymentToRevert.amount) || 0;

    // Remove the payment from the array
    const updatedAdditionalPayments = [...invoice.additionalPayment];
    updatedAdditionalPayments.splice(paymentIndex, 1);

    // Restore the remaining amount
    const currentRemaining = parseFloat(invoice.remainingAmount) || 0;
    const newRemainingAmount = currentRemaining + paymentAmount;

    // Update payment status based on new remaining amount
    let paymentStatus = invoice.paymentStatus;
    const totalAmount = parseFloat(invoice.totalProductAmount) || 0;

    if (newRemainingAmount === totalAmount) {
      paymentStatus = 'pending';
    } else if (newRemainingAmount > 0 && newRemainingAmount < totalAmount) {
      paymentStatus = 'partial';
    } else if (newRemainingAmount === 0) {
      paymentStatus = 'paid';
    }

    // Update the invoice
    const updatedInvoice = {
      ...invoice,
      additionalPayment: updatedAdditionalPayments,
      remainingAmount: newRemainingAmount,
      paymentStatus: paymentStatus,
    };

    await executeOperation('invoices', 'updateOne', updatedInvoice);

    return NextResponse.json({
      message: 'Payment reverted successfully',
      revertedAmount: paymentAmount,
      newRemainingAmount: newRemainingAmount,
    });
  } catch (err: any) {
    console.error('Error reverting payment:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to revert payment' },
      { status: 500 }
    );
  }
}
