'use server';
import { executeOperation } from '@/app/libs/executeOperation';
import { revalidatePath } from 'next/cache';

export const addCategory = async () => {
  try {
    // const isDocumentExists = await executeOperation('categories', 'isExist', {
    //   series: formData.get('series'),
    // });

    // // If the category exists, return an error message
    // if (isDocumentExists) {
    //   return { message: 'Category already exists' };
    // }

    // await executeOperation('categories', 'insertOne', {
    //   series: formData.get('series'),
    //   brandName: formData.get('brandName'),
    // });

    revalidatePath('/category');
    return {
      message: 'Category Successfully Created',
    };
  } catch (err: any) {
    // If an error occurs, return a JSON response with the error message
    return { error: err.message };
  }
};
