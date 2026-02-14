import { notFound } from 'next/navigation';
import { Dancing_Script } from 'next/font/google';
import { convertDate } from '@/utils/convertTime';
import { getAllSum } from '@/utils/getTotalSum';
import { formatRupees } from '@/utils/formatRupees';
import { removeParentheses } from '@/utils/formatters';
import InvoiceTable from '@/components/InvoiceTable';

const dancingScript = Dancing_Script({ subsets: ['latin'] });

interface InvoicePageProps {
  params: Promise<{
    invoiceId: string;
  }>;
}

const columns = [
  { label: 'ID', renderCell: (_: any, index: number) => index + 1 },
  {
    label: 'Name',
    renderCell: (item: any) => {
      const details = item?.batteryDetails;
      const name = details
        ? `${item.brandName} - ${details.name} (${details.plate}, ${details.ah}AH${details.type ? `, ${details.type}` : ''})`
        : `${item.brandName} - ${item.series}`;
      return (
        <span className='block max-w-[260px] break-words'>
          {removeParentheses(name)}
        </span>
      );
    },
  },
  { label: 'Qty', renderCell: (item: any) => item.quantity },
  { label: 'Price', renderCell: (item: any) => `Rs ${item.productPrice}` },
  { label: 'Amount', renderCell: (item: any) => `Rs ${item.totalPrice}` },
];

export async function generateMetadata({ params }: InvoicePageProps) {
  try {
    const { invoiceId } = await params;
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      (process.env.NODE_ENV === 'production'
        ? 'https://prismstock.com'
        : 'http://localhost:3000');

    const res = await fetch(`${baseUrl}/api/invoice/${invoiceId}`);
    const result = await res.json();

    if (!result.success) {
      return { title: 'Invoice Not Found' };
    }

    return {
      title: `Invoice #${result.data.invoiceNo} - Prism Stock`,
      description: `Invoice for ${result.data.customerName}`,
    };
  } catch {
    return { title: 'Invoice - Prism Stock' };
  }
}

export default async function InvoicePage({ params }: InvoicePageProps) {
  let result;

  try {
    const { invoiceId } = await params;
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      (process.env.NODE_ENV === 'production'
        ? 'https://prismstock.com'
        : 'http://localhost:3000');

    const res = await fetch(`${baseUrl}/api/invoice/${invoiceId}`, {
      cache: 'no-store',
    });

    result = await res.json();
    if (!result.success) notFound();
  } catch {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50'>
        <div className='rounded bg-white p-6 text-center shadow'>
          <h1 className='text-xl font-bold text-red-600'>Error</h1>
          <p>Failed to load invoice</p>
        </div>
      </div>
    );
  }

  const invoice = result.data;

  const footerData = {
    ID: 'Total',
    Quantity: getAllSum(invoice?.products, 'quantity'),
    Amount: `Rs ${getAllSum(invoice?.products, 'totalPrice')}`,
  };

  return (
    <div className='min-h-screen bg-gray-50  px-2'>
      <div className='mx-auto h-screen max-w-5xl rounded-lg bg-white shadow-lg print:bg-white print:shadow-none'>
        <div className='p-4 sm:p-6'>
          {/* Header */}
          <div className='mb-2 text-2xl font-bold uppercase sm:text-4xl'>
            Invoice
          </div>
          <div className='mb-4 text-right font-bold'>
            No: Inv-{invoice?.invoiceNo}
          </div>

          {/* From / To */}
          <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
            <div>
              <div className='font-bold'>Invoice From:</div>
              <p className='text-sm text-gray-600'>
                PRISM STOCK-DG KHAN <br />
                +923349627745, +923215392445 <br />
                General Bus Stand, near Badozai Market <br />
                Owner@prismstock.com
              </p>
            </div>

            <div className='sm:text-right'>
              <div className='font-bold'>Invoice To:</div>
              <p className='text-sm text-gray-600'>
                {removeParentheses(invoice?.customerName)} <br />
                {invoice?.customerContactNumber} <br />
                {invoice?.customerAddress}
              </p>
            </div>
          </div>

          {/* Date */}
          <div className='mt-4 text-sm'>
            <span className='font-bold'>Date:</span>{' '}
            {invoice?.createdDate
              ? convertDate(invoice.createdDate).dateTime
              : ''}
          </div>

          {/* Table */}
          <div className='mt-6 overflow-x-auto'>
            <InvoiceTable
              data={invoice?.products}
              columns={columns}
              footerData={footerData}
            />
          </div>

          {/* Bottom Section */}
          <div className='mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2'>
            {/* Left */}
            <div className='space-y-2 text-sm'>
              <div>
                <b>Amount in Words:</b>{' '}
                {formatRupees(getAllSum(invoice?.products, 'totalPrice'))}{' '}
                Rupees Only
              </div>

              <div>
                <b>Payment Method:</b> {invoice?.paymentMethod?.join(' + ')}
              </div>

              {invoice?.products?.map((p: any, i: number) => (
                <div key={i}>
                  <b>Warranty ({p.series || p.batteryDetails?.name}):</b>{' '}
                  {p.warrentyCode}
                </div>
              ))}
            </div>

            {/* Right Totals */}
            <div className='space-y-2 text-sm'>
              <div className='flex justify-between bg-[#021B3B] p-3 text-white'>
                <span>SubTotal</span>
                <span>Rs {getAllSum(invoice?.products, 'totalPrice')}</span>
              </div>

              {Number(invoice?.batteriesRate) > 0 && (
                <div className='flex justify-between p-3'>
                  <span>
                    {invoice?.batteriesCountAndWeight || 'Old Battery'}
                  </span>
                  <span>- Rs {invoice?.batteriesRate}</span>
                </div>
              )}

              {Number(invoice?.receivedAmount) > 0 && (
                <div className='flex justify-between p-3'>
                  <span>Received</span>
                  <span>- Rs {invoice?.receivedAmount}</span>
                </div>
              )}

              {invoice?.additionalPayment?.map((p: any, i: number) => {
                const { dateTime } = convertDate(p.addedDate);
                return (
                  <div key={i} className='flex justify-between p-3'>
                    <span>Received ({dateTime})</span>
                    <span>- Rs {p.amount}</span>
                  </div>
                );
              })}

              <div className='mt-2 flex justify-between bg-[#021B3B] p-3 text-white'>
                <span>
                  {invoice?.remainingAmount === 0 ? 'Total' : 'Remaining'}
                </span>
                <span>
                  {invoice?.remainingAmount === 0
                    ? 'Paid'
                    : `Rs ${invoice?.remainingAmount}`}
                </span>
              </div>
            </div>
          </div>

          <div
            className={`mt-12 text-center text-4xl sm:text-6xl ${dancingScript.className}`}
          >
            Thank You!
          </div>
        </div>
      </div>
    </div>
  );
}
