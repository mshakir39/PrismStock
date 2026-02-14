function filterData<T extends Record<string, unknown>>(
  item: T,
  searchTerm: string
): boolean {
  const searchKeys = Object.keys(item);

  for (const key of searchKeys) {
    if (
      item[key] !== null &&
      item[key] !== undefined &&
      item[key]?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return true;
    }
  }

  return false;
}

export function filterItems<T extends Record<string, unknown>>(
  data: T[],
  searchTerm: string
): T[] {
  return data?.filter((item) => filterData(item, searchTerm));
}
