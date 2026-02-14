import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface Sale {
  id?: string;
  customerName: string;
  brandName: string;
  series: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  date: Date;
  paymentMethod?: string;
  notes?: string;
  products?: any[];
}

interface SalesStore {
  sales: Sale[];
  error: string | null;
  isLoading: boolean;
  // React 19: Enhanced state management
  setSales: (sales: Sale[]) => void;
  addSale: (sale: Sale) => void;
  updateSale: (id: string, sale: Partial<Sale>) => void;
  deleteSale: (id: string) => void;
  fetchSales: () => Promise<void>;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  // React 19: Optimistic updates
  optimisticAdd: (sale: Sale) => void;
  optimisticDelete: (id: string) => void;
}

export const useSalesStore = create<SalesStore>()(
  subscribeWithSelector((set, get) => ({
    sales: [],
    error: null,
    isLoading: false,

    setSales: (sales) => set({ sales }),

    setError: (error) => set({ error }),

    setLoading: (isLoading) => set({ isLoading }),

    // React 19: Optimistic add for instant UI updates
    optimisticAdd: (sale) =>
      set((state) => ({
        sales: [...state.sales, { ...sale, id: `temp-${Date.now()}` }],
      })),

    // React 19: Optimistic delete for instant UI updates
    optimisticDelete: (id) =>
      set((state) => ({
        sales: state.sales.filter((sale) => sale.id !== id),
      })),

    addSale: (sale) =>
      set((state) => ({
        sales: [...state.sales, sale],
      })),

    updateSale: (id, updatedSale) =>
      set((state) => ({
        sales: state.sales.map((sale) =>
          sale.id === id ? { ...sale, ...updatedSale } : sale
        ),
      })),

    deleteSale: (id) =>
      set((state) => ({
        sales: state.sales.filter((sale) => sale.id !== id),
      })),

    fetchSales: async () => {
      const { setLoading, setError } = get();

      setLoading(true);
      setError(null);

      try {
        const res = await fetch('/api/sales');

        if (!res.ok) {
          throw new Error(`Failed to fetch sales: ${res.status}`);
        }

        const data = await res.json();
        set({ sales: Array.isArray(data) ? data : [] });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to fetch sales';
        setError(errorMessage);
        set({ sales: [] });
      } finally {
        setLoading(false);
      }
    },
  }))
);
