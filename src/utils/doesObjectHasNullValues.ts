export function doesObjectHasNullValues(obj: object) {
  return Object.values(obj).every(
    (value) => value !== null && value !== undefined && value !== ''
  );
}
