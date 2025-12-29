export class FormDefUtils {
  mergeKeys(keysLeft: string[] | null, keysRight: string[] | null): string[] {
    if (keysLeft === null && keysRight === null) {
      throw new Error('Both keysLeft and keysRight cannot be null');
    }

    if (keysLeft === null) {
      return keysRight == null ? [] : keysRight;
    }

    if (keysRight === null) {
      return keysLeft;
    }

    // Filter out keys from keysRight that already exist in keysLeff
    const uniqueRightKeys = keysRight.filter((key) => !keysLeft.includes(key));
    return [...keysLeft, ...uniqueRightKeys];
  }
}

const formDefUtils = new FormDefUtils();
export default formDefUtils;
