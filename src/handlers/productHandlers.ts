'use client';

import { useCallback } from 'react';
import { toast } from 'react-toastify';
import {
  createProductAction,
  updateProductAction,
  deleteProductAction
} from '@/actions/productActions';
import { Product } from '@/interfaces/product';

interface ProductFormData {
  name: string;
  description: string;
  category: {
    id: string;
    name: string;
    breadcrumb: Array<{ id: string; name: string; slug: string }>;
  } | null;
  price: string;
  cost: string;
  stock: string;
  minStock: string;
  unit: string;
  isActive: boolean;
  plateCount: string;
  ah: string;
}

interface UseProductHandlersProps {
  formData: ProductFormData;
  setFormData: (data: ProductFormData) => void;
  editingProduct: Product | null;
  setEditingProduct: (product: Product | null) => void;
  categories: any[];
  setShowModal: (show: boolean) => void;
  fetchProducts: () => void;
}

export function useProductHandlers({
  formData,
  setFormData,
  editingProduct,
  setEditingProduct,
  categories,
  setShowModal,
  fetchProducts
}: UseProductHandlersProps) {

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear all existing toasts first
    toast.dismiss();

    // Form validation
    if (!formData.name.trim()) {
      toast.error('Product name is required');
      return;
    }

    if (formData.name.trim().length < 2) {
      toast.error('Product name must be at least 2 characters');
      return;
    }

    if (formData.name.trim().length > 100) {
      toast.error('Product name must be less than 100 characters');
      return;
    }

    if (formData.price && (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) < 0)) {
      toast.error('Price must be a valid positive number');
      return;
    }

    if (formData.cost && (isNaN(parseFloat(formData.cost)) || parseFloat(formData.cost) < 0)) {
      toast.error('Cost must be a valid positive number');
      return;
    }

    if (formData.stock && (isNaN(parseInt(formData.stock)) || parseInt(formData.stock) < 0)) {
      toast.error('Stock must be a valid positive number');
      return;
    }

    try {
      console.log('Available categories:', categories);
      console.log('Selected category:', formData.category);

      // Build product data with new category structure
      const productData = {
        name: formData.name.trim(),
        description: formData.description?.trim() || '',
        category: formData.category,
        price: formData.price ? parseFloat(formData.price) : undefined,
        cost: formData.cost ? parseFloat(formData.cost) : undefined,
        stock: formData.stock ? parseInt(formData.stock) : undefined,
        minStock: formData.minStock ? parseInt(formData.minStock) : undefined,
        isActive: formData.isActive,
      };

      console.log('Product data being sent to createProductAction:', productData);

      let result;

      if (editingProduct) {
        result = await updateProductAction(editingProduct._id || editingProduct.id || '', {
          name: productData.name,
          description: productData.description,
          category: productData.category,
          price: productData.price,
          cost: productData.cost,
          stock: productData.stock,
          minStock: productData.minStock,
          isActive: productData.isActive,
        });
      } else {
        result = await createProductAction({
          name: productData.name,
          description: productData.description,
          category: productData.category,
          price: productData.price,
          cost: productData.cost,
          stock: productData.stock,
          minStock: productData.minStock,
          isActive: productData.isActive,
        });
      }

      if (result.success) {
        toast.success(result.message || `Product ${editingProduct ? 'updated' : 'created'} successfully`);
        fetchProducts();
        setShowModal(false);
        resetForm();
      } else {
        toast.error(result.error || 'Failed to save product');
      }
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Failed to save product. Please try again.');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);

    // Set category from product data
    const category = product.category || null;

    setFormData({
      name: product.name,
      description: product.description || '',
      category: category,
      price: product.price?.toString() || '',
      cost: product.cost?.toString() || '',
      stock: product.stock?.toString() || '',
      minStock: product.minStock?.toString() || '',
      unit: product.unit || 'pcs',
      isActive: product.isActive,
      // Battery-specific fields
      plateCount: (product as any).plateCount || '',
      ah: (product as any).ah || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (productId: string) => {
    if (!productId) {
      console.error('Product ID is missing or undefined');
      toast.error('Product ID is missing. Cannot delete product.');
      return;
    }

    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      const result = await deleteProductAction(productId);

      if (result.success) {
        toast.success(result.message || 'Product deleted successfully');
        fetchProducts();
      } else {
        toast.error(result.error || 'Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      description: '',
      category: null,
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
    setEditingProduct(null);
  }, [setFormData, setEditingProduct]);

  const openAddModal = useCallback(() => {
    resetForm();
    setShowModal(true);
  }, [resetForm, setShowModal]);

  return {
    handleSubmit,
    handleEdit,
    handleDelete,
    resetForm,
    openAddModal,
  };
}
