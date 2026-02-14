'use server';

import { revalidatePath } from 'next/cache';

export const revalidatePathCustom = async (path: string) => {
  revalidatePath(path);
};
