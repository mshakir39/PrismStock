import React from 'react';
import Modal from '@/components/modal';

interface ProductsDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSaleInfo: any;
  selectedSaleProducts: any[];
}

const ProductsDetailModal: React.FC<ProductsDetailModalProps> = ({
  isOpen,
  onClose,
  selectedSaleInfo,
  selectedSaleProducts,
}) => {
  return (
    <Modal
      size='large'
      isOpen={isOpen}
      onClose={onClose}
      title={`Products - ${selectedSaleInfo?.customerName || 'Sale Details'}`}
    >
      <div className='mt-4'>
        {/* Sale Info */}
        {selectedSaleInfo && (
          <div className='mb-4 rounded-lg bg-gray-50 p-3'>
            <div className='grid grid-cols-2 gap-4 text-sm'>
              <div>
                <span className='font-medium text-gray-600'>Date:</span>
                <div className='text-gray-900'>
                  {new Date(selectedSaleInfo.date).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  })}
                </div>
              </div>
              <div>
                <span className='font-medium text-gray-600'>Total Amount:</span>
                <div className='font-semibold text-gray-900'>
                  Rs {selectedSaleInfo.totalAmount?.toLocaleString() || 0}
                </div>
              </div>
              <div>
                <span className='font-medium text-gray-600'>
                  Payment Method:
                </span>
                <div className='text-gray-900'>
                  {selectedSaleInfo.paymentMethod?.join(', ') || 'N/A'}
                </div>
              </div>
              <div>
                <span className='font-medium text-gray-600'>Total Items:</span>
                <div className='text-gray-900'>
                  {selectedSaleProducts.reduce(
                    (sum, p) => sum + (Number(p.quantity) || 0),
                    0
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Products Table */}
        <div className='space-y-2'>
          <h3 className='mb-3 font-medium text-gray-900'>Products Sold</h3>
          <div className='overflow-hidden rounded-lg border border-gray-200'>
            {/* Scrollable table container for many products */}
            <div className='max-h-96 overflow-y-auto'>
              <table className='min-w-full divide-y divide-gray-200'>
                <thead className='sticky top-0 z-10 bg-gray-50'>
                  <tr>
                    <th className='px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
                      Product
                    </th>
                    <th className='px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
                      Warranty Code
                    </th>
                    <th className='px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
                      Quantity
                    </th>
                    <th className='px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
                      Price/Unit
                    </th>
                    <th className='px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-200 bg-white'>
                  {selectedSaleProducts.map((product, index) => (
                    <tr key={index} className='hover:bg-gray-50'>
                      <td className='px-4 py-3 text-sm'>
                        <div className='font-medium text-gray-900'>
                          {product.productName ||
                            product.name ||
                            product.series ||
                            product.batteryDetails?.name ||
                            'Unknown Product'}
                        </div>
                        {product.batteryDetails && (
                          <div className='text-xs text-gray-500'>
                            {product.batteryDetails.plate} plates,{' '}
                            {product.batteryDetails.ah}AH
                            {product.batteryDetails.type &&
                              `, ${product.batteryDetails.type}`}
                          </div>
                        )}
                      </td>
                      <td className='px-4 py-3 text-sm text-gray-900'>
                        {product.warrentyCode || '-'}
                      </td>
                      <td className='px-4 py-3 text-sm text-gray-900'>
                        {Number(product.quantity) || 0}
                      </td>
                      <td className='px-4 py-3 text-sm text-gray-900'>
                        Rs {Number(product.productPrice || 0).toLocaleString()}
                      </td>
                      <td className='px-4 py-3 text-sm font-medium text-gray-900'>
                        Rs {Number(product.totalPrice || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Sticky footer outside scroll area */}
            <div className='border-t border-gray-200 bg-gray-50'>
              <table className='min-w-full'>
                <tfoot>
                  <tr>
                    <td
                      colSpan={4}
                      className='px-4 py-3 text-right text-sm font-medium text-gray-900'
                    >
                      Total ({selectedSaleProducts.length} items):
                    </td>
                    <td className='px-4 py-3 text-sm font-bold text-gray-900'>
                      Rs{' '}
                      {selectedSaleProducts
                        .reduce(
                          (sum, p) => sum + (Number(p.totalPrice) || 0),
                          0
                        )
                        .toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ProductsDetailModal;
