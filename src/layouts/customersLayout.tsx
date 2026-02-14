'use client';
import { useState, useCallback, useOptimistic, useActionState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FaEye } from 'react-icons/fa';
import { AgGridReact, AgGridProvider } from 'ag-grid-react';
import { AllCommunityModule } from 'ag-grid-community';
import Modal from '@/components/modal';
import Input from '@/components/customInput';
import Button from '@/components/button';
import CustomerInvoicesModal from '@/components/customer/CustomerInvoicesModal';
import { createCustomer, getCustomers } from '@/actions/customerActions';
import { toast } from 'react-toastify';
import { useClientContext } from '@/interfaces/clientContext';

// AG Grid modules
const modules = [AllCommunityModule];

interface CustomerData {
  customerName: string;
  phoneNumber: string;
  address: string;
  email?: string;
}

interface CustomersLayoutProps {
  customers: any[];
  categories?: any[];
  // React 19: Add server timestamp for cache invalidation
  serverTimestamp?: number;
}

const CustomersLayout: React.FC<CustomersLayoutProps> = ({
  customers,
  categories = [],
  serverTimestamp,
}) => {
  const { selectedClient } = useClientContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInvoicesModalOpen, setIsInvoicesModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [form, setForm] = useState({
    customerName: '',
    phoneNumber: '',
    address: '',
    email: '',
  });
  const [customerList, setCustomerList] = useState(customers);

  // Portal-based action menu to escape AG Grid context
  const SimpleActionMenu: React.FC<{ customer: any }> = ({ customer }) => {
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
      
      if (action === 'viewInvoices') {
        handleViewInvoices(customer);
      } else if (action === 'edit') {
        handleEditCustomer(customer);
      } else if (action === 'delete') {
        handleDeleteCustomer(customer);
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
                onClick={(e) => handleAction('viewInvoices', e)}
                className="flex items-center px-4 py-2 text-sm text-blue-600 hover:bg-gray-100 cursor-pointer"
              >
                <FaEye className="mr-3 h-4 w-4" />
                View Invoices
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

  // React 19: Optimistic updates for customer operations
  const [optimisticCustomers, addOptimisticCustomer] = useOptimistic(
    customers,
    (state: any, newCustomer: any) => {
      if (newCustomer.action === 'delete') {
        return state.filter((customer: any) => customer.id !== newCustomer.id);
      }
      return [newCustomer, ...state];
    }
  );

  // React 19: useActionState for form handling
  const [createState, createAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const customerName = formData.get('customerName') as string;
      const phoneNumber = formData.get('phoneNumber') as string;
      const address = formData.get('address') as string;
      const email = formData.get('email') as string;

      if (!customerName?.trim() || !phoneNumber?.trim()) {
        toast.error('Customer name and phone number are required');
        return { error: 'Customer name and phone number are required' };
      }

      try {
        // Add optimistic update
        const newCustomer = {
          customerName: customerName.trim(),
          phoneNumber: phoneNumber.trim(),
          address: address?.trim() || '',
          email: email?.trim() || '',
          createdAt: new Date(),
          id: `temp-${Date.now()}`,
        };

        addOptimisticCustomer(newCustomer);

        const result = await createCustomer({
          customerName: customerName.trim(),
          phoneNumber: phoneNumber.trim(),
          address: address?.trim() || '',
          email: email?.trim() || '',
        });

        if (!result.success) {
          throw new Error(result.error || 'Failed to create customer');
        }

        // Refresh customers list
        const customersResult = await getCustomers();
        if (customersResult.success && Array.isArray(customersResult.data)) {
          setCustomerList(customersResult.data);
        }

        setForm({ customerName: '', phoneNumber: '', address: '', email: '' });
        setIsModalOpen(false);
        toast.success('Customer created successfully');
        return { success: true };
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Failed to create customer'
        );
        return {
          error:
            error instanceof Error
              ? error.message
              : 'Failed to create customer',
        };
      }
    },
    null
  );

  const handleViewInvoices = useCallback((customer: any) => {
    setSelectedCustomer(customer);
    setIsInvoicesModalOpen(true);
  }, []);

  const handleCloseInvoicesModal = useCallback(() => {
    setIsInvoicesModalOpen(false);
    setSelectedCustomer(null);
  }, []);

  // React 19: Handle customer editing
  const handleEditCustomer = useCallback((customer: any) => {
    setForm({
      customerName: customer.customerName || '',
      phoneNumber: customer.phoneNumber || '',
      address: customer.address || '',
      email: customer.email || '',
    });
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  }, []);

  // React 19: Handle customer deletion
  const handleDeleteCustomer = useCallback(
    async (customer: any) => {
      if (!confirm('Are you sure you want to delete this customer?')) {
        return;
      }

      try {
        // Add optimistic deletion
        addOptimisticCustomer({
          action: 'delete',
          id: customer._id,
        });

        const response = await fetch(`/api/customers/${customer._id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          toast.success('Customer deleted successfully');
          await getCustomers();
        } else {
          throw new Error('Failed to delete customer');
        }
      } catch (error) {
        console.error('Error deleting customer:', error);
        toast.error('Failed to delete customer');
      }
    },
    [addOptimisticCustomer]
  );

  return (
    <AgGridProvider modules={modules}>
      <div className='p-0 py-6 md:p-6'>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className='text-2xl font-bold'>Customers</h1>
            <p className="text-gray-600">Manage your customer database and their information</p>
          </div>
          {optimisticCustomers.length > 0 && (
            <Button
              variant="fill"
              text="Create Customer"
              onClick={() => {
                setSelectedCustomer(null);
                setForm({
                  customerName: '',
                  phoneNumber: '',
                  address: '',
                  email: '',
                });
                setIsModalOpen(true);
              }}
            />
          )}
        </div>

        {optimisticCustomers.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="max-w-md mx-auto">
              {/* Gradient Background Circle */}
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-gradient-to-br from-[#f0f4f8] to-[#e1e7ed] rounded-full p-8"></div>
                <div className="relative bg-white rounded-full p-12 shadow-lg">
                  <svg className="mx-auto h-20 w-20 text-[#193043]" fill="currentColor" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                No Customers Yet
              </h3>

              {/* Description */}
              <p className="text-gray-600 mb-8 leading-relaxed">
                Start building your customer database by adding your first customer. Keep track of their contact information and purchase history.
              </p>

              {/* Call to Action Button */}
              <div className="flex justify-center">
                <Button
                  text="Create Your First Customer"
                  onClick={() => {
                    setSelectedCustomer(null);
                    setForm({
                      customerName: '',
                      phoneNumber: '',
                      address: '',
                      email: '',
                    });
                    setIsModalOpen(true);
                  }}
                  variant="fill"
                  className="bg-[#193043] hover:bg-[#2a4156] text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                />
              </div>

              {/* Additional Tips */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500 mb-2">💡 Pro Tips:</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Add accurate contact information for better communication</li>
                  <li>• Include email addresses for digital receipts and updates</li>
                  <li>• Keep detailed addresses for delivery purposes</li>
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
                    Customers ({optimisticCustomers.length})
                  </h2>
                  <Button
                    variant="fill"
                    text="Create Customer"
                    onClick={() => {
                      setSelectedCustomer(null);
                      setForm({
                        customerName: '',
                        phoneNumber: '',
                        address: '',
                        email: '',
                      });
                      setIsModalOpen(true);
                    }}
                  />
                </div>
              </div>

              <div className="ag-theme-alpine h-full">
                <AgGridReact
                  rowData={optimisticCustomers}
                  columnDefs={[
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
                      headerName: 'Phone Number',
                      field: 'phoneNumber',
                      cellRenderer: (params: any) => (
                        <div className="text-blue-600">{params.value || ''}</div>
                      ),
                      sortable: true,
                      filter: true,
                      resizable: true,
                      flex: 1,
                      minWidth: 130,
                    },
                    {
                      headerName: 'Email',
                      field: 'email',
                      cellRenderer: (params: any) => {
                        const email = params.value;
                        return email ? (
                          <a
                            href={`mailto:${email}`}
                            className="text-blue-500 hover:text-blue-700 underline"
                          >
                            {email}
                          </a>
                        ) : (
                          <div className="text-gray-400">No email</div>
                        );
                      },
                      sortable: true,
                      filter: true,
                      resizable: true,
                      flex: 1,
                      minWidth: 180,
                    },
                    {
                      headerName: 'Address',
                      field: 'address',
                      cellRenderer: (params: any) => (
                        <div className="text-gray-500">{params.value || 'No address'}</div>
                      ),
                      sortable: true,
                      filter: true,
                      resizable: true,
                      flex: 1,
                      minWidth: 200,
                    },
                    {
                      headerName: 'Created Date',
                      field: 'createdAt',
                      cellRenderer: (params: any) => {
                        const date = params.value;
                        return <div className="text-gray-500">{date ? new Date(date).toLocaleDateString() : 'N/A'}</div>;
                      },
                      sortable: true,
                      filter: true,
                      resizable: true,
                      flex: 1,
                      minWidth: 120,
                    },
                    {
                      cellRenderer: (params: any) => <SimpleActionMenu customer={params.data} />,
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

      {/* Create Customer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setForm({
            customerName: '',
            phoneNumber: '',
            address: '',
            email: '',
          });
          setSelectedCustomer(null);
        }}
        title={selectedCustomer ? 'Edit Customer' : 'Create Customer'}
      >
        {/* React 19: Modern form with useActionState */}
        <form action={createAction} className='mt-4 flex flex-col gap-4'>
          <Input
            label='Customer Name'
            name='customerName'
            value={form.customerName}
            onChange={(e) =>
              setForm((prev: any) => ({
                ...prev,
                customerName: e.target.value,
              }))
            }
            required
          />
          <Input
            label='Phone Number'
            name='phoneNumber'
            value={form.phoneNumber}
            onChange={(e) =>
              setForm((prev: any) => ({ ...prev, phoneNumber: e.target.value }))
            }
            required
          />
          <Input
            label='Address'
            name='address'
            value={form.address}
            onChange={(e) =>
              setForm((prev: any) => ({ ...prev, address: e.target.value }))
            }
          />
          <Input
            label='Email'
            name='email'
            type='email'
            value={form.email}
            onChange={(e) =>
              setForm((prev: any) => ({ ...prev, email: e.target.value }))
            }
          />
          <div className='flex gap-3'>
            <Button
              type='button'
              variant='outline'
              text='Cancel'
              onClick={() => {
                setIsModalOpen(false);
                setForm({
                  customerName: '',
                  phoneNumber: '',
                  address: '',
                  email: '',
                });
                setSelectedCustomer(null);
              }}
            />
            <Button
              type='submit'
              variant='fill'
              text={
                isPending
                  ? 'Creating...'
                  : selectedCustomer
                    ? 'Update'
                    : 'Create'
              }
              disabled={isPending}
            />
          </div>
        </form>
      </Modal>

      {/* Customer Invoices Modal */}
      {selectedCustomer && (
        <CustomerInvoicesModal
          isOpen={isInvoicesModalOpen}
          onClose={handleCloseInvoicesModal}
          customer={selectedCustomer}
          categories={categories}
        />
      )}
    </div>
  </AgGridProvider>
);
};

export default CustomersLayout;
