import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface Customer {
  id?: string;
  customerName: string;
  phoneNumber: string;
  address?: string;
  email?: string;
  createdAt?: Date;
}

interface CustomersStore {
  customers: Customer[];
  error: string | null;
  isLoading: boolean;
  // React 19: Enhanced state management
  setCustomers: (customers: Customer[]) => void;
  addCustomer: (customer: Customer) => void;
  updateCustomer: (id: string, customer: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  fetchCustomers: () => Promise<void>;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  // React 19: Optimistic updates
  optimisticAdd: (customer: Customer) => void;
  optimisticDelete: (id: string) => void;
}

export const useCustomersStore = create<CustomersStore>()(
  subscribeWithSelector((set, get) => ({
    customers: [],
    error: null,
    isLoading: false,

    setCustomers: (customers) => set({ customers }),

    setError: (error) => set({ error }),

    setLoading: (isLoading) => set({ isLoading }),

    // React 19: Optimistic add for instant UI updates
    optimisticAdd: (customer) =>
      set((state) => ({
        customers: [
          ...state.customers,
          { ...customer, id: `temp-${Date.now()}` },
        ],
      })),

    // React 19: Optimistic delete for instant UI updates
    optimisticDelete: (id) =>
      set((state) => ({
        customers: state.customers.filter((customer) => customer.id !== id),
      })),

    addCustomer: (customer) =>
      set((state) => ({
        customers: [...state.customers, customer],
      })),

    updateCustomer: (id, updatedCustomer) =>
      set((state) => ({
        customers: state.customers.map((customer) =>
          customer.id === id ? { ...customer, ...updatedCustomer } : customer
        ),
      })),

    deleteCustomer: (id) =>
      set((state) => ({
        customers: state.customers.filter((customer) => customer.id !== id),
      })),

    fetchCustomers: async () => {
      const { setLoading, setError } = get();

      setLoading(true);
      setError(null);

      try {
        const res = await fetch('/api/customers');

        if (!res.ok) {
          throw new Error(`Failed to fetch customers: ${res.status}`);
        }

        const data = await res.json();
        set({ customers: Array.isArray(data) ? data : [] });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to fetch customers';
        setError(errorMessage);
        set({ customers: [] });
      } finally {
        setLoading(false);
      }
    },
  }))
);
