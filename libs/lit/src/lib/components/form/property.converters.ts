import * as Core from '@golemui/core';
import { ComplexAttributeConverter } from 'lit';

export const ValidateOnConverter: ComplexAttributeConverter<Core.ValidateOn | undefined> = {
  fromAttribute(value: string | null): Core.ValidateOn | undefined {
    // Attribute not present -> return undefined
    if (value === null) {
      return undefined;
    }

    // Try with string[]
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed as Core.ValidateOn;
      }
    } catch {
      /* fall through */
    }

    // Ok, it's a string
    return value as Core.ValidateOn;
  },
};
