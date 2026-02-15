'use server';
import { executeOperation } from '@/app/libs/executeOperation';
import { serializeDocument } from '@/app/libs/serialize';
import { cookies } from 'next/headers';

export async function getCategories(clientId?: string) {
  try {
    // Get clientId from cookies for multi-tenancy
    const cookieStore = await cookies();
    const selectedClientCookie = cookieStore.get('selectedClient')?.value;
    const effectiveClientId = clientId || selectedClientCookie;

    // Use findAllWithFilter for client filtering, or findAll for no filtering
    let categories;
    if (effectiveClientId) {
      // Filter by clientId for multi-tenancy
      categories = await executeOperation('categories', 'findAllWithFilter', { clientId: effectiveClientId });
    } else {
      categories = await executeOperation('categories', 'findAll');
    }

    // Ensure categories is an array
    const categoriesArray = categories as any[];

    // Sort categories by brandName
    if (Array.isArray(categoriesArray)) {
      categoriesArray.sort((a: any, b: any) => {
        const brandA = a.brandName || '';
        const brandB = b.brandName || '';
        return brandA.localeCompare(brandB);
      });

      // Sort series within each category alphabetically by name
      const sortedCategories = categoriesArray.map((category: any) => {
        if (category.series && Array.isArray(category.series)) {
          category.series = [...category.series].sort((a: any, b: any) =>
            a.name.localeCompare(b.name)
          );
        }
        return category;
      });

      // Ensure proper serialization to plain objects
      const serializedCategories = sortedCategories.map((category: any) => {
        const serialized: any = {};
        for (const key in category) {
          if (key === '_id') {
            serialized['id'] = category[key].toString();
          } else if (key === 'series' && Array.isArray(category[key])) {
            // Ensure series is properly serialized as plain objects
            serialized[key] = category[key].map((item: any) => {
              const seriesItem: any = {};
              for (const itemKey in item) {
                if (itemKey !== '_id') {
                  seriesItem[itemKey] = item[itemKey];
                }
              }
              return seriesItem;
            });
          } else {
            serialized[key] = category[key];
          }
        }
        return serialized;
      });

      return { success: true, data: serializedCategories };
    } else {
      return { success: true, data: [] };
    }
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return { success: false, error: error.message };
  }
}

export async function getCategory(id: string) {
  try {
    const category = await executeOperation('categories', 'findOne', {
      documentId: id,
    }) as Record<string, any> | null;

    if (category) {
      return { success: true, data: serializeDocument(category) };
    } else {
      return { success: false, error: 'Category not found' };
    }
  } catch (error: any) {
    console.error('Error fetching category:', error);
    return { success: false, error: error.message };
  }
}
