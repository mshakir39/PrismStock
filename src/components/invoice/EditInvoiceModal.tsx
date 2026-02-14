import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { cloneDeep } from 'lodash';
import CustomerSection from './CustomerSection';
import ProductSection from './ProductSection';
import PaymentSection from './PaymentSection';

import Modal from '@/components/modal';
import Button from '@/components/button';
import Input from '@/components/customInput';

interface EditInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
  onSubmit: (data: any) => void;
  isLoading: boolean;
  categories: any[];
  customers: any[];
  brandOptions: any[];
  products?: any[];
  stock: any[];
  accordionMethods: any;
}

const EditInvoiceModal: React.FC<EditInvoiceModalProps> = ({
  isOpen,
  onClose,
  data,
  onSubmit,
  isLoading,
  categories,
  customers,
  brandOptions,
  products,
  accordionMethods,
}) => {
  // Initialize state with invoice data
  const [editInvoiceData, setEditInvoiceData] = useState<any>({
    customerName: '',
    customerAddress: '',
    customerContactNumber: '',
    customerType: 'WalkIn Customer',
    customerId: null,
    vehicleNo: '',
    paymentMethod: [],
    receivedAmount: 0,
    batteriesRate: 0,
    batteriesCountAndWeight: '',
    useCustomDate: false,
    customDate: null,
  });

  const [accordionData, setAccordionData] = useState<any>({});
  const [expandedAccordionIndex, setExpandedAccordionIndex] = useState(-1);

  // Check if this is a quick payment addition or full edit
  const isQuickPayment =
    data.isPaymentOnly ||
    !data.products ||
    !Array.isArray(data.products) ||
    data.products.length === 0;

  // Initialize form data when modal opens or data changes
  useEffect(() => {
    if (isOpen && data) {
      if (isQuickPayment) {
        // Quick payment addition - minimal data needed
        setEditInvoiceData({
          customerName: data.customerName || '',
          customerAddress: '',
          customerContactNumber: '',
          customerType: 'WalkIn Customer',
          customerId: null,
          vehicleNo: '',
          paymentMethod: [],
          receivedAmount: 0,
          batteriesRate: 0,
          batteriesCountAndWeight: '',
          useCustomDate: false, // Disabled by default for consistency with Create modal
          customDate: null,
        });
        setAccordionData({});
      } else {
        // Full invoice edit - initialize all data
        const customerData = {
          customerName: data.customerName || '',
          customerAddress: data.customerAddress || '',
          customerContactNumber: data.customerContactNumber || '',
          customerType: data.customerType || 'WalkIn Customer',
          customerId: data.customerId || null,
          vehicleNo: data.vehicleNo || '',
          paymentMethod: Array.isArray(data.paymentMethod)
            ? data.paymentMethod
            : data.paymentMethod
              ? [data.paymentMethod]
              : [],
          receivedAmount: Number(data.receivedAmount) || 0,
          batteriesRate: Number(data.batteriesRate) || 0,
          batteriesCountAndWeight: data.batteriesCountAndWeight || '',
          clientName: data.clientName || data.customerName || '',
          remainingAmount: data.remainingAmount || 0,
          useCustomDate: false, // Disabled by default for consistency with Create modal
          customDate: null,
        };

        // Keep useCustomDate as false by default for consistency with Create modal
        // Users can manually enable it if they want to edit the date

        setEditInvoiceData(customerData);

        // Initialize product data
        if (data.products && Array.isArray(data.products)) {
          const productData: any = {};
          data.products.forEach((product: any, index: number) => {
            // Handle warranty duration - calculate from end date if missing or use default
            let warrantyDuration = product.warrentyDuration;

            if (
              !warrantyDuration &&
              product.warrentyStartDate &&
              product.warrentyEndDate
            ) {
              // Calculate from start and end dates
              const startDate = new Date(product.warrentyStartDate);
              const endDate = new Date(product.warrentyEndDate);
              const monthsDiff = Math.round(
                (endDate.getTime() - startDate.getTime()) /
                  (1000 * 60 * 60 * 24 * 30.44)
              ); // More accurate month calculation
              warrantyDuration = monthsDiff > 0 ? monthsDiff.toString() : '6';
            } else if (
              !warrantyDuration &&
              product.warrentyCode &&
              product.warrentyCode !== 'No Warranty'
            ) {
              // Has warranty code but no duration - set default
              warrantyDuration = '6';
            } else if (product.warrentyCode === 'No Warranty') {
              // Explicitly no warranty
              warrantyDuration = '0';
            } else if (warrantyDuration) {
            } else {
            }

            // Determine if this product has warranty (has code or valid duration)
            const hasWarranty =
              product.warrentyCode &&
              product.warrentyCode !== 'No Warranty' &&
              warrantyDuration &&
              warrantyDuration !== '0';

            productData[index] = {
              productId: product.productId || product._id || '',
              productName: product.productName || product.name || '',
              brandName: product.brandName || '',
              series: product.series || '',
              productPrice: product.productPrice
                ? String(product.productPrice)
                : '',
              quantity: product.quantity ? String(product.quantity) : '',
              warrentyCode: product.warrentyCode || '',
              warrentyStartDate: product.warrentyStartDate || '',
              warrentyDuration: warrantyDuration || '',
              noWarranty: !hasWarranty,
              batteryDetails: product.batteryDetails || null,
            };
          });
          setAccordionData(productData);
        }
      }
    }
  }, [isOpen, data, isQuickPayment]);

  // Function to sync warranty start dates with custom date
  const syncWarrantyDatesWithCustomDate = useCallback(
    (customDate: string) => {
      if (!customDate) return;

      const customDateOnly = customDate.split('T')[0]; // Extract date part only
      let updatedCount = 0;

      // Update all accordion items to use the custom date for warranty start
      Object.keys(accordionData).forEach((accordionIndex) => {
        const index = parseInt(accordionIndex);
        const currentAccordion = accordionData[index];

        if (
          currentAccordion &&
          currentAccordion.warrentyDuration &&
          !currentAccordion.noWarranty
        ) {
          const oldDate = currentAccordion.warrentyStartDate;

          // Only update if the date is different
          if (oldDate !== customDateOnly) {
            setAccordionData((prev: any) => ({
              ...prev,
              [index]: {
                ...prev[index],
                warrentyStartDate: customDateOnly,
              },
            }));

            updatedCount++;
          }
        }
      });

      if (updatedCount > 0) {
        toast.success(
          `Warranty start dates synced with custom date: ${customDateOnly}`
        );
      }
    },
    [accordionData]
  );

  // Track if sync has already been performed for the current custom date
  const [lastSyncedDate, setLastSyncedDate] = useState<string>('');

  // Watch for custom date changes and sync warranty dates
  useEffect(() => {
    if (editInvoiceData?.useCustomDate && editInvoiceData?.customDate) {
      const customDateOnly = editInvoiceData.customDate.split('T')[0];

      // Only sync if we haven't already synced this exact date
      if (lastSyncedDate !== customDateOnly) {
        syncWarrantyDatesWithCustomDate(editInvoiceData.customDate);
        setLastSyncedDate(customDateOnly);
      } else {
      }
    }
  }, [
    editInvoiceData?.useCustomDate,
    editInvoiceData?.customDate,
    syncWarrantyDatesWithCustomDate,
    lastSyncedDate,
  ]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setEditInvoiceData((prev: any) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAccordionClick = (accordionIndex: number) => {
    setExpandedAccordionIndex(
      expandedAccordionIndex === accordionIndex ? -1 : accordionIndex
    );
  };

  // Enhanced accordion methods for editing
  const editAccordionMethods = {
    ...accordionMethods,
    handleAccordionChange: (index: number, field: string, value: any) => {
      setAccordionData((prev: any) => ({
        ...prev,
        [index]: {
          ...prev[index],
          [field]: value,
        },
      }));
    },
    addAccordionItem: () => {
      const newIndex = Object.keys(accordionData).length;
      setAccordionData((prev: any) => ({
        ...prev,
        [newIndex]: {
          brandName: '',
          series: '',
          productPrice: '',
          quantity: '',
          warrentyCode: '',
          warrentyStartDate: '',
          warrentyDuration: '',
          noWarranty: false,
          batteryDetails: null,
        },
      }));
    },
    removeAccordionItem: (index: number) => {
      setAccordionData((prev: any) => {
        const newData = { ...prev };
        delete newData[index];

        // Re-index the remaining items
        const reIndexedData: any = {};
        Object.keys(newData)
          .sort((a, b) => parseInt(a) - parseInt(b))
          .forEach((key, i) => {
            reIndexedData[i] = newData[key];
          });

        return reIndexedData;
      });
    },
  };

  const transformData = (data: { [key: number]: any }): any[] => {
    return Object.values(data).map((item) => {
      const {
        seriesOption,
        batteryDetails,
        warrentyStartDate,
        warrentyDuration,
        noWarranty,
        ...rest
      } = item;

      return {
        ...rest,
        warrentyStartDate: noWarranty ? '' : warrentyStartDate,
        warrentyDuration: noWarranty ? '0' : warrentyDuration,
        warrentyCode: noWarranty ? 'No Warranty' : item.warrentyCode,
        warrantyEndDate: noWarranty
          ? ''
          : calculateEndDate(item.warrentyStartDate, item.warrentyDuration),
        totalPrice: Number(rest.productPrice) * Number(rest.quantity),
        batteryDetails,
      };
    });
  };

  const calculateEndDate = (
    startDate: string,
    months: number | string
  ): string => {
    if (!startDate || isNaN(new Date(startDate).getTime())) {
      return '';
    }

    // Handle empty or invalid months value
    const monthsValue = parseInt(String(months));
    if (isNaN(monthsValue) || monthsValue <= 0) {
      return '';
    }

    const date = new Date(startDate);
    date.setMonth(date.getMonth() + monthsValue);
    return date.toISOString().split('T')[0];
  };

  const validateForm = () => {
    if (isQuickPayment) {
      // Simple validation for payment-only
      if (
        !editInvoiceData?.paymentMethod ||
        editInvoiceData?.paymentMethod.length === 0
      ) {
        toast.error('Please select at least one payment method');
        return false;
      }

      if (
        !editInvoiceData?.receivedAmount ||
        parseFloat(editInvoiceData.receivedAmount) < 0
      ) {
        toast.error('Please enter a valid payment amount (cannot be negative)');
        return false;
      }

      return true;
    }

    // Full validation for invoice editing
    // Validate customer information
    if (editInvoiceData?.customerType === 'Regular') {
      if (!editInvoiceData?.customerName || !editInvoiceData?.customerId) {
        toast.error('Please select a regular customer');
        return false;
      }
    } else {
      if (!editInvoiceData?.customerName) {
        toast.error('Please enter customer name');
        return false;
      }
      if (!editInvoiceData?.customerAddress) {
        toast.error('Please enter customer address');
        return false;
      }
    }

    // Check if any products have been added
    const hasProducts = Object.values(accordionData).some(
      (item: any) =>
        item.productId || item.productPrice || item.quantity
    );

    if (hasProducts) {
      const accordionKeys = Object.keys(accordionData);
      for (const key of accordionKeys) {
        const item = accordionData[parseInt(key)];
        if (!item.productId) {
          toast.error(`Please select product for Row ${key}`);
          return false;
        }
        if (!item.productPrice || Number(item.productPrice) <= 0) {
          toast.error(`Please enter valid product price for Row ${key}`);
          return false;
        }
        if (!item.quantity || Number(item.quantity) <= 0) {
          toast.error(`Please enter valid quantity for Row ${key}`);
          return false;
        }
      }
    }

    // Validate payment method
    if (
      !editInvoiceData?.paymentMethod ||
      editInvoiceData?.paymentMethod.length === 0
    ) {
      toast.error('Please select at least one payment method');
      return false;
    }

    // Validate custom date if toggle is enabled
    if (editInvoiceData?.useCustomDate === true) {
      if (!editInvoiceData?.customDate) {
        toast.error('Please select a date and time for the invoice');
        return false;
      }

      const selectedDate = new Date(editInvoiceData.customDate);
      if (isNaN(selectedDate.getTime())) {
        toast.error('Please select a valid date and time');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!validateForm()) {
      return;
    }

    if (isQuickPayment) {
      // Simple payment addition - use original payment API
      const paymentData = {
        id: data.id,
        additionalPayment: parseFloat(editInvoiceData.receivedAmount || 0),
        paymentMethod: editInvoiceData.paymentMethod,
      };
      onSubmit(paymentData);
    } else {
      // Full invoice edit
      const formData = { ...editInvoiceData };
      if (!editInvoiceData?.paymentMethod?.includes('Old Battery')) {
        formData.batteriesRate = 0;
        formData.batteriesCountAndWeight = '';
      }

      // Ensure custom date fields are properly set
      if (!formData.useCustomDate) {
        formData.customDate = null; // Clear custom date when toggle is off
      }

      // Set customer type and related fields
      formData.customerType =
        editInvoiceData?.customerType || 'WalkIn Customer';
      formData.clientName =
        editInvoiceData?.customerType === 'Regular'
          ? editInvoiceData?.clientName
          : editInvoiceData?.customerName;

      // Ensure customerId is included for regular customers
      if (editInvoiceData?.customerType === 'Regular') {
        formData.customerId = editInvoiceData?.customerId;
      } else {
        // For walk-in customers, set customerId to null or remove it
        formData.customerId = null;
      }

      formData.productDetail = transformData(accordionData);
      formData.id = data.id; // Include the invoice ID for editing
      const clonedFormData = cloneDeep(formData);
      onSubmit(clonedFormData);
    }
  };

  return (
    <Modal
      dialogPanelClass={isQuickPayment ? '!w-[40%]' : '!w-[90%] !max-w-6xl'}
      isOpen={isOpen}
      onClose={onClose}
      title=''  // Hide default header since we have custom header
      parentClass='!p-0'  // Remove default padding
    >
      <div 
        className="rounded-t-lg text-white"
        style={{
          background: 'linear-gradient(to right, #193043, #1e3a5f, #234466)',
        }}
      >
        <h2 className="p-4 text-xl font-semibold">
          {isQuickPayment
            ? `Add Payment to Invoice #${data?.invoiceNo || ''}`
            : `Edit Invoice #${data?.invoiceNo || ''}`
          }
        </h2>
        <p className="px-4 pb-4 text-sm text-white text-opacity-80">
          {isQuickPayment 
            ? 'Add additional payment to this invoice'
            : 'Update the invoice details as needed'
          }
        </p>
      </div>
      <form onSubmit={handleSubmit} noValidate>
        <div className='mt-4 flex w-full flex-col gap-4 p-4'>
          {!isQuickPayment && (
            <>
              <CustomerSection
                invoiceData={editInvoiceData}
                setInvoiceData={setEditInvoiceData}
                customers={customers}
                onChange={handleChange}
              />

              <div className='mb-4'>
                <div className='mb-2 flex items-center justify-between'>
                  <label className='text-sm font-medium text-gray-700'>
                    Use Custom Date & Time
                  </label>
                  <label className='relative inline-flex cursor-pointer items-center'>
                    <input
                      type='checkbox'
                      className='peer sr-only'
                      checked={editInvoiceData?.useCustomDate || false}
                      onChange={(e) => {
                        const newValue = e.target.checked;
                        setEditInvoiceData((prev: any) => ({
                          ...prev,
                          useCustomDate: newValue,
                          customDate: newValue ? prev.customDate : null,
                        }));

                        // If custom date is disabled, reset warranty dates to current date
                        if (!newValue) {
                          const currentDate = new Date()
                            .toISOString()
                            .split('T')[0];
                          Object.keys(accordionData).forEach(
                            (accordionIndex) => {
                              const index = parseInt(accordionIndex);
                              const currentAccordion = accordionData[index];

                              if (
                                currentAccordion &&
                                currentAccordion.warrentyDuration &&
                                !currentAccordion.noWarranty
                              ) {
                                setAccordionData((prev: any) => ({
                                  ...prev,
                                  [index]: {
                                    ...prev[index],
                                    warrentyStartDate: currentDate,
                                  },
                                }));
                              }
                            }
                          );

                          // Reset the last synced date
                          setLastSyncedDate('');
                        }
                      }}
                    />
                    <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300"></div>
                  </label>
                </div>

                {editInvoiceData?.useCustomDate ? (
                  <>
                    <Input
                      type='datetime-local'
                      label='Invoice Date & Time'
                      name='customDate'
                      value={editInvoiceData?.customDate || ''}
                      onChange={handleChange}
                      required
                    />
                    <p className='mt-1 text-sm text-gray-600'>
                      Select the date and time for this invoice. Use this for
                      editing invoice dates.
                    </p>
                    <p className='mt-1 text-sm font-medium text-blue-600'>
                      🔄 Warranty start dates will automatically sync with this
                      custom date
                    </p>
                  </>
                ) : (
                  <div className='rounded-lg bg-gray-50 p-3'>
                    <p className='text-sm text-gray-600'>
                      Invoice will use the current date and time.
                    </p>
                  </div>
                )}
              </div>

              <ProductSection
                accordionData={accordionData}
                categories={categories}
                brandOptions={brandOptions}
                expandedAccordionIndex={expandedAccordionIndex}
                onAccordionClick={handleAccordionClick}
                accordionMethods={editAccordionMethods}
                products={products || []}
              />
            </>
          )}

          <PaymentSection
            invoiceData={editInvoiceData}
            onChange={handleChange}
            setInvoiceData={setEditInvoiceData}
            accordionData={accordionData}
          />

          <div className='flex gap-2 pt-4'>
            <Button
              className='w-fit'
              variant='fill'
              text={isQuickPayment ? 'Add Payment' : 'Save Changes'}
              type='submit'
              isPending={isLoading}
            />
            <Button
              className='w-fit'
              variant='outline'
              text='Cancel'
              type='button'
              onClick={onClose}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default EditInvoiceModal;
