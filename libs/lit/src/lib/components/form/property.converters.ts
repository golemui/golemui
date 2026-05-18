import type { ValidateOn } from '@golemui/core';
import { type ComplexAttributeConverter } from 'lit';

export const ValidateOnConverter: ComplexAttributeConverter<ValidateOn | undefined> = {
  fromAttribute(value: string | null): ValidateOn | undefined {
    // Attribute not present -> return undefined
    if (value === null) {
      return undefined;
    }

    // Try with string[]
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed as ValidateOn;
      }
    } catch {
      /* fall through */
    }

    // Ok, it's a string
    return value as ValidateOn;
  },
};
