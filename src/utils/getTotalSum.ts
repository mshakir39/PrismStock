export function getAllSum<T extends { [key: string]: any }>(
  arr: T[],
  property: keyof T
): number {
  return arr?.reduce((acc, current) => {
    const value = current[property];
    if (value && /^-?\d+(\.\d+)?$/.test(value)) {
      return acc + parseFloat(value);
    }
    return acc;
  }, 0);
}
