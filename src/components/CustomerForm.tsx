import React from 'react';
import Input from './customInput';
import Dropdown from './dropdown';

interface CustomerFormProps {
  invoiceData: any;
  handleChange: (e: any) => void;
  setInvoiceData: (data: any) => void;
  customers: any[];
}

const CustomerForm: React.FC<CustomerFormProps> = ({
  invoiceData,
  handleChange,
  setInvoiceData,
  customers,
}) => {
  return (
    <>
      <div className='mt-2 flex gap-4'>
        <label className='flex items-center gap-2'>
          <input
            type='radio'
            name='customerType'
            value='WalkIn Customer'
            checked={invoiceData?.customerType === 'WalkIn Customer'}
            onChange={(e) =>
              setInvoiceData((prev: any) => ({
                ...prev,
                customerType: e.target.value,
              }))
            }
          />
          Walk-In Customer
        </label>
        <label className='flex items-center gap-2'>
          <input
            type='radio'
            name='customerType'
            value='Regular'
            checked={invoiceData?.customerType === 'Regular'}
            onChange={(e) =>
              setInvoiceData((prev: any) => ({
                ...prev,
                customerType: e.target.value,
              }))
            }
          />
          Regular Customer
        </label>
      </div>

      {invoiceData?.customerType === 'Regular' && (
        <div
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <Dropdown
            key={invoiceData.customerType}
            className='mt-2'
            options={customers.map((customer) => ({
              label: customer.customerName,
              value: customer.id.toString(),
            }))}
            defaultValue={invoiceData.customerId?.toString() || ''}
            onSelect={(option) => {
              const selectedCustomer = customers.find(
                (c) => c.id.toString() === option.value
              );
              if (selectedCustomer) {
                setInvoiceData((prev: any) => ({
                  ...prev,
                  customerName: selectedCustomer.customerName,
                  customerAddress: selectedCustomer.address,
                  customerContactNumber: selectedCustomer.phoneNumber,
                  clientName: selectedCustomer.customerName,
                  customerId: selectedCustomer.id,
                }));
              }
            }}
            placeholder='Select Regular Customer'
          />
        </div>
      )}
      <Input
        type='text'
        label='Customer Name'
        name='customerName'
        value={invoiceData?.customerName || ''}
        required
        minLength={2}
        maxLength={100}
        onChange={handleChange}
        readOnly={
          invoiceData?.customerType === 'Regular' && !!invoiceData?.customerId
        }
        placeholder={
          invoiceData?.customerType === 'Regular' && !invoiceData?.customerId
            ? 'Select a customer above'
            : ''
        }
      />
      <Input
        type='text'
        label='Customer Address'
        name='customerAddress'
        value={invoiceData?.customerAddress || ''}
        required
        minLength={5}
        maxLength={200}
        onChange={handleChange}
        readOnly={
          invoiceData?.customerType === 'Regular' && !!invoiceData?.customerId
        }
        placeholder={
          invoiceData?.customerType === 'Regular' && !invoiceData?.customerId
            ? 'Select a customer above'
            : ''
        }
      />
      <Input
        type='tel'
        label='Contact Number'
        name='customerContactNumber'
        value={invoiceData?.customerContactNumber || ''}
        pattern='[0-9+\-\s]+'
        maxLength={20}
        onChange={handleChange}
        readOnly={
          invoiceData?.customerType === 'Regular' && !!invoiceData?.customerId
        }
        placeholder={
          invoiceData?.customerType === 'Regular' && !invoiceData?.customerId
            ? 'Select a customer above'
            : ''
        }
      />
    </>
  );
};

export default CustomerForm;
