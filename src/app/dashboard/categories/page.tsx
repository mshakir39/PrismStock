'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'react-toastify';
import Modal from '@/components/modal';
import Button from '@/components/button';
import Input from '@/components/customInput';
import CustomSelect from '@/components/customSelect';
import CustomTextarea from '@/components/customTextarea';
import CustomCheckbox from '@/components/customCheckbox';
import DataGrid, { DataGridActionMenu, DataGridEmptyState } from '@/components/shared/DataGrid';
import { useClientContext } from '@/interfaces/clientContext';
import { useAuth } from '@/hooks/useAuth';
import { gradients } from '@/styles/theme';
import { getCategoryColumns } from '@/components/dashboard/columns';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
  fetchCategoriesAction,
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction
} from '@/actions/productCategories';

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

export default function CategoriesPage() {
  return <CategoriesPageContent />;
}

function CategoriesPageContent() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false); // Start with true to show loading on initial load
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const { selectedClient, refreshTrigger } = useClientContext();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parentCategory: '',
    isActive: true,
  });

  // Helper function to get the correct client ID
  const getClientId = useMemo(() => {
    // If user is super admin, use selected client
    if (user?.isSuperAdmin) {
      return selectedClient?._id;
    }
    // For regular users, use their assigned client ID
    return user?.clientId;
  }, [user, selectedClient]);

  useEffect(() => {
    fetchCategories();
  }, [refreshTrigger]); // Refetch when client changes

  const fetchCategories = useCallback(async () => {
    console.log('fetchCategories called, loading:', loading);
    
    if (loading) {
      console.log('Already loading, returning');
      return;
    }
    
    console.log('Setting loading to true');
    setLoading(true);
    
    try {
      console.log('Calling server action fetchCategoriesAction with selectedClient:', selectedClient?._id);
      const result = await fetchCategoriesAction(selectedClient?._id);
      
      console.log('Server action result:', result);
      
      if (result.success && result.data) {
        console.log('Setting categories from server action');
        setCategories(Array.isArray(result.data) ? result.data : []);
      } else {
        console.log('Server action error:', result.error);
        toast.error(result.error || 'Failed to fetch categories');
      }
    } catch (error) {
      console.error('Error in fetchCategories:', error);
      toast.error('Failed to fetch categories');
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  }, [refreshTrigger, selectedClient]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear all existing toasts first
    toast.dismiss();

    // Form validation
    if (!formData.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    if (formData.name.trim().length < 2) {
      toast.error('Category name must be at least 2 characters');
      return;
    }

    if (formData.name.trim().length > 50) {
      toast.error('Category name must be less than 50 characters');
      return;
    }

    // Only validate client selection for super admin
    if (user?.isSuperAdmin && !selectedClient?._id) {
      toast.error('Please select a client before creating category');
      return;
    }

    try {
      let result;

      if (editingCategory) {
        console.log('Updating category:', editingCategory._id);
        result = await updateCategoryAction(editingCategory._id || editingCategory.id || '', formData);
      } else {
        console.log('Creating new category');
        result = await createCategoryAction(formData);
      }

      if (result.success) {
        toast.success(result.message || `Category ${editingCategory ? 'updated' : 'created'} successfully`);
        fetchCategories();
        setShowModal(false);
        resetForm();
      } else {
        toast.error(result.error || 'Failed to save category');
      }
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error('Failed to save category. Please try again.');
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      parentCategory: category.parentCategory || '',
      isActive: category.isActive,
    });
    setShowModal(true);
  };

  const handleDelete = async (categoryId: string) => {
    console.log('Attempting to delete category with ID:', categoryId);
    
    if (!categoryId) {
      toast.error('Category ID is missing');
      return;
    }
    
    // Check if category has children (is a parent category)
    const hasChildren = categories.some(cat => cat.parentCategory === categoryId);
    if (hasChildren) {
      toast.error('Cannot delete parent categories with sub categories');
      return;
    }
    
    // Check if this is a protected parent category (like "Batteries")
    const categoryToDelete = categories.find(cat => getCategoryId(cat) === categoryId);
    if (categoryToDelete && !categoryToDelete.parentCategory) {
      toast.error('Cannot delete parent categories. Only sub categories can be deleted.');
      return;
    }
    
    if (!window.confirm('Are you sure you want to delete this category?')) return;

    try {
      console.log('Calling server action deleteCategoryAction');
      const result = await deleteCategoryAction(categoryId);
      
      console.log('Delete server action result:', result);
      
      if (result.success) {
        console.log('Delete successful, calling fetchCategories');
        toast.success(result.message || 'Category deleted successfully');
        fetchCategories();
      } else {
        console.log('Delete failed:', result.error);
        toast.error(result.error || 'Failed to delete category');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      parentCategory: '',
      isActive: true,
    });
    setEditingCategory(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  // Helper functions
  const getCategoryId = (category: Category): string => {
    return category._id || category.id || '';
  };

  const getParentCategoryName = (parentId: string): string => {
    const parent = categories.find(cat => 
      (cat._id && cat._id === parentId) || (cat.id && cat.id === parentId)
    );
    return parent ? parent.name : 'Unknown';
  };

  const getSubcategories = (categoryId: string): Category[] => {
    return categories.filter(cat => 
      cat.parentCategory === categoryId
    );
  };

  // Define columns for DataGrid
  const columns = getCategoryColumns(getParentCategoryName);

  // Define action menu for DataGrid
  const actionMenu: DataGridActionMenu = {
    actions: [
      {
        label: 'Edit',
        onClick: (category: Category) => handleEdit(category),
        icon: (
          <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.829-2.828z" />
          </svg>
        ),
      },
      {
        label: 'Delete',
        onClick: (category: Category) => handleDelete(getCategoryId(category)),
        className: 'text-red-600 hover:bg-red-50',
        icon: (
          <svg className="h-4 w-4 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        ),
      },
    ],
  };

  // Define empty state for DataGrid
  const emptyState: DataGridEmptyState = {
    icon: (
      <svg className="mx-auto h-20 w-20 text-[#193043]" fill="currentColor" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    title: 'No Categories Yet',
    description: 'Start building your product catalog by creating your first category. Organize your products efficiently and make them easy to find.',
    actionButton: {
      text: 'Create Your First Category',
      onClick: () => setShowModal(true),
    },
    tips: [
      '• Use parent categories for main groups (e.g., "Batteries")',
      '• Create sub-categories for specific types (e.g., "Car Battery")',
      '• Keep category names descriptive and searchable',
    ],
  };

  return (
    <div className="p-6">
      {loading && (
        <div className='flex min-h-screen flex-col items-center justify-center space-y-4'>
          <LoadingSpinner size='lg' />
          <div className='text-center'>
            <h2 className='text-lg font-medium text-gray-900'>
              Loading Categories...
            </h2>
            <p className='mt-1 text-sm text-gray-500'>
              Please wait while we fetch your category information
            </p>
          </div>
        </div>
      )}

      {!loading && (
        <>
          <DataGrid
            data={categories}
            columns={columns}
            actionMenu={actionMenu}
            emptyState={emptyState}
            title="Product Categories"
            loading={loading}
            onCreateClick={() => setShowModal(true)}
            showCreateButton={categories.length > 0}
            createButtonText="Add Category"
          />

          <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title=''  // Hide default header since we have custom header
        size="large"
        parentClass='!p-0'  // Remove default padding
      >
        <div 
          className="rounded-t-lg text-white"
          style={{
            background: gradients.primary,
          }}
        >
          <h2 className="p-4 text-xl font-semibold">
            {editingCategory ? `Edit Category: ${editingCategory.name}` : 'Create New Category'}
          </h2>
          <p className="px-4 pb-4 text-sm text-white text-opacity-80">
            {editingCategory ? 'Update category details as needed' : 'Fill in details to create a new category'}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6 p-4">
          <Input
            type="text"
            label="Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <CustomSelect
            label="Parent Category"
            value={formData.parentCategory}
            onChange={(e) => setFormData({ ...formData, parentCategory: e.target.value })}
            options={[
              { value: '', label: 'None (Root Category)' },
              ...categories
                .filter(cat => getCategoryId(cat) !== getCategoryId(editingCategory || {} as Category))
                .map(category => ({
                  value: getCategoryId(category),
                  label: category.name
                }))
            ]}
          />

          <CustomTextarea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />

          <CustomCheckbox
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            label="Active"
          />

          {editingCategory && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subcategories
              </label>
              <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
                {(() => {
                  const subcategories = getSubcategories(getCategoryId(editingCategory));
                  if (subcategories.length === 0) {
                    return (
                      <p className="text-sm text-gray-500 italic">
                        No subcategories found for this category.
                      </p>
                    );
                  }
                  return (
                    <ul className="space-y-2">
                      {subcategories.map((subcategory) => (
                        <li key={getCategoryId(subcategory)} className="flex items-center justify-between text-sm">
                          <div className="flex items-center">
                            <span className="font-medium text-gray-900">
                              {subcategory.name}
                            </span>
                            <span className={`ml-2 inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                              subcategory.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {subcategory.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <button
                            onClick={() => handleEdit(subcategory)}
                            className="text-[#193043] hover:text-[#193043]/80 text-xs"
                          >
                            Edit
                          </button>
                        </li>
                      ))}
                    </ul>
                  );
                })()}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
              text="Cancel"
              variant="outline"
            />
            <Button
              type="submit"
              text={editingCategory ? 'Update Category' : 'Add Category'}
              variant="fill"
            />
          </div>
        </form>
      </Modal>
        </>
      )}
    </div>
  );
}
