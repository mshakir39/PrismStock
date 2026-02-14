import { convertDate } from './convertTime';
import { getAllSum } from './getTotalSum';
import { removeParentheses } from './formatters';

interface PrinterData {
  invoiceNo: string;
  customerName: string;
  customerContactNumber: string;
  customerAddress: string;
  products: any[];
  paymentMethod: string[];
  receivedAmount: string;
  remainingAmount: number;
  createdDate: string;
  additionalPayment?: any[];
  batteriesCountAndWeight?: string;
  batteriesRate?: string;
  clientData?: {
    name: string;
    phone: string;
    address: string;
    email: string;
  };
}

class ThermalPrinter {
  // Print invoice using browser print functionality with thermal printer formatting
  async printInvoice(data: PrinterData): Promise<void> {
    // Create the receipt content
    const receiptContent = this.createReceiptContent(data);

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Popup blocked. Please allow popups for this site.');
    }

    // Write the HTML content with thermal printer styling
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${data.invoiceNo}</title>
        <style>
          @media print {
            @page {
              size: 80mm auto;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              width: 80mm;
              font-family: 'Courier New', monospace;
              font-size: 12px;
              font-weight: 900;
              line-height: 1.1;
            }
            .receipt {
              width: 80mm;
              max-width: 80mm;
              white-space: pre;
              word-wrap: normal;
              overflow-wrap: normal;
              margin: 0;
              padding: 5px;
            }
          }
          body {
            font-family: 'Courier New', monospace;
            font-size: 10px;
            line-height: 1.1;
            margin: 0;
            padding: 5px;
            width: 80mm;
            max-width: 80mm;
          }
          .receipt {
            width: 100%;
            white-space: pre;
            word-wrap: normal;
            overflow-wrap: normal;
          }
        </style>
      </head>
      <body>
        <div class="receipt">
${receiptContent}
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();

    // Simple print - no loops, no complex logic
    setTimeout(() => {
      printWindow.print();
      setTimeout(() => {
        printWindow.close();
      }, 1000);
    }, 500);
  }

  private createReceiptContent(data: PrinterData): string {
    const width = 48; // Standard thermal printer width

    const centerText = (text: string): string => {
      const spaceCount = Math.floor((width - text.length) / 2);
      const spaces = ' '.repeat(Math.max(0, spaceCount));
      return `${spaces}${text}\n`;
    };

    const createRow = (left: string, right: string): string => {
      const spaceCount = width - left.length - right.length;
      const spaces = ' '.repeat(Math.max(0, spaceCount));
      return `${left}${spaces}${right}\n`;
    };

    const line = (char: string = '-'): string => `${char.repeat(width)}\n`;

    const wrapText = (text: string, maxWidth: number = width): string => {
      if (text.length <= maxWidth) {
        return text;
      }
      // Split text into chunks that fit within maxWidth
      const chunks = [];
      for (let i = 0; i < text.length; i += maxWidth) {
        chunks.push(text.substring(i, i + maxWidth));
      }
      return chunks.join('\n');
    };

    let content = '';

    // Header
    content += centerText('INVOICE');
    content += centerText(`INV-${data.invoiceNo}`);
    content += line('=');

    // Company info
    content += centerText(data.clientData?.name || 'PRISM STOCK-DG KHAN');
    content += centerText(data.clientData?.phone || '+923349627745, +923215392445');
    content += centerText(data.clientData?.address?.split(',')[0] || 'General Bus Stand, near Badozai Market');
    content += centerText(data.clientData?.address?.split(',')[1] || 'Dera Ghazi Khan');
    content += centerText(data.clientData?.email || 'Owner@prismstock.com');
    content += line('-');

    // Customer info
    content += 'BILL TO:\n';
    content += `${wrapText(removeParentheses(data.customerName))}\n`;
    if (data.customerContactNumber) {
      content += `${wrapText(data.customerContactNumber)}\n`;
    }
    if (data.customerAddress) {
      content += `${wrapText(data.customerAddress)}\n`;
    }
    content += line('-');

    // Date
    content += `Date: ${convertDate(data.createdDate).dateTime}\n`;
    content += line('=');

    // Products header aligned with column values
    const noWidth = 3; // "No" column width
    const descWidth = 18; // Description column width
    const qtyWidth = 5; // Quantity column width
    const rateWidth = 9; // Rate column width
    const totalWidth = 9; // Total column width

    // Create header with proper alignment
    const noHeader = 'No'.padStart(noWidth);
    const descHeader = 'Description'.padEnd(descWidth);
    const qtyHeader = 'Qty'.padStart(qtyWidth);
    const rateHeader = 'Rate'.padStart(rateWidth);
    const totalHeader = 'Total'.padStart(totalWidth);

    content += `${noHeader} ${descHeader} ${qtyHeader} ${rateHeader} ${totalHeader}\n`;
    content += line('-');

    // Products with proper column alignment
    data.products.forEach((item: any, index: number) => {
      let name = item?.batteryDetails
        ? `${item.brandName || ''}-${item.batteryDetails.name || item.productName || ''}`
        : `${item.brandName || ''}-${item.productName || item.series || ''}`;

      // Add battery specifications if available
      if (item?.batteryDetails) {
        const specs = [];
        if (item.batteryDetails.plate)
          specs.push(`${item.batteryDetails.plate} plates`);
        if (item.batteryDetails.ah) specs.push(`${item.batteryDetails.ah}AH`);
        if (item.batteryDetails.type) specs.push(item.batteryDetails.type);

        if (specs.length > 0) {
          name += ` (${specs.join(', ')})`;
        }
      }

      // Format each column with proper alignment
      const no = String(index + 1).padStart(noWidth);
      const description =
        name.length > descWidth
          ? name.substring(0, descWidth - 3) + '...'
          : name.padEnd(descWidth);
      const qty = String(item.quantity).padStart(qtyWidth);
      const rate = String(item.productPrice).padStart(rateWidth);
      const total = String(item.totalPrice).padStart(totalWidth);

      // Create the line with proper spacing
      const line = `${no} ${description} ${qty} ${rate} ${total}`;

      // Check if line fits within width
      if (line.length <= width) {
        content += `${line}\n`;
      } else {
        // If line is too long, truncate description further
        const availableWidth =
          width - noWidth - 1 - qtyWidth - 1 - rateWidth - 1 - totalWidth - 1; // account for spaces
        const truncatedDesc =
          name.substring(0, Math.max(0, availableWidth - 3)) + '...';
        content += `${no} ${truncatedDesc.padEnd(availableWidth)} ${qty} ${rate} ${total}\n`;
      }
    });

    // Totals
    const grandTotal = getAllSum(data.products, 'totalPrice');
    content += line('=');
    content += createRow('TOTAL:', `Rs ${grandTotal}`);

    // Batteries count and weight (if available)
    if (data.batteriesCountAndWeight && data.batteriesRate) {
      content += createRow(
        data.batteriesCountAndWeight,
        `Rs ${data.batteriesRate}`
      );
    }

    // Payment details
    if (data.receivedAmount && data.receivedAmount !== '0') {
      content += createRow('RECEIVED:', `Rs ${data.receivedAmount}`);
    }

    // Additional payments
    if (data.additionalPayment && data.additionalPayment.length > 0) {
      data.additionalPayment.forEach((payment: any) => {
        const paymentDate = convertDate(payment.addedDate).dateTime;
        const paymentMethod = payment.paymentMethod
          ? ` (${payment.paymentMethod.join(' + ')})`
          : '';
        content += createRow(
          `Received ${paymentDate}${paymentMethod}:`,
          `Rs ${payment.amount}`
        );
      });
    }

    if (data.remainingAmount > 0) {
      content += createRow('BALANCE:', `Rs ${data.remainingAmount}`);
    }

    // Final total line
    content += line('=');
    if (data.remainingAmount === 0) {
      content += createRow('TOTAL:', 'PAID');
    } else {
      content += createRow('TOTAL REMAINING:', `Rs ${data.remainingAmount}`);
    }

    // Payment method
    content += line('-');
    content += `${wrapText(`Payment: ${data.paymentMethod.join(' + ')}`)}\n`;

    // Warranty codes
    content += 'Warranty Codes:\n';
    data.products.forEach((p: any) => {
      const productName = p.productName || p.series || p.batteryDetails?.name || '';
      const warrantyCode = p.warrentyCode || '';

      if (warrantyCode) {
        const warrantyLine = `(${productName}): ${warrantyCode}`;
        content += `${wrapText(warrantyLine)}\n`;
      }
    });

    // Footer
    content += '\n\n';
    content += centerText('Thank You!');
    content += centerText('Visit Again');
    content += '\n\n\n';

    return content;
  }
}

// Main function to print with thermal printer
export const printWithThermalPrinter = async (invoiceData: PrinterData) => {
  const printer = new ThermalPrinter();
  await printer.printInvoice(invoiceData);
};

export { ThermalPrinter };
