export default function deepClone<T>(source: T): T {
  const results: Partial<T> = {};
  for (const p in source) {
    if (typeof source[p] === 'object') {
      results[p] = deepClone(source[p]);
    } else {
      results[p] = source[p];
    }
  }
  return results as T;
}
