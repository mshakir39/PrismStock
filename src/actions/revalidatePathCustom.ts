'use server';

import { revalidatePath } from 'next/cache';

export async function revalidatePathCustom(path: string) {
  revalidatePath(path);
}
