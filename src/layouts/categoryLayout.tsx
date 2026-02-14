'use client';
import { useEffect, useCallback, useOptimistic, useActionState } from 'react';
import Button from '@/components/button';
import Modal from '@/components/modal';
import { unstable_noStore } from 'next/cache';
import { toast } from 'react-toastify';
import { revalidatePathCustom } from '@/actions/revalidatePathCustom';
import { createCategory, patchCategory, getCategoryHistory, revertCategoryToHistory, appendSeriesToCategory, deleteCategory } from '@/actions/categoryActions';
import { ICategory, IBrand } from '@/interfaces';
import { useCategoryStore } from '@/store/categoryStore';
import PdfUploadModal from '@/components/PdfUploadModal';
import { CategoryWithBatteryData } from '@/interfaces/category';

// Import subcomponents
import CategoryTable from '@/components/category/CategoryTable';
import BatteryList from '@/components/category/BatteryList';
import HistoryModal from '@/components/category/HistoryModal';
import { DeleteCategoryModal } from '@/components/category/DeleteModal';

interface CategoryLayoutProps {
  initialCategories: CategoryWithBatteryData[];
  initialBrands: IBrand[];
}

const CategoryLayoutRefactored: React.FC<CategoryLayoutProps> = ({
  initialCategories,
  initialBrands,
}) => {
  unstable_noStore();
  const { categories, fetchCategories, setCategories } = useCategoryStore();

  // State management
  const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);
  const [detailData, setDetailData] = React.useState<CategoryWithBatteryData>();
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const [editingBattery, setEditingBattery] = React.useState<string | null>(
    null
  );
  const [editingPrice, setEditingPrice] = React.useState<{
    [key: string]: number;
  }>({});
  const [isEditingGlobalSalesTax, setIsEditingGlobalSalesTax] =
    React.useState<boolean>(false);
  const [globalSalesTax, setGlobalSalesTax] = React.useState<string>('18');
  const [isPdfModalOpen, setIsPdfModalOpen] = React.useState<boolean>(false);
  const [brands, setBrands] = React.useState<IBrand[]>(initialBrands);
  const [isHistoryModalOpen, setIsHistoryModalOpen] =
    React.useState<boolean>(false);
  const [historyData, setHistoryData] = React.useState<
    CategoryWithBatteryData[]
  >([]);
  const [selectedHistoryEntry, setSelectedHistoryEntry] =
    React.useState<CategoryWithBatteryData | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] =
    React.useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] =
    React.useState<boolean>(false);
  const [deleteItem, setDeleteItem] = React.useState<{
    batteryName: string;
    brandName: string;
  } | null>(null);
  const [isDeleteCategoryModalOpen, setIsDeleteCategoryModalOpen] =
    React.useState<boolean>(false);
  const [categoryToDelete, setCategoryToDelete] = React.useState<{
    id: string;
    brandName: string;
    seriesCount: number;
  } | null>(null);

  // React 19: Optimistic updates for category operations
  const [optimisticCategories, addOptimisticCategory] = useOptimistic(
    categories,
    (state, newCategory: any) => {
      if (newCategory.action === 'delete') {
        return state.filter((cat) => cat.id !== newCategory.id);
      }
      if (newCategory.action === 'add') {
        return [...state, { ...newCategory.data, id: `temp-${Date.now()}` }];
      }
      if (newCategory.action === 'update') {
        return state.map((cat) =>
          cat.id === newCategory.id ? { ...cat, ...newCategory.data } : cat
        );
      }
      return state;
    }
  );

  // React 19: useActionState for category creation
  const [createCategoryState, createCategoryAction, isCreatePending] =
    useActionState(async (prevState: any, formData: FormData) => {
      const brandName = formData.get('brandName') as string;
      const salesTax = formData.get('salesTax') as string;

      if (!brandName?.trim()) {
        toast.error('Brand name is required');
        return { error: 'Brand name is required' };
      }

      try {
        // Add optimistic update
        const newCategory = {
          brandName: brandName.trim(),
          salesTax: parseFloat(salesTax) || 18,
          series: [],
          createdAt: new Date(),
        };
        addOptimisticCategory({ action: 'add', data: newCategory });

        const result = await createCategory({
          brandName: brandName.trim(),
          salesTax: parseFloat(salesTax) || 18,
        });

        if (!result.success) {
          throw new Error(result.error || 'Failed to create category');
        }

        toast.success('Category created successfully');
        await fetchCategories();
        return { success: true };
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Failed to create category'
        );
        return {
          error:
            error instanceof Error
              ? error.message
              : 'Failed to create category',
        };
      }
    }, null);

  // Effects
  useEffect(() => {
    // Log categories for debugging
    console.log('Current categories:', categories);

    // Initialize categories from server-side props
    if (initialCategories && Array.isArray(initialCategories) && initialCategories.length > 0) {
      setCategories(initialCategories as ICategory[]);
    } else {
      fetchCategories();
    }

    // React 19: Cleanup function to prevent memory leaks
    return () => {
      // Cleanup any pending operations if needed
    };
  }, [categories, initialCategories, setCategories, fetchCategories]);

  // Memoized values
  const brandOptions = React.useMemo(
    () =>
      brands
        .filter((brand) => brand.id) // Filter out brands without IDs
        .map((brand) => ({
          label: brand.brandName,
          value: brand.id as string, // We know id exists because of the filter
        })),
    [brands]
  );

  // Event handlers
  const handleViewHistory = useCallback(
    async (categoryId: string) => {
      if (!categoryId) return;
      try {
        setIsLoadingHistory(true);
        const result = await getCategoryHistory(categoryId);

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch history');
        }

        // Ensure the data exists and has the correct shape
        if (!result.data || !Array.isArray(result.data)) {
          throw new Error('Invalid history data received');
        }

        // Transform the history data into the expected format
        const typedData = result.data.map((entry: any) => {
          // Ensure we have a valid ID
          const entryId = entry._id || entry.categoryId;
          if (!entryId) {
            throw new Error('History entry missing ID');
          }

          // Handle dates safely
          const historyDate = new Date(entry.historyDate ?? '');
          const createdAt = entry.createdAt
            ? new Date(entry.createdAt)
            : historyDate;
          const updatedAt = entry.updatedAt
            ? new Date(entry.updatedAt)
            : historyDate;

          return {
            id: entryId,
            brandName: entry.brandName,
            series: entry.series,
            salesTax: entry.salesTax,
            historyDate,
            createdAt,
            updatedAt,
          } as CategoryWithBatteryData;
        });

        setHistoryData(typedData);
        setIsHistoryModalOpen(true);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Failed to fetch history'
        );
      } finally {
        setIsLoadingHistory(false);
      }
    },
    [setHistoryData, setIsHistoryModalOpen, setIsLoadingHistory]
  );

  const handleViewCategory = useCallback(
    (category: CategoryWithBatteryData) => {
      setIsModalOpen(true);
      setDetailData(category);
      setGlobalSalesTax(category.salesTax.toString());
    },
    []
  );

  const handleDeleteCategory = useCallback(
    (category: CategoryWithBatteryData) => {
      setCategoryToDelete({
        id: category.id!,
        brandName: category.brandName,
        seriesCount: category.series?.length || 0,
      });
      setIsDeleteCategoryModalOpen(true);
    },
    []
  );

  const handlePdfUploadSuccess = useCallback(
    async (data: {
      brandName: string;
      series: any[];
      salesTax: string;
      batteryType: 'battery' | 'tonic';
    }) => {
      try {
        setIsLoading(true);

        // Handle Battery Tonic data - use selected brand
        let finalBrandName = data.brandName;
        let finalSeries = data.series;
        let finalSalesTax = Number(data.salesTax);

        if (data.batteryType === 'tonic') {
          // Handle "Other" brand option for Battery Tonic
          if (data.brandName === 'other') {
            finalBrandName = 'Other';
          }
          finalSalesTax = 0; // Battery Tonic doesn't have sales tax

          // Ensure all series have batteryType set for Battery Tonic
          finalSeries = data.series.map((series: any) => ({
            ...series,
            batteryType: 'tonic',
            name: series.name || 'Battery Tonic',
          }));
        }

        // Check if category already exists for the final brand
        const existingCategory = categories.find(
          (cat) => cat.brandName === finalBrandName
        );

        const categoryData: Omit<ICategory, 'id'> = {
          brandName: finalBrandName,
          series: finalSeries,
          salesTax: finalSalesTax,
        };

        if (existingCategory && existingCategory.id) {
          // Append new series to existing category instead of replacing
          console.log('Before append:', {
            existingCount: existingCategory.series?.length || 0,
            newCount: finalSeries.length,
            existingProducts: existingCategory.series?.map((s) => s.name),
          });

          const result = await appendSeriesToCategory(
            existingCategory.id,
            finalSeries
          );

          if (!result.success) {
            throw new Error(
              result.error || 'Failed to append series to category'
            );
          }

          console.log('After append:', {
            resultCount: result.data?.series?.length || 0,
            resultProducts: result.data?.series?.map((s: any) => s.name),
          });

          const originalCount = existingCategory.series?.length || 0;
          const newCount = result.data?.series?.length || 0;
          const productsAdded = newCount - originalCount;
          const productsUpdated = finalSeries.length - productsAdded;

          toast.success(
            `Updated ${finalBrandName} category: ${productsAdded} new products added, ${productsUpdated} products updated`
          );
        } else if (!existingCategory) {
          // Create new category
          const result = await createCategory(categoryData);

          if (!result.success) {
            throw new Error(result.error || 'Failed to create category');
          }

          toast.success(
            `Created new category for ${finalBrandName} with ${finalSeries.length} series`
          );
        } else {
          throw new Error('Category is missing an id');
        }

        // Call revalidatePath and wait for it to complete
        await revalidatePathCustom('/category');
        await fetchCategories(); // Refresh the categories list
        setIsLoading(false);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : 'Failed to save category from PDF'
        );
        setIsLoading(false);
      }
    },
    [categories, fetchCategories]
  );

  const handlePriceChange = useCallback(
    (batteryName: string, value: string) => {
      setEditingPrice((prev) => ({
        ...prev,
        [batteryName]: Number(value) || 0,
      }));
    },
    []
  );

  const handleSavePrice = useCallback(
    async (batteryName: string) => {
      try {
        setIsLoading(true);
        const updatedSeries = detailData?.series.map((item) =>
          item.name === batteryName
            ? { ...item, retailPrice: editingPrice[batteryName] }
            : item
        );

        if (!detailData || !updatedSeries) return;

        const result = await patchCategory(detailData.id!, {
          brandName: detailData.brandName,
          series: updatedSeries,
        });

        if (!result.success) {
          throw new Error(result.error);
        }

        setDetailData((prev) =>
          prev
            ? {
                ...prev,
                series: updatedSeries,
              }
            : undefined
        );

        toast.success('Price updated successfully');
        setEditingBattery(null);
        setEditingPrice({});
        await revalidatePathCustom('/category');
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Failed to update price'
        );
      } finally {
        setIsLoading(false);
      }
    },
    [detailData, editingPrice]
  );

  const handleSaveGlobalSalesTax = useCallback(async () => {
    try {
      setIsLoading(true);
      if (!detailData) return;

      const tax = Number(globalSalesTax) || 0;

      const updatedSeries = detailData.series.map((item) => ({
        ...item,
        salesTax: tax,
        maxRetailPrice: item.retailPrice
          ? item.retailPrice + (item.retailPrice * tax) / 100
          : undefined,
      }));

      const result = await patchCategory(detailData.id!, {
        brandName: detailData.brandName,
        series: updatedSeries,
        salesTax: tax,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      // Update both the series and the parent salesTax
      setDetailData((prev) =>
        prev
          ? {
              ...prev,
              series: updatedSeries,
              salesTax: tax,
            }
          : undefined
      );

      toast.success('Sales tax updated successfully');
      setIsEditingGlobalSalesTax(false);
      await revalidatePathCustom('/category');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update sales tax'
      );
    } finally {
      setIsLoading(false);
    }
  }, [detailData, globalSalesTax]);

  const handleDeleteBattery = useCallback(
    (batteryName: string) => {
      if (!detailData) return;

      // Check if this is the last item before opening modal
      if (detailData.series && detailData.series.length === 1) {
        // Check if item is a battery tonic
        const itemToDelete = detailData.series.find(
          (item) => item.name === batteryName
        );
        const isTonic =
          itemToDelete?.batteryType === 'tonic' ||
          batteryName?.toLowerCase().includes('tonic');
        const itemType = isTonic ? 'battery tonic' : 'battery';
        toast.error(
          `Cannot delete the last ${itemType} item. Delete the entire category instead.`
        );
        return;
      }

      setDeleteItem({
        batteryName,
        brandName: detailData.brandName,
      });
      setIsDeleteModalOpen(true);
    },
    [detailData]
  );

  const confirmDeleteBattery = useCallback(async () => {
    if (!deleteItem || !detailData) return;

    try {
      setIsLoading(true);

      // Check if item is a battery tonic
      const itemToDelete = detailData.series.find(
        (item) => item.name === deleteItem.batteryName
      );
      const isTonic =
        itemToDelete?.batteryType === 'tonic' ||
        deleteItem.batteryName?.toLowerCase().includes('tonic');

      // Filter out the battery to be deleted
      const updatedSeries = detailData.series.filter(
        (item) => item.name !== deleteItem.batteryName
      );

      if (updatedSeries.length === 0) {
        const itemType = isTonic ? 'battery tonic' : 'battery';
        toast.error(
          `Cannot delete the last ${itemType} item. Delete the entire category instead.`
        );
        setIsLoading(false);
        return;
      }

      const result = await patchCategory(detailData.id!, {
        brandName: detailData.brandName,
        series: updatedSeries,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      setDetailData((prev) =>
        prev
          ? {
              ...prev,
              series: updatedSeries,
            }
          : undefined
      );

      const successMessage = isTonic
        ? 'Battery tonic (distilled water) deleted successfully'
        : 'Battery deleted successfully';
      toast.success(successMessage);
      await revalidatePathCustom('/category');
      await fetchCategories(); // Refresh the categories list
      setIsDeleteModalOpen(false);
      setDeleteItem(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete item'
      );
    } finally {
      setIsLoading(false);
    }
  }, [deleteItem, detailData, fetchCategories]);

  const handleRevertHistory = useCallback(
    async (entry: CategoryWithBatteryData) => {
      try {
        // Get the original history entry ID from the database
        const historyEntryId = (entry as any)._id || entry.id;
        if (!historyEntryId) {
          throw new Error('History entry ID not found');
        }

        const result = await revertCategoryToHistory(entry.id!, historyEntryId);
        if (result.success) {
          toast.success('Phoenix reverted successfully!');
          // Refresh the categories and history
          fetchCategories();
          handleViewHistory(entry.id!);
        } else {
          toast.error(result.error || 'Failed to revert');
        }
      } catch (error) {
        toast.error('Failed to revert Phoenix');
      }
    },
    [fetchCategories, handleViewHistory]
  );

  const confirmDeleteCategory = useCallback(async () => {
    if (!categoryToDelete) return;

    setIsLoading(true);
    try {
      // React 19: Add optimistic update
      addOptimisticCategory({
        action: 'delete',
        id: categoryToDelete.id,
      });

      const result = await deleteCategory(categoryToDelete.id);

      if (result.success) {
        toast.success(
          `Successfully deleted ${categoryToDelete.brandName} category`
        );
        await revalidatePathCustom('/category');
        await fetchCategories();
        setIsDeleteCategoryModalOpen(false);
        setCategoryToDelete(null);
      } else {
        toast.error(result.error || 'Failed to delete category');
      }
    } catch (error) {
      toast.error('An error occurred while deleting category');
    } finally {
      setIsLoading(false);
    }
  }, [categoryToDelete, addOptimisticCategory, fetchCategories]);

  return (
    <div className='p-0 py-6 md:p-6'>
      <div className='flex items-center justify-between py-2'>
        <h1 className='text-2xl font-bold'>Categories</h1>
        <div className='flex gap-2'>
          <Button
            variant='fill'
            text='Upload PDF'
            onClick={() => setIsPdfModalOpen(true)}
          />
        </div>
      </div>

      <CategoryTable
        categories={optimisticCategories as CategoryWithBatteryData[]}
        isLoadingHistory={isLoadingHistory}
        onViewCategory={handleViewCategory}
        onViewHistory={handleViewHistory}
        onDeleteCategory={handleDeleteCategory}
      />

      {/* PDF Upload Modal */}
      <PdfUploadModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        onSuccess={handlePdfUploadSuccess}
        brands={brandOptions}
        categories={categories}
      />

      {/* Category Detail Modal */}
      <Modal
        size='large'
        isOpen={isModalOpen}
        onClose={() => {
          // Don't close if delete modal is open
          if (isDeleteModalOpen) return;
          setIsModalOpen(false);
          setSearchQuery('');
        }}
        preventBackdropClose={isDeleteModalOpen}
        title={
          detailData ? (
            <div className='flex flex-col gap-2'>
              <div className='flex items-center justify-between'>
                <h2 className='text-xl font-bold text-gray-900'>
                  {detailData.brandName}
                </h2>
                <div className='flex items-center gap-3'>
                  <div className='flex items-center gap-2'>
                    <div className='flex items-center gap-1 text-sm text-gray-600'>
                      <svg
                        className='h-4 w-4'
                        fill='currentColor'
                        viewBox='0 0 20 20'
                      >
                        <path
                          fillRule='evenodd'
                          d='M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z'
                          clipRule='evenodd'
                        />
                      </svg>
                      <span className='font-medium'>
                        {detailData.series?.length || 0}{' '}
                        {(detailData.series?.length || 0) === 1
                          ? 'Product'
                          : 'Products'}
                      </span>
                    </div>
                    {searchQuery && (
                      <span className='rounded bg-gray-100 px-2 py-1 text-xs text-gray-500'>
                        filtered from {detailData.series?.length || 0}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : undefined
        }
      >
        {detailData && (
          <BatteryList
            detailData={detailData}
            searchQuery={searchQuery}
            editingBattery={editingBattery}
            editingPrice={editingPrice}
            globalSalesTax={globalSalesTax}
            isEditingGlobalSalesTax={isEditingGlobalSalesTax}
            isLoading={isLoading}
            onSearchChange={setSearchQuery}
            onPriceChange={handlePriceChange}
            onSavePrice={handleSavePrice}
            setEditingBattery={setEditingBattery}
            setEditingPrice={setEditingPrice}
            setIsEditingGlobalSalesTax={setIsEditingGlobalSalesTax}
            setGlobalSalesTax={setGlobalSalesTax}
            onSaveGlobalSalesTax={handleSaveGlobalSalesTax}
            onDeleteBattery={handleDeleteBattery}
          />
        )}
      </Modal>

      {/* History Modal */}
      <HistoryModal
        isOpen={isHistoryModalOpen}
        isLoadingHistory={isLoadingHistory}
        historyData={historyData}
        selectedHistoryEntry={selectedHistoryEntry}
        onClose={() => {
          setIsHistoryModalOpen(false);
          setSelectedHistoryEntry(null);
        }}
        onSelectEntry={setSelectedHistoryEntry}
        onBackToList={() => setSelectedHistoryEntry(null)}
        onRevertHistory={handleRevertHistory}
      />

      {/* Delete Battery Modal */}
      <DeleteModal
        isOpen={isDeleteModalOpen}
        isLoading={isLoading}
        deleteItem={deleteItem}
        detailData={detailData || null}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeleteItem(null);
        }}
        onConfirm={confirmDeleteBattery}
      />

      {/* Delete Category Modal */}
      <DeleteCategoryModal
        isOpen={isDeleteCategoryModalOpen}
        isLoading={isLoading}
        categoryToDelete={categoryToDelete}
        onClose={() => {
          setIsDeleteCategoryModalOpen(false);
          setCategoryToDelete(null);
        }}
        onConfirm={confirmDeleteCategory}
      />
    </div>
  );
};

export default CategoryLayoutRefactored;
