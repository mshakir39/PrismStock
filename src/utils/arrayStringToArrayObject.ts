export default function stringArrayToObjectArray(arr: String[]) {
  return arr?.map((item) => {
    return { label: item as string, value: item as string };
  });
}
