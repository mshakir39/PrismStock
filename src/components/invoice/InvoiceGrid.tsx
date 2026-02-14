'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import { revalidatePathCustom } from '@/actions/revalidatePathCustom';
import { convertDate } from '@/utils/convertTime';
import { AgGridReact, AgGridProvider } from 'ag-grid-react';
import { AllCommunityModule } from 'ag-grid-community';
import { createPortal } from 'react-dom';
import Modal from '@/components/modal';
import Button from '@/components/button';
import { VscPreview } from 'react-icons/vsc';

// AG Grid modules
const modules = [AllCommunityModule];

interface InvoiceGridProps {
  invoices: any[];
  onCreateInvoice: () => void;
  onViewProducts: (data: any) => void;
  onPreview: (data: any) => void;
  onEditInvoice: (data: any) => void;
  onAddPayment: (data: any) => void;
  showCreateButton?: boolean;
}

const InvoiceGrid: React.FC<InvoiceGridProps> = ({
  invoices,
  onCreateInvoice,
  onViewProducts,
  onPreview,
  onEditInvoice,
  onAddPayment,
  showCreateButton = true,
}) => {
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    invoiceId: string;
    invoiceNo: string;
  }>({
    isOpen: false,
    invoiceId: '',
    invoiceNo: '',
  });

  const [revertPaymentModal, setRevertPaymentModal] = useState<{
    isOpen: boolean;
    invoiceId: string;
    invoiceNo: string;
    payments: any[];
  }>({
    isOpen: false,
    invoiceId: '',
    invoiceNo: '',
    payments: [],
  });

  // Portal-based action menu to escape AG Grid context
  const SimpleActionMenu: React.FC<{ invoice: any }> = ({ invoice }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const buttonRef = useRef<HTMLDivElement>(null);

    const toggleMenu = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setPosition({
          top: rect.bottom + window.scrollY,
          left: rect.right + window.scrollX - (rect.width / 2) - 150
        });
      }
      
      setIsOpen(!isOpen);
    };

    const handleAction = (action: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsOpen(false);
      
      if (action === 'preview') {
        onPreview(invoice);
      } else if (action === 'edit') {
        onEditInvoice(invoice);
      } else if (action === 'addPayment' && invoice.remainingAmount > 0) {
        onAddPayment(invoice);
      } else if (action === 'revertPayment' && invoice.additionalPayment?.length > 0) {
        handleRevertPaymentClick(invoice);
      } else if (action === 'delete') {
        handleDeleteClick(invoice.id, invoice.invoiceNo);
      }
    };

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        if (!target.closest('[data-action-menu]')) {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [isOpen]);

    return (
      <>
        <div onClick={(e) => e.stopPropagation()}>
          <div className="w-6 h-6 flex items-center justify-center">
            <div
              ref={buttonRef}
              onClick={toggleMenu}
              className="p-1 hover:bg-gray-100 rounded-full cursor-pointer relative"
              style={{ userSelect: 'none' }}
            >
              {isOpen ? (
                <svg className="h-5 w-5 text-gray-700" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293 4.293a1 1 0 01-1.414 0l-4.293 4.293a1 1 0 00-1.414-1.414z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              )}
            </div>
          </div>
        </div>

        {isOpen && createPortal(
          <div 
            className="fixed z-[9999] w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5"
            data-action-menu
            style={{ 
              top: `${position.top}px`,
              left: `${position.left}px`
            }}
          >
            <div className="py-1">
              <div
                onClick={(e) => handleAction('preview', e)}
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                <VscPreview className="mr-3 h-4 w-4 text-gray-400" />
                Preview
              </div>
              <div
                onClick={(e) => handleAction('edit', e)}
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                <svg className="mr-3 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.829-2.828z" />
                </svg>
                Edit
              </div>
              {invoice.remainingAmount > 0 && (
                <div
                  onClick={(e) => handleAction('addPayment', e)}
                  className="flex items-center px-4 py-2 text-sm text-emerald-600 hover:bg-gray-100 cursor-pointer"
                >
                  <svg className="mr-3 h-4 w-4 text-emerald-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
                  </svg>
                  Add Payment
                </div>
              )}
              {invoice.additionalPayment?.length > 0 && (
                <div
                  onClick={(e) => handleAction('revertPayment', e)}
                  className="flex items-center px-4 py-2 text-sm text-orange-600 hover:bg-gray-100 cursor-pointer"
                >
                  <svg className="mr-3 h-4 w-4 text-orange-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                  Revert Payment
                </div>
              )}
              <div
                onClick={(e) => handleAction('delete', e)}
                className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 cursor-pointer"
              >
                <svg className="mr-3 h-4 w-4 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Delete
              </div>
            </div>
          </div>,
          document.body
        )}
      </>
    );
  };

  const handleDeleteClick = useCallback(
    (invoiceId: string, invoiceNo: string) => {
      setDeleteModal({
        isOpen: true,
        invoiceId,
        invoiceNo,
      });
    },
    []
  );

  const handleRevertPaymentClick = useCallback((invoice: any) => {
    setRevertPaymentModal({
      isOpen: true,
      invoiceId: invoice.id,
      invoiceNo: invoice.invoiceNo,
      payments: invoice.additionalPayment || [],
    });
  }, []);

  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch('/api/invoice', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: deleteModal.invoiceId }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`Invoice ${deleteModal.invoiceNo} deleted successfully`);
        // Revalidate the path to refresh data
        await revalidatePathCustom('/dashboard/invoices');
      } else {
        toast.error(result.error || 'Failed to delete invoice');
      }
    } catch (error) {
      toast.error('Failed to delete invoice');
    } finally {
      setDeleteModal({ isOpen: false, invoiceId: '', invoiceNo: '' });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, invoiceId: '', invoiceNo: '' });
  };

  // Utility function to clean up stock data (run this once to fix string/number issues)
  const cleanupStockData = async () => {
    try {
      const response = await fetch('/api/stock', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'cleanupStockData' }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(result.message);
      } else {
        toast.error(result.error || 'Failed to cleanup stock data');
      }
    } catch (error) {
      toast.error('Failed to cleanup stock data');
    }
  };

  return (
    <AgGridProvider modules={modules}>
      {invoices.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <div className="max-w-md mx-auto">
            {/* Gradient Background Circle */}
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-gradient-to-br from-[#f0f4f8] to-[#e1e7ed] rounded-full p-8"></div>
              <div className="relative bg-white rounded-full p-12 shadow-lg">
                <svg className="mx-auto h-20 w-20 text-[#193043]" fill="currentColor" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              No Invoices Yet
            </h3>

            {/* Description */}
            <p className="text-gray-600 mb-8 leading-relaxed">
              Start managing your sales by creating your first invoice. Track payments, organize customer information, and streamline your billing process.
            </p>

            {/* Call to Action Button */}
            <div className="flex justify-center">
              <Button
                text="Create Your First Invoice"
                onClick={onCreateInvoice}
                variant="fill"
                className="bg-[#193043] hover:bg-[#2a4156] text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              />
            </div>

            {/* Additional Tips */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-2">💡 Pro Tips:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Organize invoices by customer for easy tracking</li>
                <li>• Record accurate payment information</li>
                <li>• Use categories to group similar products</li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">
                  Invoices ({invoices.length})
                </h2>
                {showCreateButton && (
                  <Button
                    text="Create Invoice"
                    onClick={onCreateInvoice}
                    variant="fill"
                  />
                )}
              </div>
            </div>

            <div className="ag-theme-alpine h-full">
              <AgGridReact
                rowData={invoices}
                columnDefs={[
                  {
                    headerName: 'Invoice #',
                    field: 'invoiceNo',
                    cellRenderer: (params: any) => (
                      <div className="font-medium text-gray-900">{params.value || ''}</div>
                    ),
                    sortable: true,
                    filter: true,
                    resizable: true,
                    flex: 1,
                    minWidth: 120,
                  },
                  {
                    headerName: 'Customer Name',
                    field: 'customerName',
                    cellRenderer: (params: any) => (
                      <div className="font-medium text-gray-900">{params.value || ''}</div>
                    ),
                    sortable: true,
                    filter: true,
                    resizable: true,
                    flex: 1,
                    minWidth: 150,
                  },
                  {
                    headerName: 'Contact #',
                    field: 'customerContactNumber',
                    cellRenderer: (params: any) => (
                      <div className="text-gray-500">{params.value || ''}</div>
                    ),
                    sortable: true,
                    filter: true,
                    resizable: true,
                    flex: 1,
                    minWidth: 120,
                  },
                  {
                    headerName: 'Payment Method',
                    field: 'paymentMethod',
                    cellRenderer: (params: any) => (
                      <div className="text-gray-500">{params.value || ''}</div>
                    ),
                    sortable: true,
                    filter: true,
                    resizable: true,
                    flex: 1,
                    minWidth: 130,
                  },
                  {
                    headerName: 'Created Date',
                    field: 'createdDate',
                    cellRenderer: (params: any) => {
                      const { dateTime } = convertDate(params.value);
                      return <div className="text-gray-500">{dateTime}</div>;
                    },
                    sortable: true,
                    filter: true,
                    resizable: true,
                    flex: 1,
                    minWidth: 140,
                  },
                  {
                    headerName: 'Remaining Amount',
                    field: 'remainingAmount',
                    cellRenderer: (params: any) => (
                      <div className="text-gray-500">
                        {params.value !== 0 ? `Rs ${params.value}` : ''}
                      </div>
                    ),
                    sortable: true,
                    filter: 'agNumberColumnFilter',
                    resizable: true,
                    flex: 1,
                    minWidth: 130,
                  },
                  {
                    headerName: 'Products',
                    field: 'products',
                    cellRenderer: (params: any) => (
                      <span
                        className="cursor-pointer text-blue-500 hover:text-blue-700"
                        title="Click here for Detail"
                        onClick={(e) => {
                          e.stopPropagation();
                          const products = params.value?.map((product: any, index: number) => ({ ...product, id: index })) || [];
                          onViewProducts(products);
                        }}
                      >
                        Click here for Detail
                      </span>
                    ),
                    sortable: false,
                    filter: false,
                    resizable: true,
                    flex: 1,
                    minWidth: 140,
                  },
                  {
                    cellRenderer: (params: any) => <SimpleActionMenu invoice={params.data} />,
                    headerName: 'Actions',
                    sortable: false,
                    filter: false,
                    resizable: true,
                    flex: 1,
                    minWidth: 120,
                  },
                ]}
                defaultColDef={{
                  flex: 1,
                  minWidth: 100,
                  resizable: true,
                }}
                pagination={true}
                paginationPageSize={10}
                domLayout="autoHeight"
                animateRows={true}
                enableRangeSelection={true}
                rowSelection="single"
                suppressCellFocus={true}
              />
            </div>
          </div>
        </>
      )}

      <Modal
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        title={`Delete Invoice ${deleteModal.invoiceNo}`}
      >
        <div className='space-y-4'>
          <p className='text-gray-700'>
            Are you sure you want to <strong>completely revert</strong> invoice{' '}
            <strong>{deleteModal.invoiceNo}</strong>?
          </p>
          <div className='rounded-lg border border-yellow-200 bg-yellow-50 p-4'>
            <h4 className='mb-2 font-semibold text-yellow-800'>
              This will completely reverse everything:
            </h4>
            <ul className='list-inside list-disc space-y-1 text-yellow-700'>
              <li>
                <strong>Restore stock quantities</strong> - All sold items go
                back to inventory
              </li>
              <li>
                <strong>Delete sales record</strong> - Remove from sales history
              </li>
              <li>
                <strong>Delete invoice record</strong> - Remove from invoice
                list
              </li>
              <li>
                <strong>Preserve warranty data</strong> - Keep warranty info for
                customer service
              </li>
              <li>
                <strong>Archive for audit</strong> - Keep backup for record
                keeping
              </li>
            </ul>
          </div>
          <div className='rounded-lg border border-red-200 bg-red-50 p-3'>
            <p className='font-medium text-red-700'>
              ⚠️ This action will completely undo the invoice as if it never
              existed!
            </p>
          </div>

          <div className='flex justify-end space-x-3 pt-4'>
            <Button
              variant='outline'
              text='Cancel'
              onClick={handleDeleteCancel}
            />
            <Button
              variant='fill'
              text='Delete Invoice'
              onClick={handleDeleteConfirm}
              className='bg-red-600 hover:bg-red-700'
            />
          </div>
        </div>
      </Modal>
      <RevertPaymentModal
        isOpen={revertPaymentModal.isOpen}
        onClose={() =>
          setRevertPaymentModal({
            isOpen: false,
            invoiceId: '',
            invoiceNo: '',
            payments: [],
          })
        }
        invoiceId={revertPaymentModal.invoiceId}
        invoiceNo={revertPaymentModal.invoiceNo}
        payments={revertPaymentModal.payments}
      />
    </AgGridProvider>
  );
};

const RevertPaymentModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  invoiceId: string;
  invoiceNo: string;
  payments: any[];
}> = ({ isOpen, onClose, invoiceId, invoiceNo, payments }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleRevertPayment = async (paymentIndex: number) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/invoice/revert-payment', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoiceId,
          paymentIndex,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(
          `Payment of Rs ${result.revertedAmount} reverted successfully. New remaining: Rs ${result.newRemainingAmount}`
        );
        onClose();
        window.location.reload();
      } else {
        toast.error(result.error || 'Failed to revert payment');
      }
    } catch (error: any) {
      toast.error('An error occurred while reverting payment');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: string) => {
    const { dateTime } = convertDate(date);
    return dateTime;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Revert Payment - Invoice #${invoiceNo}`}
      size='medium'
    >
      <div className='space-y-4'>
        <div className='rounded-lg border border-orange-200 bg-orange-50 p-4'>
          <p className='text-sm text-orange-800'>
            ℹ️ <strong>Note:</strong> Reverting a payment will restore the
            invoice&apos;s remaining balance and remove the payment from
            history.
          </p>
        </div>

        {payments.length === 0 ? (
          <p className='text-center text-gray-500'>
            No additional payments found.
          </p>
        ) : (
          <div className='space-y-3'>
            <h4 className='font-semibold text-gray-700'>
              Select a payment to revert:
            </h4>
            {payments.map((payment, index) => (
              <div
                key={index}
                className='flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:bg-gray-50'
              >
                <div className='flex-1'>
                  <div className='font-medium text-gray-900'>
                    Rs {payment.amount}
                  </div>
                  <div className='text-sm text-gray-500'>
                    {formatDate(payment.addedDate)}
                  </div>
                  {payment.paymentMethod && (
                    <div className='mt-1 text-xs text-gray-600'>
                      Payment Method: {payment.paymentMethod.join(' + ')}
                    </div>
                  )}
                </div>
                <Button
                  variant='outline'
                  text='Revert'
                  onClick={() => handleRevertPayment(index)}
                  className='border-orange-500 text-orange-600 hover:bg-orange-50'
                  disabled={isLoading}
                  isPending={isLoading}
                />
              </div>
            ))}
          </div>
        )}

        <div className='flex justify-end pt-4'>
          <Button
            variant='outline'
            text='Close'
            onClick={onClose}
            disabled={isLoading}
          />
        </div>
      </div>
    </Modal>
  );
};

export default InvoiceGrid;
