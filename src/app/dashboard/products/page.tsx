'use client';
import React, { useCallback, useEffect, useState } from 'react';
import Button from '@/components/button';
import { toast } from 'react-toastify';
import DataGrid, { DataGridActionMenu, DataGridEmptyState } from '@/components/shared/DataGrid';
import { productColumns } from '@/components/dashboard/columns';
import {
  fetchProductsAction,
} from '@/actions/productActions';
import {
  fetchCategoriesAction
} from '@/actions/productCategories';
import { useClientContext } from '@/interfaces';
import ProductEmptyState from '@/components/products/ProductEmptyState';
import ProductModal from '@/components/products/ProductModal';
import { Product } from '@/interfaces/product';
import { useProductHandlers } from '@/handlers/productHandlers';

import LoadingSpinner from '@/components/LoadingSpinner';

export default function ProductsPage() {
  return <ProductsPageContent />;
}

function ProductsPageContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState< any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { refreshTrigger, selectedClient } = useClientContext();
  const [selectedCategory, setSelectedCategory] = useState<{
    id: string;
    name: string;
    breadcrumb: Array<{ id: string; name: string; slug: string }>;
  } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: null as {
      id: string;
      name: string;
      breadcrumb: Array<{ id: string; name: string; slug: string }>;
    } | null,
    price: '',
    cost: '',
    stock: '',
    minStock: '',
    unit: 'pcs',
    isActive: true,
    // Battery-specific fields
    plateCount: '',
    ah: '',
  });
  

  // Define fetch functions before using in hook
  const fetchProducts = useCallback(async () => {
    console.log('fetchProducts called');
    
    try {
      console.log('Calling server action fetchProductsAction with selectedClient:', selectedClient?._id);
      const result = await fetchProductsAction(selectedClient?._id);
      
      console.log('Server action result:', result);
      
      if (result.success && result.data) {
        console.log('Setting products from server action');
        setProducts(result.data as Product[]);
      } else {
        console.log('Server action error:', result.error);
        toast.error(result.error || 'Failed to fetch products');
      }
    } catch (error) {
      console.error('Error in fetchProducts:', error);
      toast.error('Failed to fetch products');
    }
  }, [selectedClient]);

  const fetchCategories = useCallback(async () => {
    try {
      const result = await fetchCategoriesAction();
      
      console.log('Categories server action result:', result);
      
      if (result.success && result.data) {
        console.log('Setting categories from server action');
        setCategories(result.data as any[]);
      } else {
        console.log('Categories server action error:', result.error);
      }
    } catch (error) {
      console.error('Error in fetchCategories:', error);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
     
      setLoading(true);
      try {
        await Promise.all([
          fetchProducts(),
          fetchCategories()
        ]);
        console.log('Data loading completed');
        setLoading(false);
      } catch (error) {
        console.error('Error in loadData:', error);
        setLoading(false);
      }
    };
    
    loadData();
  }, [refreshTrigger, selectedClient]);

  // Use handlers hook
  const {
    handleSubmit,
    handleEdit,
    handleDelete,
    resetForm,
    openAddModal,
  } = useProductHandlers({
    formData,
    setFormData,
    editingProduct,
    setEditingProduct,
    categories,
    setShowModal,
    fetchProducts,
  });

  const filteredProducts = !selectedCategory
    ? products
    : products.filter(product => {
        console.log('Filtering product:', product.name);
        console.log('Product category:', product.category);
        console.log('Selected category:', selectedCategory);
        
        if (!selectedCategory || !product.category) return false;
        
        // Check if product's category matches the selected category
        return product.category.id === selectedCategory.id;
      });

  const actionMenu: DataGridActionMenu = {
    actions: [
      {
        label: 'Edit',
        onClick: (product: Product) => handleEdit(product),
        icon: (
          <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.829-2.828z" />
          </svg>
        ),
      },
      {
        label: 'Delete',
        onClick: (product: Product) => handleDelete(product._id || product.id || ''),
        className: 'text-red-600 hover:bg-red-50',
        icon: (
          <svg className="h-4 w-4 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        ),
      },
    ],
  };

  const emptyState: DataGridEmptyState = {
    icon: (
      <svg className="mx-auto h-20 w-20 text-[#193043]" fill="currentColor" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    title: 'No Products Yet',
    description: 'Start building your product catalog by creating your first product. Add detailed information, pricing, and inventory to manage your business effectively.',
    actionButton: {
      text: 'Create Your First Product',
      onClick: () => setShowModal(true),
    },
    tips: [
      '• Organize products by categories for easy management',
      '• Set accurate pricing and cost information',
      '• Track inventory levels to avoid stockouts',
    ],
  };

  if (loading) {
    return (
      <div className='flex min-h-screen flex-col items-center justify-center space-y-4'>
        <LoadingSpinner size='lg' />
        <div className='text-center'>
          <h2 className='text-lg font-medium text-gray-900'>
            Loading Products...
          </h2>
          <p className='mt-1 text-sm text-gray-500'>
            Please wait while we fetch your product information
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="p-6">
      <DataGrid
        data={filteredProducts}
        columns={productColumns}
        actionMenu={actionMenu}
        emptyState={emptyState}
        title="Products Management"
        loading={loading}
        onCreateClick={openAddModal}
        showCreateButton={true}
        createButtonText="Add Product"
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        showCategoryFilter={true}
      />

      <ProductModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        editingProduct={editingProduct}
        formData={formData}
        setFormData={setFormData}
        categories={categories}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
