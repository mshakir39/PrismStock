import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { cloneDeep } from 'lodash';
import CustomerSection from './CustomerSection';
import ProductSection from './ProductSection';
import PaymentSection from './PaymentSection';

import Modal from '@/components/modal';
import Button from '@/components/button';
import Input from '@/components/customInput';

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceData: any;
  setInvoiceData?: any;
  accordionData: any;
  categories: any[];
  customers: any[];
  brandOptions: any[];
  isLoading: boolean;
  accordionMethods: any;
  onSubmit: any;
  onChange: any;
  products: any[];
}

const CreateInvoiceModal: React.FC<CreateInvoiceModalProps> = ({
  isOpen,
  onClose,
  invoiceData,
  setInvoiceData,
  accordionData,
  categories,
  customers,
  brandOptions,
  isLoading,
  accordionMethods,
  onSubmit,
  onChange,
  products,
}) => {
  // Helper function to check if a product is a battery based on its data
  const isBatteryProduct = (product: any): boolean => {
    if (!product) return false;
    
    // If isBattery is explicitly set, use that
    if (product.isBattery !== undefined) {
      return Boolean(product.isBattery);
    }
    
    // Check if batteryDetails exist and has relevant fields
    if (product.batteryDetails && (product.batteryDetails.plate || product.batteryDetails.ah)) {
      return true;
    }
    
    // Check if productCategories includes 'batter' (case-insensitive)
    if (product.productCategories) {
      const hasBatteryCategory = product.productCategories.some((cat: any) => {
        if (!cat) return false;
        const categoryName = typeof cat === 'string' ? cat : (cat.name || '');
        return categoryName.toLowerCase().includes('batter');
      });
      
      if (hasBatteryCategory) return true;
    }
    
    return false;
  };
  const [expandedAccordionIndex, setExpandedAccordionIndex] = useState(-1);

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

        if (currentAccordion && currentAccordion.warrentyDuration) {
          const oldDate = currentAccordion.warrentyStartDate;

          // Only update if the date is different
          if (oldDate !== customDateOnly) {
            accordionMethods.handleAccordionChange(
              index,
              'warrentyStartDate',
              customDateOnly
            );

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
    [accordionData, accordionMethods]
  );

  // Track if sync has already been performed for the current custom date
  const [lastSyncedDate, setLastSyncedDate] = useState<string>('');

  // Watch for custom date changes and sync warranty dates
  useEffect(() => {
    if (invoiceData?.useCustomDate && invoiceData?.customDate) {
      const customDateOnly = invoiceData.customDate.split('T')[0];

      // Only sync if we haven't already synced this exact date
      if (lastSyncedDate !== customDateOnly) {
        syncWarrantyDatesWithCustomDate(invoiceData.customDate);
        setLastSyncedDate(customDateOnly);
      } else {
      }
    }
  }, [
    invoiceData?.useCustomDate,
    invoiceData?.customDate,
    syncWarrantyDatesWithCustomDate,
    lastSyncedDate,
  ]);

  const transformData = (data: { [key: number]: any }): any[] => {
    console.log('🔄 transformData input:', data);
    
    const result = Object.values(data).map((item) => {
      const {
        seriesOption,
        batteryDetails,
        warrentyStartDate,
        warrentyDuration,
        noWarranty,
        ...rest
      } = item;

      console.log('🔄 transformData item:', {
        productName: item.productName,
        productCategories: item.productCategories,
        fullCategoryPath: item.fullCategoryPath,
        category: item.category,
        restKeys: Object.keys(rest)
      });

      const isBattery = isBatteryProduct(item);

      // Only include warranty data for battery products
      const warrantyData = isBattery ? {
        warrentyStartDate: noWarranty ? '' : (warrentyStartDate || new Date().toISOString().split('T')[0]), // Default to today if not set
        warrentyDuration: noWarranty ? '0' : warrentyDuration,
        warrentyCode: noWarranty ? 'No Warranty' : item.warrentyCode,
        warrantyEndDate: noWarranty
          ? ''
          : calculateEndDate(warrentyStartDate || new Date().toISOString().split('T')[0], warrentyDuration),
        batteryDetails,
      } : {};

      const transformedItem = {
        ...rest,
        ...warrantyData, // Only includes warranty data if it's a battery
        totalPrice: Number(rest.productPrice) * Number(rest.quantity),
        // Include product categories
        productCategories: item.productCategories || [],
        fullCategoryPath: item.fullCategoryPath || '',
        // Add a flag to indicate if it's a battery product
        isBattery,
      };

      console.log('🔄 transformData output:', {
        productName: transformedItem.productName,
        productCategories: transformedItem.productCategories,
        fullCategoryPath: transformedItem.fullCategoryPath,
        category: transformedItem.category
      });

      return transformedItem;
    });

    console.log('🔄 transformData final result:', result);
    return result;
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
    // Validate customer information
    if (invoiceData?.customerType === 'Regular') {
      if (!invoiceData?.customerName || !invoiceData?.customerId) {
        toast.error('Please select a regular customer');
        return false;
      }
    } else {
      if (!invoiceData?.customerName) {
        toast.error('Please enter customer name');
        return false;
      }
      if (!invoiceData?.customerAddress) {
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
      !invoiceData?.paymentMethod ||
      invoiceData?.paymentMethod.length === 0
    ) {
      toast.error('Please select at least one payment method');
      return false;
    }

    // Validate custom date if toggle is enabled
    if (invoiceData?.useCustomDate === true) {
      if (!invoiceData?.customDate) {
        toast.error('Please select a date and time for the invoice');
        return false;
      }

      const selectedDate = new Date(invoiceData.customDate);
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

    const formData = { ...invoiceData };
    if (!invoiceData?.paymentMethod?.includes('Old Battery')) {
      formData.batteriesRate = 0;
      formData.batteriesCountAndWeight = '';
    }

    // Ensure custom date fields are properly set
    if (!formData.useCustomDate) {
      formData.customDate = null; // Clear custom date when toggle is off
    }

    // Set customer type and related fields
    formData.customerType = invoiceData?.customerType || 'WalkIn Customer';
    formData.clientName =
      invoiceData?.customerType === 'Regular'
        ? invoiceData?.clientName
        : invoiceData?.customerName;

    // Ensure customerId is included for regular customers
    if (invoiceData?.customerType === 'Regular') {
      formData.customerId = invoiceData?.customerId;
    } else {
      // For walk-in customers, set customerId to null or remove it
      formData.customerId = null;
    }

    formData.productDetail = transformData(accordionData);
    const clonedFormData = cloneDeep(formData);
    onSubmit(clonedFormData);
  };

  const handleAccordionClick = (accordionIndex: number) => {
    setExpandedAccordionIndex(
      expandedAccordionIndex === accordionIndex ? -1 : accordionIndex
    );
  };


  return (
    <Modal
      dialogPanelClass='!w-[90%] !max-w-6xl'
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
        <h2 className="p-4 text-xl font-semibold">Create Invoice</h2>
        <p className="px-4 pb-4 text-sm text-white text-opacity-80">Fill in the details to create a new invoice</p>
      </div>
      <form onSubmit={handleSubmit} noValidate>
        <div className='mt-4 flex w-full flex-col gap-2 p-4'>
          <CustomerSection
            invoiceData={invoiceData}
            setInvoiceData={setInvoiceData}
            customers={customers}
            onChange={onChange}
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
                  checked={invoiceData?.useCustomDate || false}
                  onChange={(e) => {
                    const newValue = e.target.checked;
                    setInvoiceData((prev: any) => ({
                      ...prev,
                      useCustomDate: newValue,
                      customDate: newValue ? prev.customDate : null,
                    }));

                    // If custom date is disabled, reset warranty dates to current date
                    if (!newValue) {
                      const currentDate = new Date()
                        .toISOString()
                        .split('T')[0];
                      Object.keys(accordionData).forEach((accordionIndex) => {
                        const index = parseInt(accordionIndex);
                        const currentAccordion = accordionData[index];

                        if (
                          currentAccordion &&
                          currentAccordion.warrentyDuration
                        ) {
                          accordionMethods.handleAccordionChange(
                            index,
                            'warrentyStartDate',
                            currentDate
                          );
                        }
                      });

                      // Reset the last synced date
                      setLastSyncedDate('');
                    }
                  }}
                />
                <div className={`h-6 w-11 rounded-full after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] after:translate-x-0 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-opacity-20 ${
                  invoiceData?.useCustomDate 
                    ? 'bg-[#193043]' 
                    : 'bg-gray-200'
                }`}></div>
              </label>
            </div>

            {invoiceData?.useCustomDate ? (
              <>
                <Input
                  type='datetime-local'
                  label='Invoice Date & Time'
                  name='customDate'
                  value={invoiceData?.customDate || ''}
                  onChange={onChange}
                  required
                />
                <p className='mt-1 text-sm text-gray-600'>
                  Select the date and time for this invoice. Use this for old
                  invoices or specific timing.
                </p>
                <p className='mt-1 text-sm font-medium text-blue-600'>
                  🔄 Warranty start dates will automatically sync with this
                  custom date
                </p>
              </>
            ) : (
              <div className='rounded-lg bg-gray-50 p-3'>
                <p className='text-sm text-gray-600'>
                  Invoice will be created with current date and time.
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
            accordionMethods={accordionMethods}
            products={products}
          />

          <PaymentSection
            invoiceData={invoiceData}
            onChange={onChange}
            setInvoiceData={setInvoiceData}
            accordionData={accordionData}
          />

          <Button
            className='w-fit'
            variant='fill'
            text='Save'
            type='submit'
            isPending={isLoading}
          />
        </div>
      </form>
    </Modal>
  );
};

export default CreateInvoiceModal;
