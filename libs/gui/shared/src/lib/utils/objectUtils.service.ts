export class ObjectUtils {
  /**
   * Deep merges two objects, with right taking precedence over left when properties conflict.
   * Arrays are replaced, not merged.
   * @param left - The base object
   * @param right - The object whose properties take precedence
   * @returns A new merged object
   */
  deepMerge<T = any>(left: any, right?: any): T {
    // If right is null/undefined, return left
    if (right === null || right === undefined) {
      return left;
    }

    // If left is null/undefined, return right
    if (left === null || left === undefined) {
      return right;
    }

    // If either is not an object (primitive, array, etc.), right takes precedence
    if (
      typeof left !== 'object' ||
      typeof right !== 'object' ||
      Array.isArray(left) ||
      Array.isArray(right)
    ) {
      return right;
    }

    // Both are objects, merge them
    const result: any = { ...left };

    for (const key in right) {
      if (right.hasOwnProperty(key)) {
        if (
          typeof right[key] === 'object' &&
          !Array.isArray(right[key]) &&
          right[key] !== null &&
          typeof left[key] === 'object' &&
          !Array.isArray(left[key]) &&
          left[key] !== null
        ) {
          // Recursively merge nested objects
          result[key] = this.deepMerge(left[key], right[key]);
        } else {
          // Right takes precedence
          result[key] = right[key];
        }
      }
    }

    return result;
  }
}

const objectUtils = new ObjectUtils();
export default objectUtils;
