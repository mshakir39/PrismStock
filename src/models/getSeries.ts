'use server';
import { getCategory } from '@/getData/getCategories';
import { ICategory } from '../../interfaces';

const cache: any = {};

export const getSeries = async (categories: any, option: any) => {
  const key = `${option.label}-${categories[0].id}`;
  if (cache[key]) return cache[key];

  const category = categories.filter(
    (item: ICategory) => item.brandName === option.label
  );
  const getSeries = await getCategory(category[0].id);
  const series = getSeries?.series;
  cache[key] = series;
  return series;
};
