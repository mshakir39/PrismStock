import React, { useEffect, useState, useCallback } from 'react';
import Modal from '@/components/modal';
import InvoiceGrid from '@/components/invoice/InvoiceGrid';
import ProductDetailModal from '@/components/invoice/ProductDetailModal';
import EditInvoiceModal from '@/components/invoice/EditInvoiceModal';
import InvoicePreviewModal from '@/components/invoice/InvoicePreviewModal';
import { toast } from 'react-toastify';
import { PATCH } from '@/utils/api';
import { useAccordionData } from '@/components/invoice/useAccordionData';

interface CustomerInvoicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: any;
  categories?: any[];
  stock?: any[];
}

const CustomerInvoicesModal: React.FC<CustomerInvoicesModalProps> = ({
  isOpen,
  onClose,
  customer,
  categories = [],
  stock = [],
}) => {
  const { ...accordionMethods } = useAccordionData(categories, stock);

  const brandOptions = categories.map((category) => ({
    label: category.brandName || '',
    value: category.brandName || '',
  }));
  const [customerInvoices, setCustomerInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [subModalType, setSubModalType] = useState<string>('');
  const [modalData, setModalData] = useState<any>(null);

  const fetchCustomerInvoices = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = `/api/customers/${customer.id}/invoices`;
      const response = await fetch(url);
      if (response.ok) {
        const invoices = await response.json();
        setCustomerInvoices(invoices);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setCustomerInvoices([]);
      }
    } catch (error) {
      setCustomerInvoices([]);
    } finally {
      setIsLoading(false);
    }
  }, [customer]);

  useEffect(() => {
    if (isOpen) {
      fetchCustomerInvoices();
    }
  }, [isOpen, fetchCustomerInvoices]);

  const handleEditInvoice = async (data: any) => {
    try {
      setIsLoading(true);
      const response: any = await PATCH('api/invoice', data);
      if (response?.message) {
        toast.success(response?.message);
        await fetchCustomerInvoices();
      }
      if (response?.error) {
        toast.error(response?.error);
      }
      setIsLoading(false);
      setIsSubModalOpen(false);
    } catch (error) {
      setIsLoading(false);
    }
  };

  const handleCloseSubModal = () => {
    setIsSubModalOpen(false);
    setSubModalType('');
    setModalData(null);
  };

  // Calculate summary statistics
  const totalInvoices = customerInvoices.length;
  const totalAmount = customerInvoices.reduce((sum, invoice) => {
    const invoiceTotal =
      invoice.products?.reduce(
        (productSum: number, product: any) =>
          productSum + (product.totalPrice || 0),
        0
      ) || 0;
    return sum + invoiceTotal;
  }, 0);
  const totalRemaining = customerInvoices.reduce(
    (sum, invoice) => sum + (invoice.remainingAmount || 0),
    0
  );
  const paidInvoices = customerInvoices.filter(
    (invoice) => (invoice.remainingAmount || 0) === 0
  ).length;

  return (
    <div>
      {/* Main Modal - Prevent backdrop close when sub-modal is open */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title=''  // Hide default header since we have custom header
        dialogPanelClass='!w-[95%] !max-w-7xl'
        parentClass='!p-0'  // Remove default padding
        preventBackdropClose={isSubModalOpen} // Prevent closing when sub-modal is open
      >
        <div 
          className="rounded-t-lg text-white"
          style={{
            background: 'linear-gradient(to right, #193043, #1e3a5f, #234466)',
          }}
        >
          <h2 className="p-4 text-xl font-semibold">Invoices - {customer.customerName}</h2>
          <p className="px-4 pb-4 text-sm text-white text-opacity-80">View and manage all invoices for this customer</p>
        </div>
        <div className='mt-4 p-4'>
          {/* Customer Summary */}
          <div className='mb-6 rounded-lg bg-gray-50 p-4'>
            <div className='grid grid-cols-2 gap-4 text-sm md:grid-cols-4'>
              <div>
                <span className='font-medium text-gray-600'>
                  Total Invoices:
                </span>
                <div className='text-lg font-bold text-blue-600'>
                  {totalInvoices}
                </div>
              </div>
              <div>
                <span className='font-medium text-gray-600'>Total Amount:</span>
                <div className='text-lg font-bold text-green-600'>
                  Rs {totalAmount.toLocaleString()}
                </div>
              </div>
              <div>
                <span className='font-medium text-gray-600'>
                  Total Remaining:
                </span>
                <div
                  className={`text-lg font-bold ${totalRemaining > 0 ? 'text-red-600' : 'text-green-600'}`}
                >
                  Rs {totalRemaining.toLocaleString()}
                </div>
              </div>
              <div>
                <span className='font-medium text-gray-600'>
                  Paid Invoices:
                </span>
                <div className='text-lg font-bold text-green-600'>
                  {paidInvoices}/{totalInvoices}
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Grid */}
          {isLoading ? (
            <div className='flex items-center justify-center py-8'>
              <div className='text-gray-500'>Loading customer invoices...</div>
            </div>
          ) : (
            <InvoiceGrid
              invoices={customerInvoices}
              onCreateInvoice={() => {}}
              showCreateButton={false}
              onViewProducts={(data) => {
                setModalData(data);
                setSubModalType('productDetail');
                setIsSubModalOpen(true);
              }}
              onPreview={(data) => {
                setModalData(data);
                setSubModalType('preview');
                setIsSubModalOpen(true);
              }}
              onEditInvoice={(data) => {
                setModalData(data);
                setSubModalType('editInvoice');
                setIsSubModalOpen(true);
              }}
              onAddPayment={(data) => {
                setModalData({ ...data, isPaymentOnly: true });
                setSubModalType('addPayment');
                setIsSubModalOpen(true);
              }}
            />
          )}

          {!isLoading && customerInvoices.length === 0 && (
            <div className='py-8 text-center text-gray-500'>
              No invoices found for this customer.
            </div>
          )}
        </div>
      </Modal>

      {/* Sub-Modals */}
      {subModalType === 'productDetail' && (
        <ProductDetailModal
          isOpen={isSubModalOpen}
          onClose={handleCloseSubModal}
          data={modalData}
          categories={categories}
        />
      )}

      {subModalType === 'editInvoice' && (
        <EditInvoiceModal
          isOpen={isSubModalOpen}
          onClose={handleCloseSubModal}
          data={modalData}
          onSubmit={handleEditInvoice}
          isLoading={isLoading}
          categories={categories}
          customers={[]}
          brandOptions={brandOptions}
          stock={stock}
          accordionMethods={accordionMethods}
        />
      )}

      {subModalType === 'addPayment' && (
        <EditInvoiceModal
          isOpen={isSubModalOpen}
          onClose={handleCloseSubModal}
          data={modalData}
          onSubmit={handleEditInvoice}
          isLoading={isLoading}
          categories={categories}
          customers={[]}
          brandOptions={brandOptions}
          stock={stock}
          accordionMethods={accordionMethods}
        />
      )}

      {subModalType === 'preview' && (
        <InvoicePreviewModal
          isOpen={isSubModalOpen}
          onClose={handleCloseSubModal}
          data={modalData}
        />
      )}
    </div>
  );
};

export default CustomerInvoicesModal;
