import React, { useMemo } from 'react';
import { convertDate } from '@/utils/convertTime';
import Modal from '@/components/modal';
import Table from '@/components/table';
import { ColumnDef } from '@tanstack/react-table';

// Helper function to check if a product is a battery based on its data
const isBatteryProduct = (product: any): boolean => {
  if (!product) return false;
  
  // If isBattery is explicitly set, use that
  if (product.isBattery !== undefined) {
    return Boolean(product.isBattery);
  }
  
  // Check if batteryDetails exist and has relevant fields
  if (product.batteryDetails && (product.batteryDetails.plate || product.batteryDetails.ah)) {
    return true;
  }
  
  // Check if productCategories includes 'batter' (case-insensitive)
  if (product.productCategories) {
    const hasBatteryCategory = product.productCategories.some((cat: any) => {
      if (!cat) return false;
      const categoryName = typeof cat === 'string' ? cat : (cat.name || '');
      return categoryName.toLowerCase().includes('batter');
    });
    
    if (hasBatteryCategory) return true;
  }
  
  // Check if product has warranty code (indicates it's a battery product)
  if (product.warrentyCode && product.warrentyCode.trim() !== '') {
    return true;
  }
  
  return false;
};

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any[] | { products?: any[] } | { [key: string]: any };
  categories?: any[];
}

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  isOpen,
  onClose,
  data,
  categories = [],
}) => {
  const dataArray = Array.isArray(data) 
  ? data 
  : (data && typeof data === 'object' && data !== null
      ? (Array.isArray((data as any).products) && (data as any).products.length > 0 
          ? (data as any).products 
          : ((data as any)[0] ? [(data as any)[0]] : []))
      : []);
  const columns = useMemo<ColumnDef<any>[]>(() => {
    // Base columns that are always shown
    const baseColumns: ColumnDef<any>[] = [
      {
        accessorKey: 'productName',
        header: 'Product',
        cell: ({ row }) => row.original.productName || 'N/A',
      },
      {
        accessorKey: 'category',
        header: 'Category',
        cell: ({ row }) => {
          // First try to use the breadcrumb from category data
          if (row.original.category?.breadcrumb && Array.isArray(row.original.category.breadcrumb)) {
            return row.original.category.breadcrumb.map((item: any) => item.name).join(' > ');
          }
          
          // Second, try to get category from the product data
          if (row.original.category) {
            return row.original.category.brandName || row.original.category.name || 'N/A';
          }
          
          // Third, try to use fullCategoryPath if available
          if (row.original.fullCategoryPath) {
            return row.original.fullCategoryPath;
          }
          
          // Fourth, construct hierarchy from productCategories
          if (row.original.productCategories && row.original.productCategories.length > 0) {
            const categoryItem = row.original.productCategories[0];
            if (typeof categoryItem === 'string') {
              // Direct category ID
              const category = categories.find(cat => cat._id === categoryItem || cat.id === categoryItem);
              return category ? (category.name || category.brandName) : 'Unknown';
            } else if (categoryItem && typeof categoryItem === 'object') {
              // Category object - build hierarchy
              const categoryParts: string[] = [];
              
              // Add parent category if exists
              if (categoryItem.parentCategory) {
                const parentCategory = categories.find(cat =>
                  cat._id === categoryItem.parentCategory || cat.id === categoryItem.parentCategory
                );
                if (parentCategory && parentCategory.name) {
                  categoryParts.push(parentCategory.name);
                }
              }
              
              // Add current category name
              if (categoryItem.name) {
                categoryParts.push(categoryItem.name);
              }
              
              return categoryParts.length > 0 ? categoryParts.join(' → ') : (categoryItem.name || 'Unknown');
            }
          }
          
          return 'N/A';
        },
      },
      {
        accessorKey: 'productPrice',
        header: 'Price/Item',
        cell: ({ row }) => 'Rs ' + (row.original.productPrice || '0'),
      },
      {
        accessorKey: 'quantity',
        header: 'Quantity',
        cell: ({ row }) => row.original.quantity || '0',
      },
    ];

    // Warranty columns that are conditionally shown for battery products
    const warrantyColumns: ColumnDef<any>[] = [
      {
        accessorKey: 'warrentyCode',
        header: 'Battery Code',
        cell: ({ row }) => row.original.warrentyCode || 'N/A',
      },
      {
        accessorKey: 'warrentyStartDate',
        header: 'Warranty Start Date',
        cell: ({ row }) => {
          if (!row.original.warrentyStartDate) return 'N/A';
          const { dateOnly } = convertDate(row.original.warrentyStartDate);
          return <span>{dateOnly}</span>;
        },
      },
      {
        accessorKey: 'warrentyEndDate',
        header: 'Warranty End Date',
        cell: ({ row }) => {
          if (!row.original.warrentyEndDate) return 'N/A';
          const { dateOnly } = convertDate(row.original.warrentyEndDate);
          return <span>{dateOnly}</span>;
        },
      },
    ];

    // Total price column is always shown last
    const totalPriceColumn: ColumnDef<any> = {
      accessorKey: 'totalPrice',
      header: 'Total Price',
      cell: ({ row }) => {
        const price = parseFloat(row.original.productPrice || 0);
        const quantity = parseInt(row.original.quantity || 0, 10);
        const total = !isNaN(price) && !isNaN(quantity) ? price * quantity : 0;
        return 'Rs ' + total.toFixed(2);
      },
    };

    // For each row, check if it's a battery product and include warranty columns if needed
    const dataArray = Array.isArray(data) ? data : (data && typeof data === 'object' && 'products' in data ? (data as any).products : []);
    const allRowsHaveSameType = dataArray.length > 0 && dataArray.every((item: any) => isBatteryProduct(item) === isBatteryProduct(dataArray[0]));
    
    if (allRowsHaveSameType && dataArray.length > 0 && isBatteryProduct(dataArray[0])) {
      return [...baseColumns, ...warrantyColumns, totalPriceColumn];
    }
    
    // For mixed product types or non-battery products, show warranty columns only for battery products
    if (!allRowsHaveSameType) {
      return [
        ...baseColumns,
        ...warrantyColumns.map(col => {
          const baseCell = col.cell;
          return {
            ...col,
            cell: (props: any) => {
              // Only show warranty info for battery products
              if (!isBatteryProduct(props.row.original)) return 'N/A';
              return baseCell ? (typeof baseCell === 'function' ? baseCell(props) : baseCell) : props.getValue();
            }
          };
        }),
        totalPriceColumn
      ];
    }

    // Default return for non-battery products
    return [...baseColumns, totalPriceColumn];
  }, [data]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title='Products Detail'
      size='large'
    >
      <Table
        data={Array.isArray(data) ? data : (data && typeof data === 'object' ? (Array.isArray((data as any).products) && (data as any).products.length > 0 ? (data as any).products : ((data as any)[0] ? [(data as any)[0]] : [])) : [])}
        columns={columns}
        enableSearch={false}
        showButton={false}
      />
    </Modal>
  );
};

export default ProductDetailModal;
