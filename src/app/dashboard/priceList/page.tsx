'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AgGridReact, AgGridProvider } from 'ag-grid-react';
import { AllCommunityModule } from 'ag-grid-community';
import Button from '@/components/button';
import Modal from '@/components/modal';
import Input from '@/components/customInput';
import { toast } from 'react-toastify';
import ErrorBoundary from '@/components/ErrorBoundary';

// AG Grid modules
const modules = [AllCommunityModule];

interface PriceItem {
  _id?: string;
  id?: string;
  productName: string;
  sku?: string;
  category: string;
  price: number;
  cost?: number;
  margin?: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export default function PriceListPage() {
  const [priceItems, setPriceItems] = useState<PriceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<PriceItem | null>(null);
  const [formData, setFormData] = useState({
    productName: '',
    sku: '',
    category: '',
    price: '',
    cost: '',
    isActive: true,
  });

  // Portal-based action menu to escape AG Grid context
  const SimpleActionMenu: React.FC<{ item: PriceItem }> = ({ item }) => {
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

      if (action === 'edit') {
        handleEdit(item);
      } else if (action === 'delete') {
        handleDelete(item);
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
                onClick={(e) => handleAction('edit', e)}
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                <svg className="mr-3 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.829-2.828z" />
                </svg>
                Edit
              </div>
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

  const fetchPriceItems = async () => {
    try {
      // Mock data for demonstration - replace with actual API call
      const mockData: PriceItem[] = [];
      setPriceItems(mockData);
    } catch (error) {
      console.error('Error fetching price items:', error);
      toast.error('Failed to fetch price items');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const itemData = {
        ...formData,
        price: parseFloat(formData.price),
        cost: formData.cost ? parseFloat(formData.cost) : undefined,
        margin: formData.cost && formData.price ?
          ((parseFloat(formData.price) - parseFloat(formData.cost)) / parseFloat(formData.price)) * 100 : undefined,
      };

      // Mock API call - replace with actual implementation
      console.log('Saving price item:', itemData);
      toast.success(editingItem ? 'Price item updated successfully' : 'Price item created successfully');

      setShowCreateDialog(false);
      setEditingItem(null);
      resetForm();
      fetchPriceItems();
    } catch (error) {
      console.error('Error saving price item:', error);
      toast.error('Failed to save price item');
    }
  };

  const handleEdit = (item: PriceItem) => {
    setEditingItem(item);
    setFormData({
      productName: item.productName,
      sku: item.sku || '',
      category: item.category,
      price: item.price.toString(),
      cost: item.cost?.toString() || '',
      isActive: item.isActive,
    });
    setShowCreateDialog(true);
  };

  const handleDelete = async (item: PriceItem) => {
    if (!confirm('Are you sure you want to delete this price item?')) return;

    try {
      // Mock API call - replace with actual implementation
      console.log('Deleting price item:', item);
      toast.success('Price item deleted successfully');
      fetchPriceItems();
    } catch (error) {
      console.error('Error deleting price item:', error);
      toast.error('Failed to delete price item');
    }
  };

  const resetForm = () => {
    setFormData({
      productName: '',
      sku: '',
      category: '',
      price: '',
      cost: '',
      isActive: true,
    });
  };

  useEffect(() => {
    fetchPriceItems();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary
      title="Price List Data Error"
      message="An unexpected error occurred while loading price list information."
    >
      <AgGridProvider modules={modules}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">Price List Management</h1>
              <p className="text-gray-600">Manage your product pricing and profit margins</p>
            </div>
            {priceItems.length > 0 && (
              <Button
                variant="fill"
                text="Add Price Item"
                onClick={() => {
                  setEditingItem(null);
                  resetForm();
                  setShowCreateDialog(true);
                }}
              />
            )}
          </div>

          {priceItems.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="max-w-md mx-auto">
                {/* Gradient Background Circle */}
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#f0f4f8] to-[#e1e7ed] rounded-full p-8"></div>
                  <div className="relative bg-white rounded-full p-12 shadow-lg">
                    <svg className="mx-auto h-20 w-20 text-[#193043]" fill="currentColor" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  No Price Items Yet
                </h3>

                {/* Description */}
                <p className="text-gray-600 mb-8 leading-relaxed">
                  Start building your price list by adding your first product pricing. Set competitive prices and track profit margins.
                </p>

                {/* Call to Action Button */}
                <div className="flex justify-center">
                  <Button
                    text="Create Your First Price Item"
                    onClick={() => {
                      setEditingItem(null);
                      resetForm();
                      setShowCreateDialog(true);
                    }}
                    variant="fill"
                    className="bg-[#193043] hover:bg-[#2a4156] text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                  />
                </div>

                {/* Additional Tips */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-500 mb-2">💡 Pro Tips:</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Set competitive pricing based on market research</li>
                    <li>• Calculate profit margins to ensure profitability</li>
                    <li>• Use SKUs for efficient inventory tracking</li>
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
                      Price Items ({priceItems.length})
                    </h2>
                    <Button
                      variant="fill"
                      text="Add Price Item"
                      onClick={() => {
                        setEditingItem(null);
                        resetForm();
                        setShowCreateDialog(true);
                      }}
                    />
                  </div>
                </div>

                <div className="ag-theme-alpine h-full">
                  <AgGridReact
                    rowData={priceItems}
                    columnDefs={[
                      {
                        headerName: 'Product Name',
                        field: 'productName',
                        cellRenderer: (params: any) => (
                          <div className="font-medium text-gray-900">{params.value || ''}</div>
                        ),
                        sortable: true,
                        filter: true,
                        resizable: true,
                        flex: 1,
                        minWidth: 180,
                      },
                      {
                        headerName: 'SKU',
                        field: 'sku',
                        cellRenderer: (params: any) => (
                          <div className="text-gray-500">{params.value || '-'}</div>
                        ),
                        sortable: true,
                        filter: true,
                        resizable: true,
                        flex: 1,
                        minWidth: 120,
                      },
                      {
                        headerName: 'Category',
                        field: 'category',
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
                        headerName: 'Selling Price',
                        field: 'price',
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
                        headerName: 'Cost Price',
                        field: 'cost',
                        cellRenderer: (params: any) => (
                          <div className="text-gray-500">
                            {params.value ? `Rs ${params.value.toLocaleString()}` : '-'}
                          </div>
                        ),
                        sortable: true,
                        filter: 'agNumberColumnFilter',
                        resizable: true,
                        flex: 1,
                        minWidth: 110,
                      },
                      {
                        headerName: 'Margin',
                        field: 'margin',
                        cellRenderer: (params: any) => (
                          <div className={`font-medium ${params.value >= 20 ? 'text-green-600' : params.value >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {params.value ? `${params.value.toFixed(1)}%` : '-'}
                          </div>
                        ),
                        sortable: true,
                        filter: 'agNumberColumnFilter',
                        resizable: true,
                        flex: 1,
                        minWidth: 100,
                      },
                      {
                        headerName: 'Status',
                        field: 'isActive',
                        cellRenderer: (params: any) => (
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            params.value
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {params.value ? 'Active' : 'Inactive'}
                          </span>
                        ),
                        sortable: true,
                        filter: true,
                        resizable: true,
                        flex: 1,
                        minWidth: 100,
                      },
                      {
                        cellRenderer: (params: any) => <SimpleActionMenu item={params.data} />,
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
            </>
          )}

          {/* Create/Edit Modal */}
          <Modal
            isOpen={showCreateDialog}
            onClose={() => {
              setShowCreateDialog(false);
              setEditingItem(null);
              resetForm();
            }}
            title={editingItem ? 'Edit Price Item' : 'Create New Price Item'}
            size="medium"
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="text"
                label="Product Name"
                value={formData.productName}
                onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                required
              />
              <Input
                type="text"
                label="SKU (Optional)"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              />
              <Input
                type="text"
                label="Category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="number"
                  label="Selling Price (Rs)"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
                <Input
                  type="number"
                  label="Cost Price (Rs)"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                />
              </div>
              <div className="flex items-center">
                <input
                  id="isActive"
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                  Active
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  text="Cancel"
                  onClick={() => {
                    setShowCreateDialog(false);
                    setEditingItem(null);
                    resetForm();
                  }}
                />
                <Button
                  type="submit"
                  variant="fill"
                  text={editingItem ? 'Update Item' : 'Create Item'}
                />
              </div>
            </form>
          </Modal>
        </div>
      </AgGridProvider>
    </ErrorBoundary>
  );
}
