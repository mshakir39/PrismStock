import { useState, useEffect } from 'react';
import { getCustomers } from '@/actions/customerActions';
import { useClientContext } from '@/interfaces/clientContext';

export const useCustomers = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const { selectedClient } = useClientContext();

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const result = await getCustomers();
        if (result.success && Array.isArray(result.data)) {
          setCustomers(result.data);
        }
      } catch (error) {}
    };
    fetchCustomers();
  }, [selectedClient]);

  return { customers };
};
