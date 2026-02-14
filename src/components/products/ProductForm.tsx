'use client';

import React from 'react';
import { Product } from '@/interfaces/product';
import Input from '@/components/customInput';
import CustomSelect from '@/components/customSelect';
import CustomTextarea from '@/components/customTextarea';
import CustomCheckbox from '@/components/customCheckbox';
import SearchableCategoryDropdown from './SearchableCategoryDropdown';

interface BreadcrumbItem {
  id: string;
  name: string;
  slug: string;
}

interface SelectedCategory {
  id: string;
  name: string;
  breadcrumb: BreadcrumbItem[];
}

interface ProductFormProps {
  formData: {
    name: string;
    description: string;
    category: SelectedCategory | null;
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
  editingProduct: Product | null;
  categories: any[];
}

export default function ProductForm({
  formData,
  setFormData,
  editingProduct,
  categories
}: ProductFormProps) {

  const handleCategoryChange = (category: SelectedCategory | null) => {
    setFormData({
      ...formData,
      category
    });
  };

  const isBatteryCategory = () => {
    if (!formData.category) return false;
    return formData.category.breadcrumb.some(item => 
      item.name.toLowerCase().includes('battery') || 
      item.name.toLowerCase().includes('batter')
    );
  };

  return (
    <form className="space-y-6 p-4">
      {/* Categories Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Product Category</h3>
        <SearchableCategoryDropdown
          categories={categories}
          value={formData.category}
          onChange={handleCategoryChange}
          placeholder="Search for a category..."
        />
      </div>

      {/* Battery-specific fields */}
      {formData.category && isBatteryCategory() && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Battery Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                type="text"
                label="Plate Count"
                value={formData.plateCount}
                onChange={(e) => setFormData({ ...formData, plateCount: e.target.value })}
                placeholder="e.g., 13, 17"
              />
            </div>

            <div>
              <Input
                type="text"
                label="AH (Ampere Hours)"
                value={formData.ah}
                onChange={(e) => setFormData({ ...formData, ah: e.target.value })}
                placeholder="e.g., 100, 150"
              />
            </div>
          </div>
        </div>
      )}

      {/* Basic Product Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Product Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Input
              type="text"
              label={formData.category && isBatteryCategory() ? 'Battery Name/Model *' : 'Name *'}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={formData.category && isBatteryCategory() ? 'e.g., HT 55 R/L (look at the List from Dealers)' : 'e.g., Product Name'}
              required
            />
          </div>

          <div>
            <CustomSelect
              label="Unit"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              options={[
                { value: 'pcs', label: 'Pieces' },
                { value: 'kg', label: 'Kilograms' },
                { value: 'liters', label: 'Liters' },
                { value: 'meters', label: 'Meters' },
                { value: 'boxes', label: 'Boxes' }
              ]}
            />
          </div>

          <div className="md:col-span-2">
            <CustomTextarea
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Financial Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Financial Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Input
              type="number"
              step="0.01"
              label="Cost ($)"
              value={formData.cost}
              onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
            />
          </div>

          <div>
            <Input
              type="number"
              step="0.01"
              label="Price ($)"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            />
          </div>

          <div>
            <Input
              type="number"
              label="Stock Quantity"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
            />
          </div>

          <div>
            <Input
              type="number"
              label="Minimum Stock"
              value={formData.minStock}
              onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Status */}
      <CustomCheckbox
        id="isActive"
        checked={formData.isActive}
        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
        label="Active"
      />
    </form>
  );
}
