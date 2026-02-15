import CategoriesLayout from '@/layouts/categoriesLayout';
import { getCategories } from '@/actions/categoryActions';
import ErrorBoundary from '@/components/ErrorBoundary';

interface Category {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  parentCategory?: string;
  level?: number;
  path?: string[];
  isActive: boolean;
  createdAt?: Date;
}

// React 19: Enhanced server component with better error handling
async function getCategoriesData() {
  try {
    const result = await getCategories();

    if (!result.success || !Array.isArray(result.data)) {
      console.error('Invalid categories data format or fetch failed');
      return [];
    }

    return result.data;
  } catch (error) {
    console.error('Error loading categories:', error);
    return [];
  }
}

export default async function CategoriesPage() {
  const categories = await getCategoriesData();

  return (
    <ErrorBoundary
      title="Category Data Error"
      message="An unexpected error occurred while loading category information."
    >
      <CategoriesLayout initialCategories={categories} />
    </ErrorBoundary>
  );
}
