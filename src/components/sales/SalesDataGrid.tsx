import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AgGridReact, AgGridProvider } from 'ag-grid-react';
import { AllCommunityModule } from 'ag-grid-community';

// AG Grid modules
const modules = [AllCommunityModule];

interface SalesDataGridProps {
  filteredSales: any[];
  onViewProducts: (sale: any) => void;
}

const SalesDataGrid: React.FC<SalesDataGridProps> = ({
  filteredSales,
  onViewProducts,
}) => {
  // Portal-based action menu to escape AG Grid context
  const SimpleActionMenu: React.FC<{ sale: any }> = ({ sale }) => {
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

      if (action === 'viewProducts') {
        onViewProducts(sale);
      }
    };

    React.useEffect(() => {
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
                onClick={(e) => handleAction('viewProducts', e)}
                className="flex items-center px-4 py-2 text-sm text-blue-600 hover:bg-gray-100 cursor-pointer"
              >
                <svg className="mr-3 h-4 w-4 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
                View Products
              </div>
            </div>
          </div>,
          document.body
        )}
      </>
    );
  };

  const formatProductsCell = (params: any) => {
    const products = params.value || [];
    const productCount = products.length;

    if (productCount === 0) {
      return <div className="text-gray-400">No products</div>;
    }

    if (productCount === 1) {
      const product = products[0];
      return (
        <div className="text-sm">
          <div>
            {product.series || product.batteryDetails?.name} × {product.quantity}
          </div>
          {product.warrentyCode && (
            <div className="text-xs text-gray-500">
              Warranty: {product.warrentyCode}
            </div>
          )}
        </div>
      );
    }

    // For multiple products, show clickable summary
    const firstProduct = products[0];
    const remainingCount = productCount - 1;

    return (
      <div
        className="cursor-pointer rounded p-1 text-sm transition-colors hover:bg-gray-50"
        onClick={() => onViewProducts(params.data)}
      >
        <div>
          <div className="font-medium text-blue-600">
            {firstProduct.series || firstProduct.batteryDetails?.name} × {firstProduct.quantity}
          </div>
          {firstProduct.warrentyCode && (
            <div className="text-xs text-gray-500">
              Warranty: {firstProduct.warrentyCode}
            </div>
          )}
        </div>
        {remainingCount > 0 && (
          <div className="mt-1 text-xs text-gray-500">
            +{remainingCount} more product{remainingCount > 1 ? 's' : ''} - Click to view all
          </div>
        )}
      </div>
    );
  };

  return (
    <AgGridProvider modules={modules}>
      {filteredSales.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <div className="max-w-md mx-auto">
            {/* Gradient Background Circle */}
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-gradient-to-br from-[#f0f4f8] to-[#e1e7ed] rounded-full p-8"></div>
              <div className="relative bg-white rounded-full p-12 shadow-lg">
                <svg className="mx-auto h-20 w-20 text-[#193043]" fill="currentColor" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              No Sales Yet
            </h3>

            {/* Description */}
            <p className="text-gray-600 mb-8 leading-relaxed">
              Start tracking your sales by recording your first transaction. Monitor revenue, track customer purchases, and analyze your business performance.
            </p>

            {/* Additional Tips */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-2">💡 Pro Tips:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Record accurate customer and product information</li>
                <li>• Track payment methods for better cash flow management</li>
                <li>• Use date filters to analyze sales trends</li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Sales ({filteredSales.length})
            </h2>
          </div>

          <div className="ag-theme-alpine h-full">
            <AgGridReact
              rowData={filteredSales}
              columnDefs={[
                {
                  headerName: 'Date',
                  field: 'date',
                  cellRenderer: (params: any) => {
                    const date = new Date(params.value);
                    return (
                      <div className="text-gray-900">
                        {date.toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false,
                        })}
                      </div>
                    );
                  },
                  sortable: true,
                  filter: true,
                  resizable: true,
                  flex: 1,
                  minWidth: 160,
                },
                {
                  headerName: 'Customer',
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
                  headerName: 'Products',
                  field: 'products',
                  cellRenderer: formatProductsCell,
                  sortable: false,
                  filter: false,
                  resizable: true,
                  flex: 1,
                  minWidth: 200,
                },
                {
                  headerName: 'Total Amount',
                  field: 'totalAmount',
                  cellRenderer: (params: any) => (
                    <div className="font-medium text-gray-900">
                      Rs {params.value?.toLocaleString() || 0}
                    </div>
                  ),
                  sortable: true,
                  filter: 'agNumberColumnFilter',
                  resizable: true,
                  flex: 1,
                  minWidth: 120,
                },
                {
                  headerName: 'Payment Method',
                  field: 'paymentMethod',
                  cellRenderer: (params: any) => (
                    <div className="text-gray-500">{params.value?.join(', ') || ''}</div>
                  ),
                  sortable: true,
                  filter: true,
                  resizable: true,
                  flex: 1,
                  minWidth: 130,
                },
                {
                  cellRenderer: (params: any) => <SimpleActionMenu sale={params.data} />,
                  headerName: 'Actions',
                  sortable: false,
                  filter: false,
                  resizable: true,
                  flex: 1,
                  minWidth: 100,
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
      )}
    </AgGridProvider>
  );
};

export default SalesDataGrid;
