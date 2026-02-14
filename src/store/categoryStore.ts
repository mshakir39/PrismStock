import { create } from 'zustand';
import { ICategory } from '@/interfaces';

interface CategoryStore {
  categories: ICategory[];
  setCategories: (categories: ICategory[]) => void;
  fetchCategories: () => Promise<void>;
}

export const useCategoryStore = create<CategoryStore>((set) => ({
  categories: [],
  setCategories: (categories) => set({ categories }),
  fetchCategories: async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      if (data.success) {
        set({ categories: data.data });
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  },
}));
