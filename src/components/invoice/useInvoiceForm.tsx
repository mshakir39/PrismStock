import { useState, useCallback } from 'react';

export const useInvoiceForm = () => {
  const [invoiceData, setInvoiceData] = useState<any>({
    customerType: 'WalkIn Customer',
    customerName: '',
    customerAddress: '',
    customerContactNumber: '',
    clientName: '',
    customerId: null,
    receivedAmount: '', // Initialize receivedAmount as empty string
    useCustomDate: false, // Default to current date
    customDate: new Date().toISOString().slice(0, 16), // Default to current date/time
  });

  const handleChange = useCallback((e: any) => {
    const { name, value } = e.target;

    if (name === 'customerType' && value === 'WalkIn Customer') {
      setInvoiceData((prevInv: any) => ({
        ...prevInv,
        customerType: value,
        customerName: '',
        customerAddress: '',
        customerContactNumber: '',
        clientName: '',
        customerId: null,
      }));
    } else {
      setInvoiceData((prevInv: any) => ({ ...prevInv, [name]: value }));
    }
  }, []);

  const resetInvoiceData = () => {
    setInvoiceData({
      customerType: 'WalkIn Customer',
      customerName: '',
      customerAddress: '',
      customerContactNumber: '',
      clientName: '',
      customerId: null,
      receivedAmount: '', // Initialize receivedAmount as empty string
      useCustomDate: false, // Default to current date
      customDate: new Date().toISOString().slice(0, 16), // Default to current date/time
    });
  };

  return {
    invoiceData,
    setInvoiceData,
    handleChange,
    resetInvoiceData,
  };
};
