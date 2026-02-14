'use client';

import React from 'react';
import Button from '@/components/button';
import Modal from '@/components/modal';
import { Product } from '@/interfaces/product';
import ProductForm from './ProductForm';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingProduct: Product | null;
  formData: {
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
  };
  setFormData: (data: any) => void;
  categories: any[];
  onSubmit: (e: React.FormEvent) => void;
}

export default function ProductModal({
  isOpen,
  onClose,
  editingProduct,
  formData,
  setFormData,
  categories,
  onSubmit
}: ProductModalProps) {

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=''
      size="large"
      parentClass='!p-0'
    >
      <div 
        className="rounded-t-lg text-white"
        style={{
          background: 'linear-gradient(to right, #193043, #1e3a5f, #234466)',
        }}
      >
        <h2 className="p-4 text-xl font-semibold">
          {editingProduct ? `Edit Product: ${editingProduct.name}` : 'Create New Product'}
        </h2>
        <p className="px-4 pb-4 text-sm text-white text-opacity-80">
          {editingProduct ? 'Update product details as needed' : 'Fill in details to create a new product'}
        </p>
      </div>
      
      <ProductForm
        formData={formData}
        setFormData={setFormData}
        editingProduct={editingProduct}
        categories={categories}
      />

      <div className="flex justify-end gap-3 pt-4 px-4 pb-4">
        <Button
          type="button"
          onClick={onClose}
          text="Cancel"
          variant="outline"
        />
        <Button
          type="submit"
          text={editingProduct ? 'Update Product' : 'Add Product'}
          variant="fill"
          onClick={onSubmit}
        />
      </div>
    </Modal>
  );
}
